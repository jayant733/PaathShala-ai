import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { agentApi } from '../api/agent.api';
import { chatApi } from '../api/chat.api';
import type { ChatMessage, ConversationItem, ConversationContextResponse } from '../api/chat.api';
import ModelSelector from '../components/chat/ModelSelector';
import RoutingTable from '../components/chat/RoutingTable';
import LearningProfile from '../components/chat/LearningProfile';
import VirtualizedMessageList from '../components/chat/VirtualizedMessageList';
import { parsePresentation } from '../components/ai-response/parsePresentation';
import { useAIStore } from '../store/aiStore';
import { useLearningStore } from '../store/learningStore';
import { documentApi } from '../api/document.api';
import { mlApi } from '../api/ml.api';
import api from '../api/axios';

export default function AIChat() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [context, setContext] = useState<ConversationContextResponse>({ focus: null, topics: [], memories: [] });
  const [pinnedId, setPinnedId] = useState<string | null>(localStorage.getItem('pinned_conversation_id'));
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [routingOpen, setRoutingOpen] = useState(false);

  const currentProvider = useAIStore(state => state.provider);
  const currentModel = useAIStore(state => state.model);

  const [ratedMessages, setRatedMessages] = useState<Record<string, 'like' | 'dislike'>>(() => {
    const saved = localStorage.getItem('ratedMessages');
    if (!saved) return {};
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.warn("Failed to parse ratedMessages from localStorage", e);
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('ratedMessages', JSON.stringify(ratedMessages));
  }, [ratedMessages]);

  // Track learning progress from completed presentations.
  const recordLearning = useLearningStore((s) => s.record);
  // Keep track of which topics we've synced to the backend to prevent duplicate API calls
  const syncedTopicsRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.role !== 'assistant') return;
      const parsed = parsePresentation(msg.content);
      if (parsed.status === 'parsed') {
        recordLearning(parsed.presentation);
        
        const topic = (parsed.presentation.title || '').trim();
        if (topic && !syncedTopicsRef.current.has(topic)) {
          syncedTopicsRef.current.add(topic);
          mlApi.recordStudy(topic).catch(e => console.error("Failed to sync study event:", e));
        }
      }
    });
  }, [messages, recordLearning]);

  const focusComposer = useCallback(() => {
    composerRef.current?.focus();
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();
  
  const hasHandledInitialPrompt = useRef(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  // Whether the chat should keep auto-following the newest content. Disabled
  // when the user scrolls up, re-enabled when they return to the bottom.
  const followRef = useRef(true);
  
  // Streaming state and cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null);
  const [streamingModel, setStreamingModel] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Screen-reader announcement text shown when an AI response completes.
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const prevStreamingRef = useRef<string | null>(null);

  // Announce the completion of a streaming AI response via an aria-live region.
  // Tracks the streamingMessage transition (present -> null) so history loaded
  // from the backend is never announced on initial render.
  useEffect(() => {
    const wasStreaming = prevStreamingRef.current !== null;
    prevStreamingRef.current = streamingMessage;
    if (wasStreaming && streamingMessage === null && !loading) {
      const last = messages[messages.length - 1];
      const text = last?.role === 'assistant' ? (last.content || '').trim() : '';
      setLiveAnnouncement(
        text
          ? `AI response ready. ${text.slice(0, 160)}${text.length > 160 ? '…' : ''}`
          : 'AI response complete.',
      );
    }
  }, [streamingMessage, messages, loading]);

  // Document upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);

  useEffect(() => {
    const handleStorage = () => {
      setPinnedId(localStorage.getItem('pinned_conversation_id'));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
  
  // Cache to prevent UI flashing
  const chatCache = useRef<Record<string, { messages: ChatMessage[], context: ConversationContextResponse }>>({});
  
  // To track active polling timers to prevent overlaps
  const pollingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const fetchConversations = async (optimisticId?: string, optimisticTitle?: string, preventAutoSelect: boolean = false) => {
    try {
      if (optimisticId && optimisticTitle) {
        setConversations(prev => [
          { id: optimisticId, title: optimisticTitle, created_at: new Date().toISOString() },
          ...prev
        ]);
      }
      
      const res = await chatApi.getConversations();
      setConversations(res.conversations);
      
      if (res.conversations.length > 0 && !selectedConversationId && !optimisticId && !preventAutoSelect) {
        setSelectedConversationId(res.conversations[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch conversations", error);
    } finally {
      setFetching(false);
    }
  };

  const fetchContext = useCallback(async (id: string) => {
    try {
      const ctx = await chatApi.getConversationContext(id);
      setContext(ctx);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversationId) return;

    setIsUploadingDocument(true);
    try {
      await documentApi.upload(file, selectedConversationId);
      // Immediately refresh context to show the new document
      await fetchContext(selectedConversationId);
    } catch (error: any) {
      console.error("Failed to upload document", error);
      const detail = error.response?.data?.detail || "Please ensure it is a supported type (PDF, TXT, MD) and try again.";
      alert(`Failed to upload document: ${detail}`);
    } finally {
      setIsUploadingDocument(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    const convId = searchParams.get('conversation_id');
    const prompt = searchParams.get('initial_prompt');
    
    // If there is a prompt but NO convId, we must prevent auto-selecting the latest history item
    const shouldPreventAutoSelect = !!prompt && !convId;

    fetchConversations(undefined, undefined, shouldPreventAutoSelect).then(() => {
      if (convId) {
        setSelectedConversationId(convId);
      } else if (prompt) {
        // Explicitly clear selected conversation to guarantee a fresh slate
        setSelectedConversationId(undefined);
      }
      
      if (prompt && !hasHandledInitialPrompt.current) {
        hasHandledInitialPrompt.current = true;
        // Clear params to avoid loop
        searchParams.delete('initial_prompt');
        setSearchParams(searchParams);
        // We set input and trigger send
        setInput(prompt);
        setTimeout(() => {
          handleSend(undefined, prompt);
        }, 100);
      }
    });
    
    return () => {
      pollingTimers.current.forEach(clearTimeout);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchConversationData = useCallback(async (id: string, isPolling = false) => {
    if (!isPolling) setFetching(true);
    
    try {
      const [msgRes, ctxRes] = await Promise.all([
        chatApi.getConversationMessages(id),
        chatApi.getConversationContext(id)
      ]);
      
      console.log("Fetched messages:", msgRes.messages.length, "Closure ID:", selectedConversationId, "Param ID:", id);
      if (selectedConversationId === id || isPolling) {
        setMessages(msgRes.messages);
        setContext(ctxRes);
        
        chatCache.current[id] = {
          messages: msgRes.messages,
          context: ctxRes
        };
      } else {
        console.warn("MISMATCH! Not setting messages. Closure:", selectedConversationId, "Param:", id);
      }
    } catch (error) {
      console.error("Failed to fetch conversation data", error);
    } finally {
      if (!isPolling) setFetching(false);
    }
  }, [selectedConversationId]);

  useEffect(() => {
    if (selectedConversationId) {
      // Opening a conversation means following its newest message.
      followRef.current = true;
      // Clear previous polls
      pollingTimers.current.forEach(clearTimeout);
      pollingTimers.current = [];
      
      // Load from cache first if available
      if (chatCache.current[selectedConversationId]) {
        setMessages(chatCache.current[selectedConversationId].messages);
        setContext(chatCache.current[selectedConversationId].context);
        // Silently revalidate in background
        fetchConversationData(selectedConversationId, true);
      } else {
        fetchConversationData(selectedConversationId);
      }
    } else {
      setMessages([]);
      setContext({ focus: null, topics: [], memories: [] });
    }
  }, [selectedConversationId, fetchConversationData]);

  // Track whether the user is following the newest content. Auto-follow pauses
  // when the user scrolls up and resumes once they return to (near) the bottom.
  // The boolean is driven by the virtualized list's onBottomStateChange; only the
  // flag is lifted here so a new send can re-enable following.
  const handleRate = (id: string, vote: 'like' | 'dislike', content: string) => {
    if (ratedMessages[id]) return;
    setRatedMessages(prev => ({ ...prev, [id]: vote }));

    if (vote === 'like' && content) {
      let cleanContent = content;
      const parsed = parsePresentation(content);
      if (parsed.status === 'parsed' && parsed.presentation) {
        const p = parsed.presentation;
        cleanContent = [p.title, p.summary, p.markdown].filter(Boolean).join('\n').trim();
      } else if (parsed.status === 'invalid' && parsed.markdown) {
        cleanContent = parsed.markdown;
      }

      // Optimistically update the UI immediately
      setContext(prev => ({
        ...prev,
        memories: [cleanContent, ...prev.memories]
      }));

      // Send to memory with the current conversation_id so it's scoped per chat
      api.post('/api/v1/memory', { content: cleanContent, memory_type: 'preference', conversation_id: selectedConversationId })
        .then(() => {
          // Refresh context from server to ensure sync
          if (selectedConversationId) fetchConversationData(selectedConversationId, true);
        })
        .catch(err => {
          console.error(err);
          alert(`Memory Save Error: ${err.response?.data?.detail || err.message}`);
          // Revert optimistic update if it fails
          if (selectedConversationId) fetchConversationData(selectedConversationId, true);
        });
    }
  };

  const triggerContextPolling = (id: string) => {
    // Clear old timers
    pollingTimers.current.forEach(clearTimeout);
    pollingTimers.current = [];
    
    // Poll at 1s, 4s, and 8s to catch the async background memory extraction task
    const delays = [1000, 4000, 8000];
    delays.forEach(delay => {
      const timer = setTimeout(() => {
        if (selectedConversationId === id) {
          fetchConversationData(id, true);
        }
      }, delay);
      pollingTimers.current.push(timer);
    });
  };

  const handleSend = async (e?: React.FormEvent, customMessage?: string) => {
    e?.preventDefault();
    const msgToSend = customMessage || input.trim();
    if (!msgToSend || loading || isGenerating) return;

    setInput('');
    setLoading(true);
    setIsGenerating(true);
    // A new send re-enables auto-follow so the fresh response is tracked.
    followRef.current = true;

    // Clear old controller if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    const optimisticUserMsg: ChatMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: msgToSend, 
      created_at: new Date().toISOString() 
    };
    
    // We do NOT add the optimistic AI message to the messages array yet.
    // Instead we rely on streamingMessage.
    setStreamingMessage('');
    setStreamingModel(null);
    setMessages(prev => [...prev, optimisticUserMsg]);

    let activeId = selectedConversationId;
    let fullResponse = '';
    const currentMode = useAIStore.getState().mode;
    const currentProvider = useAIStore.getState().provider;
    const currentModel = useAIStore.getState().model;

    console.log("[Chat] Sending message with:", {
      provider: currentProvider,
      model: currentModel,
      mode: currentMode
    });

    await agentApi.chatStream({
      message: msgToSend,
      conversation_id: selectedConversationId,
      ai_mode: currentMode,
      provider: currentMode === 'auto' ? undefined : currentProvider,
      model_name: currentMode === 'auto' ? undefined : currentModel
    }, (chunk, isDone, error, modelName, conversationId) => {
      if (conversationId) {
        activeId = conversationId;
      }

      if (error) {
        setStreamingMessage(null);
        setStreamingModel(null);
        if (!selectedConversationId && activeId) {
          setSelectedConversationId(activeId);
          fetchConversations();
        }
        setMessages(prev => [...prev, { 
          id: (Date.now() + 1).toString(), 
          role: 'assistant', 
          content: `Error: ${error || 'AI temporarily unavailable'}`, 
          created_at: new Date().toISOString()
        }]);
        setLoading(false);
        setIsGenerating(false);
        return;
      }
      
      try {
        JSON.parse(`{ "chunk": "${chunk.replace(/"/g, '\\"')}" }`);
      } catch (e) {}

      fullResponse += chunk;
      
      setStreamingMessage(fullResponse);
      if (modelName) setStreamingModel(modelName);
      
      if (isDone) {
        setLoading(false);
        setIsGenerating(false);
        
        const finalModel = modelName || useAIStore.getState().model;
        const finalAiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: fullResponse,
          model: finalModel,
          model_used: finalModel,
          created_at: new Date().toISOString()
        };
        
        // Push final message and clear stream state
        setMessages(prev => [...prev, finalAiMsg]);
        setStreamingMessage(null);
        setStreamingModel(null);
        abortControllerRef.current = null;
        
        // Broadcast event for Dashboard refresh
        window.dispatchEvent(new Event('conversationFinished'));
        
        if (!selectedConversationId && activeId) {
          setSelectedConversationId(activeId);
          fetchConversations();
        }
        
        if (activeId) {
           chatCache.current[activeId] = { 
             context: chatCache.current[activeId]?.context || { focus: null, topics: [], memories: [] },
             messages: [...chatCache.current[activeId]?.messages || messages, optimisticUserMsg, finalAiMsg]
           };
           triggerContextPolling(activeId);
        }
      }
    }, abortControllerRef.current.signal);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await chatApi.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      delete chatCache.current[id];
      if (selectedConversationId === id) {
        setSelectedConversationId(undefined);
        setMessages([]);
        setContext({ focus: null, topics: [], memories: [] });
      }
      if (pinnedId === id) {
        localStorage.removeItem('pinned_conversation_id');
        setPinnedId(null);
      }
    } catch (err) {
      console.error("Failed to delete conversation", err);
      alert('Failed to delete conversation');
    }
  };

  const handleTogglePin = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (pinnedId === id) {
      localStorage.removeItem('pinned_conversation_id');
      setPinnedId(null);
    } else {
      localStorage.setItem('pinned_conversation_id', id);
      setPinnedId(id);
    }
    window.dispatchEvent(new Event('storage'));
  };

  const isToday = (dateString: string) => {
    const d = new Date(dateString);
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  const todayConvs = conversations.filter(c => isToday(c.created_at));
  const olderConvs = conversations.filter(c => !isToday(c.created_at));

  return (
    <div className="flex flex-col w-full h-[calc(100vh-80px)] bg-surface">
      <div className="flex flex-1 w-full overflow-hidden">
        
        {/* Left: Conversation History */}
        <aside className="w-64 xl:w-72 border-r-2 border-surface-border bg-surface-container-low flex flex-col shrink-0 overflow-y-auto">
          <div className="p-6 border-b-2 border-surface-border bg-surface">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-headline-lg text-xl text-on-surface">History</h2>
              <div className="flex items-center gap-1">
                <button onClick={() => setRoutingOpen(true)} className="w-8 h-8 rounded border-2 border-surface-border bg-surface hover:bg-secondary-container flex items-center justify-center transition-colors" title="Model Routing Table">
                  <span className="material-symbols-outlined text-[18px]">route</span>
                </button>
                <button onClick={() => setSelectedConversationId(undefined)} className="w-8 h-8 rounded border-2 border-surface-border bg-surface hover:bg-secondary-container flex items-center justify-center transition-colors" title="New Chat">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
            </div>
            {/* Learner's journey: progress %, completed lessons, etc */}
            <LearningProfile />
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 && !fetching && (
              <div className="p-6 text-center mt-4">
                <div className="w-12 h-12 rounded-full bg-surface-container-highest mx-auto mb-3 flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant/50 text-[24px]">forum</span>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">No conversations yet.<br/>Start your first chat.</p>
              </div>
            )}
            
            {todayConvs.length > 0 && (
              <>
                <div className="px-2 pt-2 pb-1">
                  <span className="font-label-sm text-label-sm text-on-surface-variant/70 uppercase tracking-wider">Today</span>
                </div>
                {todayConvs.map(conv => (
                  <div 
                    key={conv.id} 
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={`block p-3 rounded-lg relative group cursor-pointer transition-colors flex items-center justify-between ${selectedConversationId === conv.id ? 'bg-surface-container-highest' : 'hover:bg-surface-container-high'}`}
                  >
                    {selectedConversationId === conv.id && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"></div>
                    )}
                    <p className={`font-body-sm text-body-sm truncate pr-20 transition-colors ${selectedConversationId === conv.id ? 'text-primary font-medium' : 'text-on-surface group-hover:text-primary'}`}>
                      {conv.title}
                    </p>
                    <div
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      className={`
                        absolute right-11 p-1.5 rounded-full transition-all duration-200
                        opacity-0 -translate-x-2 text-on-surface-variant hover:text-error hover:bg-error/10 group-hover:opacity-100 group-hover:translate-x-0
                      `}
                      title="Delete chat"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </div>
                    <div
                      onClick={(e) => handleTogglePin(e, conv.id)}
                      className={`
                        absolute right-2 p-1.5 rounded-full transition-all duration-200
                        ${pinnedId === conv.id
                          ? 'opacity-100 text-primary bg-primary/10'
                          : 'opacity-0 -translate-x-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 group-hover:opacity-100 group-hover:translate-x-0'
                        }
                      `}
                      title={pinnedId === conv.id ? 'Unpin' : 'Pin chat'}
                    >
                      <span className="material-symbols-outlined text-[16px]">push_pin</span>
                    </div>
                  </div>
                ))}
              </>
            )}

            {olderConvs.length > 0 && (
              <>
                <div className="px-2 pt-4 pb-1">
                  <span className="font-label-sm text-label-sm text-on-surface-variant/70 uppercase tracking-wider">Previous</span>
                </div>
                {olderConvs.map(conv => (
                  <div 
                    key={conv.id} 
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={`block p-3 rounded-lg relative group cursor-pointer transition-colors flex items-center justify-between ${selectedConversationId === conv.id ? 'bg-surface-container-highest' : 'hover:bg-surface-container-high'}`}
                  >
                    {selectedConversationId === conv.id && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"></div>
                    )}
                    <p className={`font-body-sm text-body-sm truncate pr-20 transition-colors ${selectedConversationId === conv.id ? 'text-primary font-medium' : 'text-on-surface group-hover:text-primary'}`}>
                      {conv.title}
                    </p>
                    <div
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      className={`
                        absolute right-11 p-1.5 rounded-full transition-all duration-200
                        opacity-0 -translate-x-2 text-on-surface-variant hover:text-error hover:bg-error/10 group-hover:opacity-100 group-hover:translate-x-0
                      `}
                      title="Delete chat"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </div>
                    <div
                      onClick={(e) => handleTogglePin(e, conv.id)}
                      className={`
                        absolute right-2 p-1.5 rounded-full transition-all duration-200
                        ${pinnedId === conv.id
                          ? 'opacity-100 text-primary bg-primary/10'
                          : 'opacity-0 -translate-x-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 group-hover:opacity-100 group-hover:translate-x-0'
                        }
                      `}
                      title={pinnedId === conv.id ? 'Unpin' : 'Pin chat'}
                    >
                      <span className="material-symbols-outlined text-[16px]">push_pin</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </aside>

        {/* Center: Chat Interface */}
        <section className="flex-1 min-w-0 flex flex-col bg-surface overflow-hidden border-r-2 border-surface-border">
          {/* Header - using AI Tutor style */}
          <div className="p-4 border-b-2 border-surface-border bg-surface flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary border-2 border-surface-border flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
              </div>
              <div>
                <h2 className="font-button-text text-on-surface">PaathShala AI Tutor</h2>
                <p className="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full border border-surface-border bg-secondary animate-pulse"></span> Adaptive Engine
                </p>
              </div>
            </div>
            {/* Bold Visual Indicator for Model */}
            <div className="px-3 py-1 bg-surface-container-low border-2 border-surface-border rounded shadow-[2px_2px_0px_0px_#111827] flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">memory</span>
              <span className="font-label-caps uppercase text-[10px] text-on-surface">
                {currentProvider === 'gemini' ? 'Gemini (Cloud)' : `${currentModel || 'Ollama'} (Local)`}
              </span>
            </div>
          </div>

          <VirtualizedMessageList
            messages={messages}
            streamingMessage={streamingMessage}
            streamingModel={streamingModel}
            loading={loading}
            fetching={fetching}
            provider={currentProvider}
            currentModel={currentModel}
            ratedMessages={ratedMessages}
            followRef={followRef}
            conversationId={selectedConversationId}
            onSend={(p) => handleSend(undefined, p)}
            onFocusInput={focusComposer}
            onRate={handleRate}
          />

          <div className="p-6 bg-surface border-t-2 border-surface-border">
            <form onSubmit={handleSend} className="flex items-center gap-2 bg-surface-container-low border-2 border-surface-border rounded-xl p-2 shadow-[4px_4px_0px_0px_#111827]">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.txt,.md" 
                onChange={handleFileUpload} 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingDocument || !selectedConversationId}
                className="p-2 text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50"
              >
                {isUploadingDocument ? <span className="material-symbols-outlined animate-spin">sync</span> : <span className="material-symbols-outlined">attach_file</span>}
              </button>

              <input
                ref={composerRef as any}
                type="text"
                className="flex-1 bg-transparent border-none outline-none font-body-md px-2 placeholder:text-on-surface-variant/50"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message AI Tutor..."
              />

              <div className="flex items-center gap-2 border-l-2 border-surface-border pl-2">
                <ModelSelector 
                  disabled={loading} 
                  onModelChange={(_p, _m, _mode) => {}}
                />
                
                <button type="button" className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">mic</span>
                </button>
                
                {isGenerating ? (
                  <button
                    type="button"
                    onClick={() => abortControllerRef.current?.abort()}
                    className="w-10 h-10 bg-error text-on-error rounded border-2 border-surface-border flex items-center justify-center hover:bg-error/90 transition-colors"
                  >
                    <span className="material-symbols-outlined">stop</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="w-10 h-10 bg-primary text-on-primary rounded border-2 border-surface-border flex items-center justify-center hover:bg-primary-container transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                  </button>
                )}
              </div>
            </form>
            <div className="text-center mt-2">
              <span className="font-label-caps text-[10px] text-on-surface-variant">AI can make mistakes. Consider verifying important information.</span>
            </div>
          </div>
        </section>

        {/* Visually hidden live region: announces completed AI responses to
            screen readers without disturbing the layout. */}
        <div role="status" aria-live="polite" className="sr-only">
          {liveAnnouncement}
        </div>

        {/* Right: Context Panel */}
        <aside className="w-64 xl:w-72 bg-surface-container flex flex-col shrink-0 overflow-y-auto">
          
          {/* Focus */}
          <div className="p-6 border-b-2 border-surface-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline-lg text-lg flex items-center gap-2">
                <span className="material-symbols-outlined">center_focus_strong</span> Focus
              </h3>
              <button onClick={() => fileInputRef.current?.click()} className="w-8 h-8 flex items-center justify-center border-2 border-surface-border rounded bg-surface hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
            
            {context.focus ? (
              <div className="bg-surface border-2 border-surface-border p-4 rounded-xl shadow-[4px_4px_0px_0px_#111827] flex items-center gap-3">
                <div className="w-8 h-8 rounded border-2 border-surface-border bg-error/10 text-error flex items-center justify-center flex-shrink-0">
                  <span className="font-label-caps text-[10px] font-bold">DOC</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-label-md text-label-md text-on-surface truncate">{context.focus}</p>
                </div>
              </div>
            ) : (
              <div className="bg-surface border-2 border-dashed border-surface-border p-4 rounded-xl text-center">
                <span className="material-symbols-outlined text-on-surface-variant mb-2">description</span>
                <p className="font-body-md text-sm text-on-surface-variant">No document attached.</p>
              </div>
            )}
          </div>

          {/* Topics */}
          <div className="p-6 border-b-2 border-surface-border">
            <h3 className="font-headline-lg text-lg flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined">sell</span> Topics
            </h3>
            {context.topics.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {context.topics.map((topic, i) => {
                  const colors = ['bg-mint-accent text-primary', 'bg-error-container text-on-error-container', 'bg-secondary-container text-on-secondary-container'];
                  const c = colors[i % colors.length];
                  return (
                    <button 
                      key={i}
                      onClick={() => handleSend(undefined, `Tell me more about ${topic}`)}
                      className={`inline-flex items-center gap-1 px-3 py-1 ${c} border-2 border-surface-border rounded-full font-label-caps shadow-[2px_2px_0px_0px_#111827] hover:-translate-y-[1px] transition-transform`}
                    >
                      <span className="material-symbols-outlined text-[14px]">schedule</span> due: {topic.length > 15 ? topic.slice(0, 15) + '...' : topic}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="bg-surface border-2 border-dashed border-surface-border p-4 rounded-xl text-center">
                <span className="material-symbols-outlined text-on-surface-variant mb-2">sell</span>
                <p className="font-body-md text-sm text-on-surface-variant">No topics identified yet.</p>
              </div>
            )}
          </div>

          {/* AI Memory */}
          <div className="p-6 flex-1">
            <h3 className="font-headline-lg text-lg flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined">memory</span> AI Memory
            </h3>
            {context.memories.length > 0 ? (
              <div className="space-y-4">
                {context.memories.map((mem, i) => (
                  <div key={i} className="bg-surface border-2 border-surface-border p-4 rounded-xl shadow-[4px_4px_0px_0px_#111827]">
                    <p className="font-body-md text-sm text-on-surface-variant line-clamp-4" title={mem}>{mem}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-surface border-2 border-surface-border p-4 rounded-xl text-center shadow-[4px_4px_0px_0px_#111827]">
                <div className="w-12 h-12 mx-auto bg-primary text-on-primary rounded-full border-2 border-surface-border flex items-center justify-center mb-3 animate-pulse">
                  <span className="material-symbols-outlined">psychology</span>
                </div>
                <p className="font-body-md text-sm text-on-surface-variant">AI is learning about your preferences...</p>
              </div>
            )}
          </div>
        </aside>
      </div>
      <RoutingTable open={routingOpen} onClose={() => setRoutingOpen(false)} />
    </div>
  );
}

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { agentApi } from '../api/agent.api';
import { chatApi } from '../api/chat.api';
import type { ChatMessage, ConversationItem, ConversationContextResponse } from '../api/chat.api';
import AIResponseRenderer from '../components/chat/AIResponseRenderer';
import ModelSelector from '../components/chat/ModelSelector';
import { useAIStore } from '../store/aiStore';
import { Brain, FileText, Tag, Cpu, RefreshCw, Paperclip, Mic, ArrowUp, Loader2 } from 'lucide-react';
import { documentApi } from '../api/document.api';
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
  
  const currentProvider = useAIStore(state => state.provider);
  const currentModel = useAIStore(state => state.model);
  const currentMode = useAIStore(state => state.mode);
  
  const [ratedMessages, setRatedMessages] = useState<Record<string, 'like' | 'dislike'>>(() => {
    const saved = localStorage.getItem('ratedMessages');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('ratedMessages', JSON.stringify(ratedMessages));
  }, [ratedMessages]);
  
  const [searchParams, setSearchParams] = useSearchParams();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasHandledInitialPrompt = useRef(false);
  
  // Streaming state and cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null);
  const [streamingModel, setStreamingModel] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
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
      
      if (selectedConversationId === id || isPolling) {
        setMessages(msgRes.messages);
        setContext(ctxRes);
        
        chatCache.current[id] = {
          messages: msgRes.messages,
          context: ctxRes
        };
      }
    } catch (error) {
      console.error("Failed to fetch conversation data", error);
    } finally {
      if (!isPolling) setFetching(false);
    }
  }, [selectedConversationId]);

  useEffect(() => {
    if (selectedConversationId) {
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

  useEffect(() => {
    if (messages.length > 0 && !fetching) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, fetching]);

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
    }, (chunk, isDone, error, modelName) => {
      if (error) {
        setStreamingMessage(null);
        setStreamingModel(null);
        setMessages(prev => [...prev, { 
          id: (Date.now() + 1).toString(), 
          role: 'assistant', 
          content: 'Error: AI temporarily unavailable', 
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
          created_at: new Date().toISOString()
        };
        
        // Push final message and clear stream state
        setMessages(prev => [...prev, finalAiMsg]);
        setStreamingMessage(null);
        setStreamingModel(null);
        abortControllerRef.current = null;
        
        // Broadcast event for Dashboard refresh
        window.dispatchEvent(new Event('conversationFinished'));
        
        if (!selectedConversationId) {
          fetchConversations(undefined, msgToSend.slice(0, 30));
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
    <div className="flex flex-col w-full h-[calc(100vh-64px)] overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9IiMwZDE0MWQiLz4KPHBhdGggZD0iTTAgMGgxdjQwaC0xeiIgZmlsbD0iIzI4MjkzZCIgZmlsbC1vcGFjaXR5PSIuMiIvPgo8cGF0aCBkPSJNMCAwaDQwdjFoLTQweiIgZmlsbD0iIzI4MjkzZCIgZmlsbC1vcGFjaXR5PSIuMiIvPgo8L3N2Zz4=')]">
      <div className="flex flex-1 overflow-hidden p-stack-md gap-stack-md">
        
        {/* Left: Conversation History */}
        <aside className="w-64 flex-shrink-0 flex flex-col bg-surface-container-low rounded-xl shadow-md overflow-hidden transition-all duration-300 border border-surface-container-highest/20">
          <div className="p-4 bg-surface-container flex items-center justify-between border-b border-surface-container-highest/30">
            <h3 className="font-title-md text-title-md text-on-surface flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-primary" /> History
            </h3>
            <button 
              onClick={() => setSelectedConversationId(undefined)}
              className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors group"
              title="New Chat"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
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
                    <p className={`font-body-sm text-body-sm truncate pr-6 transition-colors ${selectedConversationId === conv.id ? 'text-primary font-medium' : 'text-on-surface group-hover:text-primary'}`}>
                      {conv.title}
                    </p>
                    <div 
                      onClick={(e) => handleTogglePin(e, conv.id)}
                      className={`
                        absolute right-2 p-1.5 rounded-full transition-all duration-200
                        ${pinnedId === conv.id 
                          ? 'opacity-100 text-primary bg-primary/10' 
                          : 'opacity-0 -translate-x-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 group-hover:opacity-100 group-hover:translate-x-0'
                        }
                      `}
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
                    <p className={`font-body-sm text-body-sm truncate pr-6 transition-colors ${selectedConversationId === conv.id ? 'text-primary font-medium' : 'text-on-surface group-hover:text-primary'}`}>
                      {conv.title}
                    </p>
                    <div 
                      onClick={(e) => handleTogglePin(e, conv.id)}
                      className={`
                        absolute right-2 p-1.5 rounded-full transition-all duration-200
                        ${pinnedId === conv.id 
                          ? 'opacity-100 text-primary bg-primary/10' 
                          : 'opacity-0 -translate-x-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 group-hover:opacity-100 group-hover:translate-x-0'
                        }
                      `}
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
        <main className="flex-1 flex flex-col bg-surface-container-low rounded-xl shadow-lg relative overflow-hidden border border-surface-container-highest/20">
          <div className="p-4 bg-surface-container/80 backdrop-blur-md flex items-center justify-between border-b border-surface-container-highest/30 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-title-md text-title-md text-on-surface">PaathShala AI Tutor</h2>
                <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span> Adaptive Learning Engine
                </p>
              </div>
            </div>
            {/* Bold Visual Indicator for Model */}
            <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-full flex items-center gap-2 shadow-sm">
              <Cpu className="w-4 h-4 text-primary" />
              <span className="font-label-md text-label-md font-bold text-on-surface">
                Currently conversing with: {currentProvider === 'gemini' ? 'Gemini (Cloud)' : `${currentModel || 'Ollama'} (Local Machine)`}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-stack-lg space-y-stack-lg scroll-smooth" id="chat-container">
            {messages.length === 0 && !fetching && (
              <div className="h-full flex flex-col items-center justify-center text-center text-on-surface-variant px-4">
                <div className="w-20 h-20 rounded-3xl bg-surface-container-highest flex items-center justify-center mb-6 shadow-inner border border-outline-variant/10">
                  <Brain className="w-10 h-10 text-primary opacity-80" />
                </div>
                <h2 className="text-headline-sm font-medium text-on-surface mb-2">How can I help you learn today?</h2>
                <p className="max-w-md text-body-md text-on-surface-variant/80">
                  Ask me to break down a complex topic into slides, quiz you, or analyze an uploaded document.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} max-w-5xl mx-auto w-full group`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center mr-4 mt-1 border border-primary/20">
                    <Brain className="w-4 h-4 text-primary" />
                  </div>
                )}
                
                {msg.role === 'user' ? (
                  <div className="bg-primary text-on-primary rounded-2xl rounded-tr-sm p-4 shadow-sm max-w-[75%]">
                    <p className="font-body-md text-body-md whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ) : (
                  <div className="flex-1 w-full max-w-[90%]">
                    {/* Render AI responses via the advanced renderer */}
                    <AIResponseRenderer content={msg.content} />
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-[10px] text-on-surface-variant font-mono bg-surface-container-highest px-2 py-0.5 rounded border border-outline-variant/10">
                        {msg.model ? msg.model : (currentProvider === 'gemini' ? 'gemini' : currentModel)}
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            if (ratedMessages[msg.id]) return;
                            setRatedMessages(prev => ({ ...prev, [msg.id]: 'like' }));
                            // Optimistically update the UI immediately
                            setContext(prev => ({
                              ...prev,
                              memories: [msg.content, ...prev.memories]
                            }));
                            
                            // Send to memory with the current conversation_id so it's scoped per chat
                            api.post('/api/v1/memory', { content: msg.content, memory_type: 'preference', conversation_id: selectedConversationId })
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
                          }}
                          disabled={!!ratedMessages[msg.id]}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                            ratedMessages[msg.id] === 'like' ? 'text-primary bg-primary/20' : 'text-on-surface-variant hover:text-primary hover:bg-primary/10'
                          } ${ratedMessages[msg.id] ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                          <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                        </button>
                        <button 
                          onClick={() => {
                            if (ratedMessages[msg.id]) return;
                            setRatedMessages(prev => ({ ...prev, [msg.id]: 'dislike' }));
                          }}
                          disabled={!!ratedMessages[msg.id]}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                            ratedMessages[msg.id] === 'dislike' ? 'text-error bg-error/20' : 'text-on-surface-variant hover:text-error hover:bg-error/10'
                          } ${ratedMessages[msg.id] ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                          <span className="material-symbols-outlined text-[16px]">thumb_down</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {streamingMessage !== null && (
              <div className="flex justify-start max-w-5xl mx-auto w-full group">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center mr-4 mt-1 border border-primary/20">
                  <Brain className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <div className="flex-1 w-full max-w-[90%]">
                  <AIResponseRenderer content={streamingMessage} />
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-[10px] text-on-surface-variant font-mono bg-surface-container-highest px-2 py-0.5 rounded border border-outline-variant/10 flex items-center gap-2">
                      {streamingModel || (currentProvider === 'gemini' ? 'gemini' : currentModel)}
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-tertiary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                        <div className="w-1 h-1 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loading && streamingMessage === null && (
              <div className="flex justify-start max-w-5xl mx-auto w-full group">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center mr-4 mt-1 border border-primary/20">
                  <Brain className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <div className="flex items-center gap-3 bg-surface-container-highest px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm border border-outline-variant/10">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-tertiary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant italic">PaathShala AI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-gradient-to-t from-surface-container-low via-surface-container-low/90 to-transparent z-10 pt-10">
            <div className="max-w-4xl mx-auto relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-tertiary/10 to-secondary/10 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition duration-1000 group-focus-within:opacity-100"></div>
              <form onSubmit={handleSend} className="relative bg-surface-container-highest rounded-2xl shadow-lg flex flex-col p-2 border border-outline-variant/20">
                <textarea 
                  className="w-full bg-transparent resize-none border-none focus:ring-0 p-3 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 min-h-[56px] max-h-48"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto'; 
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Message AI Tutor..." 
                  rows={1}
                />
                <div className="flex items-center justify-between px-2 pb-1 pt-2">
                  <div className="flex items-center gap-1">
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
                      className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                    >
                      {isUploadingDocument ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                    </button>
                    <button type="button" className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors">
                      <Mic className="w-4 h-4" />
                    </button>
                    <div className="ml-2">
                      <ModelSelector 
                        disabled={loading} 
                        onModelChange={(p, m, mode) => {
                          // Handled via aiStore internally
                        }} 
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={!input.trim() || loading}
                    className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-md hover:bg-primary-container transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <ArrowUp className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>

        {/* Right: Context Panel */}
        <aside className="w-72 flex-shrink-0 flex flex-col gap-4 overflow-y-auto no-scrollbar">
          
          {/* Focus */}
          <div className="bg-surface-container-low rounded-xl p-5 shadow-sm border border-surface-container-highest/20">
            <h3 className="font-title-sm text-title-sm text-on-surface flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-primary" /> Focus
            </h3>
            {context.focus ? (
              <div className="p-3 bg-surface-container rounded-lg flex items-start gap-3 border border-outline-variant/10">
                <div className="w-8 h-8 rounded bg-error/10 text-error flex items-center justify-center flex-shrink-0">
                  <span className="font-label-sm text-label-sm font-bold">DOC</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-label-md text-label-md text-on-surface truncate">{context.focus}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-surface-container-highest/50 rounded-lg text-center border border-dashed border-outline-variant/30">
                <FileText className="w-6 h-6 text-on-surface-variant/40 mx-auto mb-2" />
                <p className="font-body-sm text-body-sm text-on-surface-variant">No document attached.<br/>Upload to enable document-aware learning.</p>
              </div>
            )}
          </div>

          {/* Topics */}
          <div className="bg-surface-container-low rounded-xl p-5 shadow-sm border border-surface-container-highest/20">
            <h3 className="font-title-sm text-title-sm text-on-surface flex items-center gap-2 mb-4">
              <Tag className="w-4 h-4 text-tertiary" /> Topics
            </h3>
            {context.topics.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {context.topics.map((topic, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSend(undefined, `Tell me more about ${topic}`)}
                    className="px-3 py-1.5 bg-surface-container text-on-surface hover:text-primary hover:bg-primary/10 rounded-lg font-label-sm text-label-sm border border-outline-variant/20 transition-colors text-left"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-surface-container-highest/50 rounded-lg text-center border border-dashed border-outline-variant/30">
                <Tag className="w-6 h-6 text-on-surface-variant/40 mx-auto mb-2" />
                <p className="font-body-sm text-body-sm text-on-surface-variant">Topics will appear as you learn in this conversation.</p>
              </div>
            )}
          </div>

          {/* AI Memory */}
          <div className="bg-surface-container-low rounded-xl p-5 shadow-sm border border-surface-container-highest/20 flex-1">
            <h3 className="font-title-sm text-title-sm text-on-surface flex items-center gap-2 mb-4">
              <Cpu className="w-4 h-4 text-secondary" /> AI Memory
            </h3>
            {context.memories.length > 0 ? (
              <div className="space-y-3">
                {context.memories.map((mem, i) => (
                  <div key={i} className="p-3 bg-surface-container-highest/50 rounded-lg border-l-2 border-secondary shadow-sm">
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed line-clamp-4" title={mem}>{mem}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-surface-container-highest/50 rounded-lg text-center border border-dashed border-outline-variant/30 h-32 flex flex-col items-center justify-center">
                <Cpu className="w-6 h-6 text-on-surface-variant/40 mb-2 animate-pulse" />
                <p className="font-body-sm text-body-sm text-on-surface-variant">AI is learning about your preferences...</p>
              </div>
            )}
          </div>

        </aside>
      </div>
    </div>
  );
}

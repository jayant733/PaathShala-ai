import { useState, useRef, useEffect } from 'react';
import { agentApi } from '../api/agent.api';
import { Send, Bot, Route } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  agent?: string;
}

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await agentApi.chat({
        message: userMessage,
        conversation_id: conversationId
      });
      
      if (!conversationId) {
        setConversationId(res.conversation_id);
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: res.response, agent: res.agent }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: '**Error**: Could not connect to Agent Ecosystem.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center bg-surface-container-high p-3 rounded-lg border border-outline-variant/10 mb-4 mx-4">
        <div className="flex items-center gap-2">
          <Route className="w-5 h-5 text-tertiary" />
          <span className="font-medium text-on-surface">Agent Ecosystem</span>
        </div>
        {conversationId && (
          <span className="text-label-sm text-on-surface-variant font-mono bg-surface-container-lowest px-2 py-1 rounded">
            ID: {conversationId.split('-')[0]}...
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-on-surface-variant">
            <div className="w-16 h-16 rounded-2xl bg-surface-container-highest flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-tertiary" />
            </div>
            <h2 className="text-headline-md font-medium text-on-surface">Multi-Agent Planner</h2>
            <p className="max-w-md mt-2">I dynamically route your requests to the best agent (Tutor, Planner, Quiz, or Research).</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            {msg.role === 'assistant' && msg.agent && (
              <span className="text-[10px] uppercase font-bold text-tertiary mb-1 tracking-wider ml-1">
                {msg.agent} Agent
              </span>
            )}
            <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-tertiary text-on-tertiary rounded-tr-sm' : 'bg-surface-container-high text-on-surface rounded-tl-sm border border-outline-variant/10 shadow-sm'}`}>
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <div className="prose prose-invert prose-p:leading-relaxed max-w-none prose-pre:bg-surface-container-lowest prose-pre:border prose-pre:border-outline-variant/20">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface-container-high rounded-2xl p-4 flex gap-1 items-center">
              <div className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 bg-surface rounded-t-2xl border-t border-outline-variant/10">
        <form onSubmit={handleSend} className="relative max-w-4xl mx-auto flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the agent network to plan a curriculum or quiz you..."
            className="w-full bg-surface-container rounded-full pl-6 pr-14 py-4 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-tertiary/50 transition-all shadow-sm"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center disabled:opacity-50 hover:bg-tertiary-fixed transition-colors"
          >
            <Send className="w-4 h-4 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
}

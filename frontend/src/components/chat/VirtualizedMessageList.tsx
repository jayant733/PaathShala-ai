import { useEffect, useRef, useCallback } from 'react';
import type { MutableRefObject } from 'react';
import { Virtuoso } from 'react-virtuoso';
import type { VirtuosoHandle } from 'react-virtuoso';
import type { ChatMessage } from '../../api/chat.api';
import { MessageBubble } from './MessageBubble';
import AIResponseRenderer from './AIResponseRenderer';
import EmptyState from './EmptyState';

type Rating = 'like' | 'dislike';

/** Union of rows rendered by the virtualized list. */
type ListItem =
  | { type: 'msg'; msg: ChatMessage }
  | { type: 'stream'; content: string; model: string | null }
  | { type: 'thinking' };

export interface VirtualizedMessageListProps {
  messages: ChatMessage[];
  streamingMessage: string | null;
  streamingModel: string | null;
  loading: boolean;
  fetching: boolean;
  provider: string | null;
  /** Currently selected model, used as the fallback label for the model chip. */
  currentModel: string | null;
  ratedMessages: Record<string, Rating>;
  /** Shared follow flag: true while the view is glued to the newest content. */
  followRef: MutableRefObject<boolean>;
  conversationId?: string;
  onSend: (message: string) => void;
  onFocusInput: () => void;
  onRate: (id: string, vote: Rating, content: string) => void;
}

/**
 * The streaming row: rendered while an assistant reply is being produced. Kept
 * as the last row of the virtualized data (rather than a Footer) so
 * react-virtuoso's followOutput glues the viewport to it as it grows.
 */
function StreamingRow({
  content,
  model,
  provider,
  currentModel,
}: {
  content: string;
  model: string | null;
  provider: string | null;
  currentModel: string | null;
}) {
  return (
    <div className="flex items-start gap-4 mb-8 justify-start max-w-5xl mx-auto w-full group">
      <div className="w-10 h-10 rounded-full bg-primary border-2 border-surface-border flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
      </div>
      <div className="flex-1 max-w-3xl">
        <div className="font-button-text text-on-surface mb-2 flex items-center gap-2">
          PaathShala AI Tutor
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-primary border border-surface-border rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-tertiary border border-surface-border rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
            <div className="w-1.5 h-1.5 bg-secondary border border-surface-border rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
          </div>
        </div>
        <div className="bg-surface-container font-body-md p-6 rounded-xl border-2 border-surface-border shadow-[4px_4px_0px_0px_#111827]">
          <AIResponseRenderer content={content} streaming />
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-[10px] text-on-surface-variant font-label-caps uppercase tracking-wider bg-surface-container-highest px-2 py-0.5 rounded border-2 border-surface-border">
            {model || (provider === 'gemini' ? 'gemini' : currentModel)}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Virtualized message list for the AI chat. Only the messages near the
 * viewport (plus a small overscan) are mounted, so a very long conversation
 * renders O(viewport) DOM nodes instead of O(total messages) — while keeping
 * markdown/presentation rendering, enter animations, streaming, and the
 * glue-to-bottom auto-follow behavior identical to the non-virtualized list.
 */
export default function VirtualizedMessageList(props: VirtualizedMessageListProps) {
  const {
    messages,
    streamingMessage,
    streamingModel,
    loading,
    fetching,
    provider,
    currentModel,
    ratedMessages,
    followRef,
    conversationId,
    onSend,
    onFocusInput,
    onRate,
  } = props;

  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // Build the row list: history messages, then the streaming or thinking row.
  const items: ListItem[] = messages.map((m) => ({ type: 'msg' as const, msg: m }));
  if (streamingMessage !== null) {
    items.push({ type: 'stream' as const, content: streamingMessage, model: streamingModel });
  } else if (loading) {
    items.push({ type: 'thinking' as const });
  }

  // Follow the output while the user is glued to the bottom: hard-pin (auto)
  // during streaming (matches the old instant scrollTo), smooth otherwise
  // (matches the old scrollIntoView). Never yank a user who scrolled up.
  const followOutput = useCallback(() => {
    if (!followRef.current) return false;
    return streamingMessage !== null ? 'auto' : 'smooth';
  }, [followRef, streamingMessage]);

  // Whenever a conversation is opened or a new message lands while the user is
  // following, make sure the viewport is on the newest message (the followOutput
  // hook covers growth; this covers full conversation swaps and initial loads).
  useEffect(() => {
    if (messages.length === 0 || !followRef.current) return;
    const t = setTimeout(() => {
      virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, align: 'end', behavior: 'auto' });
    }, 0);
    return () => clearTimeout(t);
  }, [conversationId, messages.length, followRef]);

  if (messages.length === 0 && !fetching) {
    return (
      <div className="flex-1 min-h-0" id="chat-container">
        <EmptyState onExample={onSend} />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0" id="chat-container">
    <Virtuoso
      ref={virtuosoRef}
      style={{ height: '100%' }}
      key={conversationId ?? 'empty'}
      data={items}
      computeItemKey={(_, item) => (item.type === 'msg' ? item.msg.id : 'streaming-row')}
      overscan={8}
      followOutput={followOutput}
      atBottomStateChange={(atBottom) => {
        followRef.current = atBottom;
      }}
      initialTopMostItemIndex={
        messages.length > 0 ? { index: messages.length - 1, align: 'end' } : undefined
      }
      itemContent={(_, item) => {
        const wrapperClass = 'px-stack-lg pb-stack-lg';
        if (item.type === 'msg') {
          const msg = item.msg;
          return (
            <div className={wrapperClass}>
              <MessageBubble
                msg={msg}
                rating={ratedMessages[msg.id]}
                provider={provider}
                model={currentModel}
                onSend={onSend}
                onFocusInput={onFocusInput}
                onRate={onRate}
              />
            </div>
          );
        }
        if (item.type === 'thinking') {
          return (
            <div className={wrapperClass}>
              <div className="flex items-start gap-4 mb-8 justify-start max-w-5xl mx-auto w-full group">
                <div className="w-10 h-10 rounded-full bg-primary border-2 border-surface-border flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-primary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                </div>
                <div className="flex-1 max-w-3xl">
                  <div className="font-button-text text-on-surface mb-2">PaathShala AI Tutor</div>
                  <div className="bg-surface-container font-body-md p-6 rounded-xl border-2 border-surface-border shadow-[4px_4px_0px_0px_#111827]">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 bg-primary border border-surface-border rounded-full animate-bounce"></div>
                        <div className="w-2.5 h-2.5 bg-tertiary border border-surface-border rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                        <div className="w-2.5 h-2.5 bg-secondary border border-surface-border rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                      </div>
                      <span className="font-button-text text-on-surface-variant italic">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className={wrapperClass}>
            <StreamingRow content={item.content} model={item.model} provider={provider} currentModel={currentModel} />
          </div>
        );
      }}
    />
    </div>
  );
}

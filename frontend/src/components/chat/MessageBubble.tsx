import { memo } from 'react';
import type { ChatMessage } from '../../api/chat.api';
import AIResponseRenderer from './AIResponseRenderer';
import ActionBar from '../ai-response/ActionBar';

export interface MessageBubbleProps {
  msg: ChatMessage;
  /** The user's rating for this message, if any. */
  rating?: 'like' | 'dislike';
  /** Currently selected provider/model, used for the model chip fallback. */
  provider: string | null;
  model: string | null;
  onSend: (message: string) => void;
  onFocusInput: () => void;
  onRate: (id: string, vote: 'like' | 'dislike', content: string) => void;
}

/**
 * A single chat message. Kept memoized so that, within a virtualized list,
 * scrolling in/out only re-renders the bubbles entering the viewport rather
 * than the whole history. Rendering is delegated unchanged to
 * AIResponseRenderer (markdown / slide deck) and ResponseRenderer (premium
 * presentations) so all existing presentation behavior is preserved.
 */
function MessageBubbleImpl({
  msg,
  rating,
  provider,
  model,
  onSend,
  onFocusInput,
  onRate,
}: MessageBubbleProps) {
  return (
    <div className={`flex items-start gap-4 mb-8 ${msg.role === 'user' ? 'justify-end' : ''} max-w-5xl mx-auto w-full group`}>
      {msg.role === 'assistant' && (
        <div className="w-10 h-10 rounded-full bg-primary border-2 border-surface-border flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
        </div>
      )}

      {msg.role === 'user' ? (
        <>
          <div className="bg-primary text-on-primary font-body-md p-4 rounded-xl border-2 border-surface-border max-w-2xl shadow-[4px_4px_0px_0px_#111827]">
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-secondary-container border-2 border-surface-border flex items-center justify-center shrink-0">
            <span className="font-button-text text-on-secondary-container">U</span>
          </div>
        </>
      ) : (
        <div className="flex-1 max-w-3xl">
          <div className="font-button-text text-on-surface mb-2">PaathShala AI Tutor</div>
          <div className="bg-surface-container font-body-md p-6 rounded-xl border-2 border-surface-border shadow-[4px_4px_0px_0px_#111827]">
            {/* Render AI responses via the advanced renderer */}
            <AIResponseRenderer content={msg.content} />
          </div>
          
          {/* Post-response learning actions (quiz, notes, simpler, etc.) */}
          <div className="mt-4">
            <ActionBar content={msg.content} onSend={onSend} onFocusInput={onFocusInput} />
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="text-[10px] text-on-surface-variant font-label-caps uppercase tracking-wider bg-surface-container-high px-2 py-0.5 rounded border-2 border-surface-border">
              {msg.model_used || msg.model || (provider === 'gemini' ? 'gemini' : model)}
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onRate(msg.id, 'like', msg.content)}
                disabled={!!rating}
                className={`w-8 h-8 rounded border-2 border-surface-border flex items-center justify-center transition-colors shadow-[2px_2px_0px_0px_#111827] ${
                  rating === 'like' ? 'text-primary bg-primary/20' : 'bg-surface hover:bg-secondary-container'
                } ${rating ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <span className="material-symbols-outlined text-[16px]">thumb_up</span>
              </button>
              <button
                onClick={() => onRate(msg.id, 'dislike', msg.content)}
                disabled={!!rating}
                className={`w-8 h-8 rounded border-2 border-surface-border flex items-center justify-center transition-colors shadow-[2px_2px_0px_0px_#111827] ${
                  rating === 'dislike' ? 'text-error bg-error/20' : 'bg-surface hover:bg-error hover:text-on-error'
                } ${rating ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <span className="material-symbols-outlined text-[16px]">thumb_down</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const MessageBubble = memo(MessageBubbleImpl);

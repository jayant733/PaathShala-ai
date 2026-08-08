import { memo } from 'react';
import { Brain } from 'lucide-react';
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
    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} max-w-5xl mx-auto w-full group`}>
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
          {/* Post-response learning actions (quiz, notes, simpler, etc.) */}
          <ActionBar content={msg.content} onSend={onSend} onFocusInput={onFocusInput} />

          <div className="flex items-center justify-between mt-2">
            <div className="text-[10px] text-on-surface-variant font-mono bg-surface-container-highest px-2 py-0.5 rounded border border-outline-variant/10">
              {msg.model ? msg.model : (provider === 'gemini' ? 'gemini' : model)}
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onRate(msg.id, 'like', msg.content)}
                disabled={!!rating}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  rating === 'like' ? 'text-primary bg-primary/20' : 'text-on-surface-variant hover:text-primary hover:bg-primary/10'
                } ${rating ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <span className="material-symbols-outlined text-[16px]">thumb_up</span>
              </button>
              <button
                onClick={() => onRate(msg.id, 'dislike', msg.content)}
                disabled={!!rating}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  rating === 'dislike' ? 'text-error bg-error/20' : 'text-on-surface-variant hover:text-error hover:bg-error/10'
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

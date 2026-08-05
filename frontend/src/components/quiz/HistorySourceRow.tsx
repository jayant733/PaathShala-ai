import clsx from 'clsx';
import type { QuizSourceItem } from '../../api/quiz.api';

interface HistorySourceRowProps {
  item: QuizSourceItem;
  selected: boolean;
  onSelect: (item: QuizSourceItem) => void;
}

/** A conversation / AI-interaction row in the "from history" picker. */
export default function HistorySourceRow({ item, selected, onSelect }: HistorySourceRowProps) {
  const isConversation = item.source_type === 'conversation';
  return (
    <button
      onClick={() => onSelect(item)}
      className={clsx(
        'flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors',
        selected
          ? 'border-primary bg-primary/10'
          : 'border-outline-variant/30 bg-surface-container-low/60 hover:border-primary/40 hover:bg-surface-container-high'
      )}
    >
      <span
        className={clsx(
          'mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
          isConversation ? 'bg-secondary-container text-on-secondary-container' : 'bg-tertiary-container text-on-tertiary-container'
        )}
      >
        <span className="material-symbols-outlined text-[20px]">{isConversation ? 'forum' : 'auto_awesome'}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-body-md font-semibold text-on-surface">{item.title}</span>
          <span
            className={clsx(
              'rounded-full px-2 py-0.5 text-label-xs font-label-xs uppercase tracking-wide',
              isConversation ? 'bg-secondary-container text-on-secondary-container' : 'bg-tertiary-container text-on-tertiary-container'
            )}
          >
            {isConversation ? 'Chat' : 'AI'}
          </span>
        </span>
        {item.preview && <span className="mt-1 line-clamp-2 text-body-sm text-on-surface-variant">{item.preview}</span>}
      </span>
      <span
        className={clsx(
          'mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          selected ? 'border-primary bg-primary' : 'border-on-surface-variant/50'
        )}
      >
        {selected && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="text-on-primary">
            <path d="M2 6.2 4.7 9 10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  );
}

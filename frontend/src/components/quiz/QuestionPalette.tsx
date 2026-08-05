import clsx from 'clsx';
import type { AnswerValue } from '../../store/quizStore';

interface QuestionPaletteProps {
  questionIds: string[];
  answers: Record<string, AnswerValue>;
  marked: string[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

/** Grid of question chips showing answered / marked / current state. */
export default function QuestionPalette({ questionIds, answers, marked, currentIndex, onSelect }: QuestionPaletteProps) {
  return (
    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
      {questionIds.map((id, i) => {
        const isAnswered = id in answers && answers[id] !== undefined && answers[id] !== '' && !(Array.isArray(answers[id]) && (answers[id] as unknown[]).length === 0);
        const isMarked = marked.includes(id);
        const isCurrent = i === currentIndex;
        return (
          <button
            key={id}
            onClick={() => onSelect(i)}
            aria-label={`Question ${i + 1}${isAnswered ? ', answered' : ''}${isMarked ? ', marked for review' : ''}`}
            className={clsx(
              'h-9 w-9 rounded-lg text-label-sm font-label-sm flex items-center justify-center transition-all',
              isCurrent && 'ring-2 ring-primary ring-offset-2 ring-offset-surface',
              isAnswered
                ? 'bg-primary text-on-primary'
                : isMarked
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
            )}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}

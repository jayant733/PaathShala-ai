import clsx from 'clsx';
import type { Quiz, QuizStatus } from '../../api/quiz.api';
import ExportMenu from './ExportMenu';

interface QuizCardProps {
  quiz: Quiz;
  onEdit: (id: string) => void;
  onTake: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRegenerate: (id: string) => void;
  onDelete: (id: string) => void;
}

const STATUS_STYLES: Record<QuizStatus, string> = {
  draft: 'bg-surface-container-highest text-on-surface-variant',
  published: 'bg-primary/15 text-primary',
  archived: 'bg-surface-container-high text-on-surface-variant/70',
};

const DIFFICULTY_DOT: Record<string, string> = {
  easy: 'bg-success',
  medium: 'bg-warning',
  hard: 'bg-error',
};

/** Library card: title, meta badges, and row of actions. */
export default function QuizCard({ quiz, onEdit, onTake, onDuplicate, onRegenerate, onDelete }: QuizCardProps) {
  const isPublished = quiz.status === 'published';

  return (
    <div className="group relative flex flex-col rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-low/60 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-title-md font-title-md text-on-surface">{quiz.title}</h3>
        <span className={clsx('flex-shrink-0 rounded-full px-2.5 py-1 text-label-xs font-label-xs capitalize', STATUS_STYLES[quiz.status])}>
          {quiz.status}
        </span>
      </div>

      {quiz.description && (
        <p className="mt-2 line-clamp-2 text-body-sm text-on-surface-variant">{quiz.description}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-label-sm">
        {quiz.subject && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-2.5 py-1 text-on-secondary-container">
            <span className="material-symbols-outlined text-[15px]">book</span>
            {quiz.subject}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-2.5 py-1 text-on-surface-variant">
          <span className={clsx('h-1.5 w-1.5 rounded-full', DIFFICULTY_DOT[quiz.difficulty])} />
          <span className="capitalize">{quiz.difficulty}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-2.5 py-1 text-on-surface-variant">
          <span className="material-symbols-outlined text-[15px]">help</span>
          {quiz.number_of_questions} questions
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-2.5 py-1 text-on-surface-variant">
          <span className="material-symbols-outlined text-[15px]">schedule</span>
          {quiz.duration_minutes} min
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-outline-variant/15 pt-4">
        {isPublished ? (
          <button
            onClick={() => onTake(quiz.id)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-label-md font-label-md text-on-primary transition-opacity hover:opacity-90"
          >
            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
            Take quiz
          </button>
        ) : (
          <button
            onClick={() => onEdit(quiz.id)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-label-md font-label-md text-on-primary transition-opacity hover:opacity-90"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Continue editing
          </button>
        )}

        <button
          onClick={() => onEdit(quiz.id)}
          title="Edit"
          aria-label="Edit quiz"
          className="icon-btn"
        >
          <span className="material-symbols-outlined text-[20px]">edit</span>
        </button>
        <button
          onClick={() => onDuplicate(quiz.id)}
          title="Duplicate"
          aria-label="Duplicate quiz"
          className="icon-btn"
        >
          <span className="material-symbols-outlined text-[20px]">content_copy</span>
        </button>
        <button
          onClick={() => onRegenerate(quiz.id)}
          title="Generate a fresh version from the same prompt"
          aria-label="Regenerate quiz"
          className="icon-btn"
        >
          <span className="material-symbols-outlined text-[20px]">refresh</span>
        </button>
        <ExportMenu quizId={quiz.id} quizTitle={quiz.title} />
        <button
          onClick={() => onDelete(quiz.id)}
          title="Delete"
          aria-label="Delete quiz"
          className="icon-btn hover:!text-error"
        >
          <span className="material-symbols-outlined text-[20px]">delete</span>
        </button>
      </div>
    </div>
  );
}

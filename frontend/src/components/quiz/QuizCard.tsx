import clsx from 'clsx';
import type { Quiz, QuizStatus } from '../../api/quiz.api';

interface QuizCardProps {
  quiz: Quiz;
  onEdit: (id: string) => void;
  onTake: (id: string) => void;
  onViewResults: (quizId: string, attemptId: string) => void;
  onDuplicate: (id: string) => void;
  onRegenerate: (id: string) => void;
  onDelete: (id: string) => void;
}

const STATUS_COLORS: Record<QuizStatus, { header: string; dot: string; text: string; dateBg: string }> = {
  published: { header: 'bg-primary', dot: 'bg-mint-accent', text: 'text-on-primary', dateBg: 'text-primary-fixed-dim bg-surface-border' },
  draft: { header: 'bg-surface-container-high', dot: 'bg-secondary', text: 'text-on-surface-variant', dateBg: 'text-on-surface-variant bg-surface-container-lowest border-2 border-surface-border' },
  archived: { header: 'bg-surface-variant', dot: 'bg-outline', text: 'text-on-surface-variant', dateBg: 'text-on-surface-variant bg-surface-container-lowest border-2 border-surface-border' },
};

const DIFFICULTY_BG: Record<string, string> = {
  easy: 'bg-primary-fixed-dim text-on-surface',
  medium: 'bg-secondary-fixed text-on-surface',
  hard: 'bg-error-container text-on-error-container',
};

function formatDistanceToNow(date: Date): string {
  const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  return `${Math.floor(diffInMonths / 12)}y ago`;
}

export default function QuizCard({ quiz, onEdit, onTake, onViewResults, onDuplicate, onRegenerate, onDelete }: QuizCardProps) {
  const isPublished = quiz.status === 'published';
  const s = STATUS_COLORS[quiz.status];
  
  // Format dates elegantly
  const lastUpdated = new Date(quiz.updated_at);
  const dateStr = formatDistanceToNow(lastUpdated);

  return (
    <article className="flex flex-col bg-surface border-2 border-surface-border rounded-xl overflow-hidden shadow-[4px_4px_0px_0px_#111827] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#111827] transition-all duration-300">
      {/* Card Header Strip */}
      <div className={clsx("px-4 py-3 border-b-2 border-surface-border flex items-center justify-between", s.header)}>
        <div className="flex items-center gap-2">
          <span className={clsx("w-3 h-3 rounded-full border-2 border-surface-border", s.dot)}></span>
          <span className={clsx("font-label-caps text-label-caps uppercase tracking-wider", s.text)}>{quiz.status}</span>
        </div>
        <span className={clsx("font-label-caps text-label-caps px-3 py-1 rounded-md", s.dateBg)}>
          {quiz.status === 'draft' ? 'Last edited: ' : 'Last updated: '} {dateStr}
        </span>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col">
        <h2 className="font-headline-lg text-[22px] text-on-surface mb-2 line-clamp-2 leading-tight" title={quiz.title}>
          {quiz.title}
        </h2>
        
        {quiz.description && (
          <p className="font-body-md text-[14px] text-on-surface-variant mb-4 line-clamp-2 leading-snug" title={quiz.description}>
            {quiz.description}
          </p>
        )}

        {/* Metadata Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {quiz.subject && (
            <span className="bg-surface-container-high border-2 border-surface-border px-3 py-1 font-label-caps text-label-caps text-on-surface rounded-md">
              {quiz.subject}
            </span>
          )}
          <span className={clsx("border-2 border-surface-border px-3 py-1 font-label-caps text-label-caps rounded-md", DIFFICULTY_BG[quiz.difficulty] || 'bg-surface-container-high text-on-surface')}>
            {quiz.difficulty}
          </span>
          <span className="bg-surface-container border-2 border-surface-border px-3 py-1 font-label-caps text-label-caps text-on-surface rounded-md flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">format_list_bulleted</span> {quiz.number_of_questions} questions
          </span>
          <span className="bg-surface-container border-2 border-surface-border px-3 py-1 font-label-caps text-label-caps text-on-surface rounded-md flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">timer</span> {quiz.duration_minutes} min
          </span>
        </div>

        {/* Stats & Actions Area */}
        <div className={clsx("mt-auto", isPublished && quiz.last_attempt?.status === 'completed' ? "grid grid-cols-1 gap-4 items-end" : "pt-4 border-t-2 border-surface-border border-dashed flex flex-col sm:flex-row items-center justify-between gap-4")}>
          
          {/* Published & Completed -> Score Block */}
          {isPublished && quiz.last_attempt?.status === 'completed' && (
            <div className="col-span-1 bg-secondary-container border-2 border-surface-border p-4 rounded-lg shadow-[4px_4px_0px_0px_#111827] -ml-2 mb-2">
              <div className="font-label-caps text-label-caps text-on-secondary-container uppercase mb-1">Your Score</div>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-xl text-[36px] font-extrabold text-on-surface leading-none">
                  {quiz.last_attempt.percent !== null ? Math.round(quiz.last_attempt.percent) : 0}%
                </span>
                <span className="font-button-text text-on-surface-variant">
                  {quiz.last_attempt.score ?? 0}/{quiz.last_attempt.total_points} pts
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className={clsx(isPublished && quiz.last_attempt?.status === 'completed' ? "flex flex-col gap-3" : "w-full sm:w-auto flex-1")}>
            
            {/* Primary Buttons */}
            {isPublished ? (
              quiz.last_attempt?.status === 'completed' ? (
                <div className="flex gap-2">
                  <button onClick={() => onViewResults(quiz.id, quiz.last_attempt!.attempt_id)} className="flex-1 bg-surface-container border-2 border-surface-border py-2 font-button-text text-[14px] text-on-surface rounded-lg hover:bg-surface-container-high hover:shadow-[4px_4px_0px_0px_#111827] hover:-translate-y-1 transition-all">
                    View results
                  </button>
                  <button onClick={() => onTake(quiz.id)} className="flex-1 bg-ink-black text-on-primary border-2 border-surface-border py-2 font-button-text text-[14px] rounded-lg hover:shadow-[4px_4px_0px_0px_#003527] hover:-translate-y-1 transition-all">
                    Retake
                  </button>
                </div>
              ) : quiz.last_attempt?.status === 'in_progress' ? (
                <button onClick={() => onTake(quiz.id)} className="w-full sm:w-auto bg-secondary-container text-on-surface font-button-text text-[14px] px-4 py-2 border-2 border-surface-border rounded-lg flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#111827] transition-all">
                  <span className="material-symbols-outlined text-[18px]">play_circle</span>
                  Resume quiz
                </button>
              ) : (
                <button onClick={() => onTake(quiz.id)} className="w-full sm:w-auto bg-primary text-on-primary font-button-text text-[14px] px-4 py-2 border-2 border-surface-border rounded-lg flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#111827] transition-all">
                  <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                  Take quiz
                </button>
              )
            ) : (
              <button onClick={() => onEdit(quiz.id)} className="w-full sm:w-auto bg-secondary-container text-on-surface font-button-text text-[14px] px-4 py-2 border-2 border-surface-border rounded-lg flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#111827] transition-all">
                <span className="material-symbols-outlined text-[18px]">edit_document</span>
                Continue editing
              </button>
            )}

            {/* Icon Actions */}
            <div className={clsx("flex justify-end gap-1.5", isPublished && quiz.last_attempt?.status === 'completed' ? "pt-2 border-t-2 border-surface-border border-dashed" : "w-full sm:w-auto mt-3 sm:mt-0")}>
              <button onClick={() => onEdit(quiz.id)} className="w-8 h-8 flex items-center justify-center border-2 border-surface-border rounded bg-surface hover:bg-secondary-container hover:shadow-[2px_2px_0px_0px_#111827] transition-all" title="Edit">
                <span className="material-symbols-outlined text-[16px]">edit</span>
              </button>
              <button onClick={() => onDuplicate(quiz.id)} className="w-8 h-8 flex items-center justify-center border-2 border-surface-border rounded bg-surface hover:bg-secondary-container hover:shadow-[2px_2px_0px_0px_#111827] transition-all" title="Duplicate">
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
              </button>
              <button onClick={() => onRegenerate(quiz.id)} className="w-8 h-8 flex items-center justify-center border-2 border-surface-border rounded bg-surface hover:bg-secondary-container hover:shadow-[2px_2px_0px_0px_#111827] transition-all" title="Regenerate">
                <span className="material-symbols-outlined text-[16px]">refresh</span>
              </button>
              <button onClick={() => onDelete(quiz.id)} className="w-8 h-8 flex items-center justify-center border-2 border-surface-border rounded bg-surface hover:bg-error hover:text-on-error hover:shadow-[2px_2px_0px_0px_#111827] transition-all text-error" title="Delete">
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </article>
  );
}

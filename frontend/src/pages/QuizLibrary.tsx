import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import QuizCard from '../components/quiz/QuizCard';
import { useQuizStore } from '../store/quizStore';
import type { Difficulty, QuizStatus } from '../api/quiz.api';

const FILTER_PILL = 'inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/20 bg-surface-container-high/70 px-3 py-2 text-label-sm font-label-sm text-on-surface-variant hover:border-primary/40 hover:text-on-surface transition-colors';

/** Unified quiz library — generate, browse, take, export. */
export default function QuizLibrary() {
  const navigate = useNavigate();
  const { quizzes, loading, error, fetchQuizzes, deleteQuiz, duplicateQuiz, regenerateQuiz } = useQuizStore();

  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [status, setStatus] = useState<QuizStatus | ''>('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes({ search: search || undefined, subject: subject || undefined, difficulty: difficulty || undefined, status: status || undefined });
  }, [fetchQuizzes, search, subject, difficulty, status]);

  const handleDuplicate = async (id: string) => {
    await duplicateQuiz(id);
  };

  const handleRegenerate = async (id: string) => {
    const quiz = await regenerateQuiz(id);
    navigate(`/quizzes/${quiz.id}/edit`);
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    try {
      await deleteQuiz(confirmId);
    } finally {
      setConfirmId(null);
    }
  };

  const hasFilters = search || subject || difficulty || status;

  return (
    <div className="flex min-h-screen w-full flex-col px-margin-mobile py-stack-lg md:px-margin-desktop">
      <div className="relative mx-auto flex w-full max-w-container-max flex-1 flex-col">
        {/* Header */}
        <div className="mb-stack-lg flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-headline-lg font-headline-lg text-on-surface">Quizzes</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Generate quizzes with AI, refine them, and take them — all in one place.
            </p>
          </div>
          <button
            onClick={() => navigate('/quizzes/create')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-label-md font-label-md text-on-primary transition-opacity hover:opacity-90"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create quiz
          </button>
        </div>

        {/* Filter bar */}
        <div className="mb-stack-lg flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">search</span>
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quizzes…"
              className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-high/70 py-2.5 pl-10 pr-3 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            />
          </div>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="rounded-xl border border-outline-variant/20 bg-surface-container-high/70 px-3 py-2.5 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          />
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty | '')}
            className={clsx(FILTER_PILL, 'cursor-pointer capitalize')}
          >
            <option value="">Any difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as QuizStatus | '')}
            className={clsx(FILTER_PILL, 'cursor-pointer capitalize')}
          >
            <option value="">Any status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setSubject(''); setDifficulty(''); setStatus(''); }}
              className="text-label-sm font-label-sm text-primary hover:opacity-80"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-stack-md rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-body-sm text-error">
            {error}
          </div>
        )}

        {/* Grid / states */}
        {loading && quizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-body-md text-on-surface-variant">Loading your quizzes…</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-[2rem] border border-dashed border-outline-variant/40 bg-surface-container-low/40 px-6 py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[32px]">quiz</span>
            </div>
            <h2 className="text-headline-md font-headline-md text-on-surface">No quizzes yet</h2>
            <p className="max-w-md text-body-md text-on-surface-variant">
              {hasFilters ? 'No quizzes match your filters.' : 'Ask AI to build your first quiz — just describe the topic.'}
            </p>
            {!hasFilters && (
              <button
                onClick={() => navigate('/quizzes/create')}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-label-md font-label-md text-on-primary transition-opacity hover:opacity-90"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                Generate with AI
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {quizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onEdit={(id) => navigate(`/quizzes/${id}/edit`)}
                onTake={(id) => navigate(`/quizzes/${id}/take`)}
                onDuplicate={handleDuplicate}
                onRegenerate={handleRegenerate}
                onDelete={(id) => setConfirmId(id)}
              />
            ))}
          </div>
        )}

        {/* Delete confirmation */}
        {confirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmId(null)} />
            <div className="relative z-10 w-full max-w-sm rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-high p-6 shadow-2xl">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-error/15 text-error">
                <span className="material-symbols-outlined text-[24px]">delete</span>
              </div>
              <h3 className="text-headline-md font-headline-md text-on-surface">Delete quiz?</h3>
              <p className="mt-2 text-body-md text-on-surface-variant">
                This permanently deletes the quiz and all its attempts. This can't be undone.
              </p>
              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  onClick={() => setConfirmId(null)}
                  className="rounded-xl border border-outline-variant/30 px-4 py-2.5 text-label-md font-label-md text-on-surface transition-colors hover:bg-surface-container-highest"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded-xl bg-error px-4 py-2.5 text-label-md font-label-md text-on-error transition-opacity hover:opacity-90"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

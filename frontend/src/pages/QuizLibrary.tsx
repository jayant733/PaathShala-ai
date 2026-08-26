import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuizCard from '../components/quiz/QuizCard';
import { useQuizStore } from '../store/quizStore';
import type { Difficulty, QuizStatus } from '../api/quiz.api';

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

  useEffect(() => {
    const handleQuizCompleted = () => {
      fetchQuizzes({ search: search || undefined, subject: subject || undefined, difficulty: difficulty || undefined, status: status || undefined });
    };
    window.addEventListener('quizCompleted', handleQuizCompleted);
    return () => window.removeEventListener('quizCompleted', handleQuizCompleted);
  }, [fetchQuizzes, search, subject, difficulty, status]);

  const handleTake = (id: string) => {
    const { activeAttempt, resetAttempt } = useQuizStore.getState();
    if (activeAttempt?.quizId === id) {
      resetAttempt();
    }
    navigate(`/quizzes/${id}/take`);
  };

  const handleViewResults = (quizId: string, attemptId: string) => {
    navigate(`/quizzes/${quizId}/results/${attemptId}`);
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
    <div className="flex flex-col w-full">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-spacing-gutter pt-12 pb-10">
        <div className="max-w-2xl relative z-10">
          <div className="inline-block bg-secondary-container text-on-secondary-container font-label-caps px-3 py-1 border-2 border-surface-border rounded-full mb-6 shadow-[2px_2px_0px_0px_#000]">
            Assessment Center
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface mb-4 tracking-tight">
            Quizzes
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant border-l-4 border-primary pl-4">
            Generate quizzes with AI, refine them, and take them — all in one place.
          </p>
        </div>
        <div className="relative group">
          <button 
            onClick={() => navigate('/quizzes/create')}
            className="relative bg-primary text-on-primary font-button-text text-button-text px-6 py-3 border-2 border-surface-border flex items-center gap-3 transition-transform hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_#111827] active:translate-y-0 active:translate-x-0 active:shadow-[0px_0px_0px_0px_#111827] rounded-lg z-10"
          >
            <span className="material-symbols-outlined text-[24px]">add_box</span>
            Create quiz
          </button>
        </div>
      </section>

      {/* Filters & Search Bar */}
      <section className="px-spacing-gutter mb-12 relative z-20">
        <div className="bg-surface-container border-2 border-surface-border shadow-[4px_4px_0px_0px_#111827] p-4 flex flex-col lg:flex-row gap-4 rounded-lg">
          <div className="flex-1 relative flex items-center">
            <span className="material-symbols-outlined absolute left-4 text-on-surface-variant">search</span>
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-lowest border-2 border-surface-border py-3 pl-12 pr-4 font-body-md text-body-md focus:shadow-[4px_4px_0px_0px_#111827] focus:-translate-y-1 transition-all outline-none rounded-md placeholder:text-on-surface-variant/50" 
              placeholder="Search quizzes..." 
              type="text" 
            />
          </div>
          <div className="flex flex-wrap gap-4">
            {/* Subject Filter */}
            <div className="relative flex items-center min-w-[160px] lg:min-w-[200px]">
              <input 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="w-full bg-surface-container-lowest border-2 border-surface-border py-3 px-4 font-body-md text-on-surface focus:shadow-[4px_4px_0px_0px_#111827] focus:-translate-y-1 transition-all outline-none rounded-md" 
                type="text" 
              />
            </div>
            {/* Difficulty Filter */}
            <div className="relative flex items-center min-w-[140px]">
              <select 
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty | '')}
                className="w-full appearance-none bg-surface-container-lowest border-2 border-surface-border py-3 pl-4 pr-10 font-body-md text-on-surface cursor-pointer focus:shadow-[4px_4px_0px_0px_#111827] focus:-translate-y-1 transition-all outline-none rounded-md capitalize"
              >
                <option value="">Any Difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 pointer-events-none text-on-surface-variant">expand_more</span>
            </div>
            {/* Status Filter */}
            <div className="relative flex items-center min-w-[140px]">
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value as QuizStatus | '')}
                className="w-full appearance-none bg-surface-container-lowest border-2 border-surface-border py-3 pl-4 pr-10 font-body-md text-on-surface cursor-pointer focus:shadow-[4px_4px_0px_0px_#111827] focus:-translate-y-1 transition-all outline-none rounded-md capitalize"
              >
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 pointer-events-none text-on-surface-variant">expand_more</span>
            </div>
          </div>
        </div>
        {hasFilters && (
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => { setSearch(''); setSubject(''); setDifficulty(''); setStatus(''); }}
              className="text-label-sm font-label-caps font-bold text-primary hover:underline uppercase tracking-wider"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* Error State */}
      {error && (
        <div className="mx-spacing-gutter mb-8 p-4 bg-error-container border-2 border-error rounded-lg shadow-[4px_4px_0px_0px_#111827]">
          <p className="text-error font-bold font-body-md">{error}</p>
        </div>
      )}

      {/* Quiz Grid */}
      <section className="px-spacing-gutter pb-section-gap">
        {loading && quizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span className="material-symbols-outlined animate-spin text-primary text-[40px]">sync</span>
            <p className="font-body-md font-bold text-on-surface-variant">Loading your quizzes...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border-4 border-dashed border-surface-border rounded-xl bg-surface-container-low/50 max-w-2xl mx-auto text-center">
            <span className="material-symbols-outlined text-[48px] text-primary mb-4">quiz</span>
            <h2 className="font-headline-lg text-2xl mb-2">No quizzes found</h2>
            <p className="font-body-md text-on-surface-variant mb-6">
              {hasFilters ? "We couldn't find any quizzes matching those filters." : "Create your first quiz with AI in seconds."}
            </p>
            {!hasFilters && (
              <button 
                onClick={() => navigate('/quizzes/create')}
                className="bg-secondary-container text-on-surface border-2 border-surface-border px-6 py-3 rounded-lg font-bold shadow-[4px_4px_0px_0px_#111827] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#111827] transition-all"
              >
                Generate with AI
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {quizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onEdit={(id) => navigate(`/quizzes/${id}/edit`)}
                onTake={handleTake}
                onViewResults={handleViewResults}
                onDuplicate={duplicateQuiz}
                onRegenerate={async (id) => {
                  const newQuiz = await regenerateQuiz(id);
                  handleTake(newQuiz.id);
                }}
                onDelete={(id) => setConfirmId(id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface-border/50 backdrop-blur-sm" onClick={() => setConfirmId(null)} />
          <div className="relative z-10 w-full max-w-sm bg-surface p-6 border-4 border-surface-border shadow-[12px_12px_0px_0px_#111827] rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-error flex items-center justify-center border-2 border-surface-border rounded-lg shadow-[2px_2px_0px_0px_#111827]">
                <span className="material-symbols-outlined text-white">warning</span>
              </div>
              <h3 className="font-headline-lg text-xl">Delete Quiz?</h3>
            </div>
            <p className="font-body-md text-on-surface-variant mb-6">
              This permanently deletes the quiz and all its attempts. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="font-button-text font-bold px-4 py-2 bg-surface border-2 border-surface-border rounded hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="font-button-text font-bold px-4 py-2 bg-error text-on-error border-2 border-surface-border rounded shadow-[4px_4px_0px_0px_#111827] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#111827] transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

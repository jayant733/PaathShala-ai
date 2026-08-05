import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import Timer from '../components/quiz/Timer';
import QuestionPalette from '../components/quiz/QuestionPalette';
import TakeQuestionView from '../components/quiz/TakeQuestionView';
import { quizApi, type QuestionTake, type QuizAttempt } from '../api/quiz.api';
import { useQuizStore } from '../store/quizStore';

const TYPE_LABEL: Record<string, string> = {
  MCQ: 'Multiple choice',
  multiple: 'Checkboxes',
  true_false: 'True / False',
  short_answer: 'Short answer',
};

export default function QuizTake() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const {
    activeAttempt,
    startAttempt,
    resetAttempt,
    setAnswer,
    setIndex,
    setSecondsLeft,
    toggleMark,
  } = useQuizStore();

  const [questions, setQuestions] = useState<QuestionTake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // --- Refs so the interval / submit handlers always see fresh state ---
  const attemptIdRef = useRef<string | null>(null);
  const answersRef = useRef<Record<string, string | string[]>>({});
  const markedRef = useRef<string[]>([]);
  const secondsLeftRef = useRef(0);
  const totalSecondsRef = useRef(0); // duration_minutes * 60
  const dirtyRef = useRef(false);
  const submittedRef = useRef(false);

  useEffect(() => { answersRef.current = activeAttempt?.answers ?? {}; }, [activeAttempt?.answers]);
  useEffect(() => { markedRef.current = activeAttempt?.markedForReview ?? []; }, [activeAttempt?.markedForReview]);
  useEffect(() => { secondsLeftRef.current = activeAttempt?.secondsLeft ?? 0; }, [activeAttempt?.secondsLeft]);

  const saveNow = useCallback(async () => {
    const id = attemptIdRef.current;
    if (!id || submittedRef.current) return;
    dirtyRef.current = false;
    const total = totalSecondsRef.current;
    const elapsed = Math.max(0, total - secondsLeftRef.current);
    try {
      await quizApi.saveAttempt(quizId!, id, {
        answers: answersRef.current,
        status: 'in_progress',
        time_taken_seconds: elapsed,
      });
    } catch {
      dirtyRef.current = true; // retry next tick
    }
  }, [quizId]);

  // Boot: resume existing attempt or start a fresh one.
  useEffect(() => {
    const boot = async () => {
      if (!quizId) return;
      setLoading(true);
      setError(null);
      try {
        const existing = activeAttempt && activeAttempt.quizId === quizId ? activeAttempt : null;
        let attempt: QuizAttempt;
        let qs: QuestionTake[];
        if (existing) {
          attempt = await quizApi.getAttempt(quizId, existing.attemptId);
          if (!attempt.questions?.length) {
            // Attempt already completed → go straight to results.
            navigate(`/quizzes/${quizId}/results/${existing.attemptId}`, { replace: true });
            return;
          }
          qs = attempt.questions;
          // Restore persisted progress into refs.
          attemptIdRef.current = existing.attemptId;
          answersRef.current = { ...existing.answers };
          markedRef.current = [...existing.markedForReview];
          secondsLeftRef.current = existing.secondsLeft;
          totalSecondsRef.current = existing.secondsLeft; // resume continues from remaining time
        } else {
          attempt = await quizApi.createAttempt(quizId);
          if (!attempt.questions?.length) {
            setError('This quiz has no questions yet.');
            setLoading(false);
            return;
          }
          qs = attempt.questions;
          const total = (attempt.duration_minutes ?? 10) * 60;
          startAttempt(attempt, attempt.quiz_title ?? 'Quiz', attempt.duration_minutes ?? 10);
          attemptIdRef.current = attempt.id;
          answersRef.current = {};
          markedRef.current = [];
          secondsLeftRef.current = total;
          totalSecondsRef.current = total;
        }
        setQuestions(qs);
      } catch (e) {
        setError((e as Error).message || 'Could not start the quiz');
      } finally {
        setLoading(false);
      }
    };
    void boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  // Periodic auto-save every 10s while the attempt is live; flush on unmount.
  useEffect(() => {
    const t = setInterval(() => {
      if (dirtyRef.current) void saveNow();
    }, 10_000);
    return () => {
      clearInterval(t);
      if (dirtyRef.current) void saveNow();
    };
  }, [quizId, saveNow]);

  const handleAnswer = (value: string | string[]) => {
    const q = questions[activeAttempt?.currentIndex ?? 0];
    if (!q) return;
    setAnswer(q.id, value);
    dirtyRef.current = true;
    // Debounced save on each answer change.
    window.setTimeout(() => { if (dirtyRef.current) void saveNow(); }, 1500);
  };

  const handleSubmit = async () => {
    const id = attemptIdRef.current;
    if (!id || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      submittedRef.current = true;
      dirtyRef.current = false;
      await saveNow();
      const result = await quizApi.submitAttempt(quizId!, id);
      resetAttempt();
      navigate(`/quizzes/${quizId}/results/${result.attempt_id}`, { replace: true });
    } catch (e) {
      submittedRef.current = false;
      setError((e as Error).message || 'Could not submit the quiz');
      setSubmitting(false);
      setShowSubmit(false);
    }
  };

  // Timer hit zero → force submit.
  const handleExpire = () => {
    if (!submittedRef.current && !showSubmit && attemptIdRef.current) {
      void handleSubmit();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-body-md text-on-surface-variant">{error}</p>
        <button onClick={() => navigate('/quizzes')} className="rounded-xl bg-primary px-4 py-2.5 text-label-md font-label-md text-on-primary">
          Back to quizzes
        </button>
      </div>
    );
  }

  if (!activeAttempt || questions.length === 0) return null;

  const q = questions[activeAttempt.currentIndex];
  const total = questions.length;
  const answeredCount = questions.filter((qq) => {
    const v = activeAttempt.answers[qq.id];
    return v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0);
  }).length;
  const progress = total ? Math.round((answeredCount / total) * 100) : 0;

  return (
    <div className="flex min-h-screen w-full flex-col px-margin-mobile py-stack-lg md:px-margin-desktop">
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col">
        {/* Top bar */}
        <div className="sticky top-16 z-30 -mx-margin-mobile mb-stack-lg border-b border-outline-variant/15 bg-surface/95 px-margin-mobile py-3 backdrop-blur-md md:-mx-margin-desktop md:px-margin-desktop">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-4">
            <button
              onClick={() => navigate('/quizzes')}
              aria-label="Exit quiz"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant transition-colors hover:bg-surface-container-highest"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-label-md font-label-md text-on-surface">{activeAttempt.quizTitle}</p>
                <span className="whitespace-nowrap text-label-sm text-on-surface-variant">{activeAttempt.currentIndex + 1} / {total}</span>
              </div>
              <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <Timer secondsLeft={activeAttempt.secondsLeft} onTick={setSecondsLeft} onExpire={handleExpire} />
          </div>
        </div>

        {error && (
          <div className="mb-stack-md rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-body-sm text-error">{error}</div>
        )}

        {/* Body */}
        <div className="grid flex-1 gap-gutter lg:grid-cols-[1fr_260px]">
          {/* Question column */}
          <div>
            <div className="mb-stack-md flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-secondary-container/20 px-2.5 py-1 text-label-sm font-label-sm uppercase tracking-wider text-secondary">
                {TYPE_LABEL[q.question_type]}
              </span>
              {q.topic && (
                <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-label-sm text-on-surface-variant">
                  {q.topic}
                </span>
              )}
              <span
                className={clsx(
                  'rounded-full px-2.5 py-1 text-label-sm',
                  activeAttempt.markedForReview.includes(q.id) ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'
                )}
              >
                {activeAttempt.markedForReview.includes(q.id) ? 'Marked for review' : 'Not marked'}
              </span>
            </div>

            <h1 className="text-headline-lg font-headline-lg text-on-surface leading-tight">{q.question_text}</h1>

            <div className="mt-stack-lg">
              <TakeQuestionView question={q} value={activeAttempt.answers[q.id]} onChange={handleAnswer} />
            </div>

            {/* Nav buttons */}
            <div className="mt-stack-lg flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIndex(Math.max(0, activeAttempt.currentIndex - 1))}
                disabled={activeAttempt.currentIndex === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-label-md font-label-md text-on-surface transition-colors hover:border-primary/50 disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                Previous
              </button>

              <button
                onClick={() => toggleMark(q.id)}
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-xl border px-4 py-3 text-label-md font-label-md transition-colors',
                  activeAttempt.markedForReview.includes(q.id)
                    ? 'border-secondary/60 bg-secondary-container/15 text-secondary'
                    : 'border-outline-variant/30 bg-surface-container-high text-on-surface hover:border-secondary/50'
                )}
              >
                <span className="material-symbols-outlined text-[18px]">flag</span>
                {activeAttempt.markedForReview.includes(q.id) ? 'Unmark' : 'Mark for review'}
              </button>

              <div className="flex-1" />

              {activeAttempt.currentIndex < total - 1 ? (
                <button
                  onClick={() => setIndex(activeAttempt.currentIndex + 1)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-label-md font-label-md text-on-primary transition-opacity hover:opacity-90"
                >
                  Next
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmit(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-label-md font-label-md text-on-primary transition-opacity hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Submit quiz
                </button>
              )}
            </div>
          </div>

          {/* Palette column */}
          <aside className="h-fit rounded-2xl border border-outline-variant/20 bg-surface-container-low/60 p-4 lg:sticky lg:top-36">
            <p className="mb-3 text-label-sm font-label-sm uppercase tracking-[0.14em] text-on-surface-variant">Question palette</p>
            <QuestionPalette
              questionIds={questions.map((qq) => qq.id)}
              answers={activeAttempt.answers}
              marked={activeAttempt.markedForReview}
              currentIndex={activeAttempt.currentIndex}
              onSelect={setIndex}
            />
            <div className="mt-4 grid grid-cols-3 gap-2 text-label-xs text-on-surface-variant">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Answered</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-secondary-container" /> Marked</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-surface-container-highest" /> Skipped</span>
            </div>
          </aside>
        </div>

        {/* Submit confirm modal */}
        {showSubmit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSubmit(false)} />
            <div className="relative z-10 w-full max-w-sm rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-high p-6 shadow-2xl">
              <h3 className="text-headline-md font-headline-md text-on-surface">Submit quiz?</h3>
              <p className="mt-2 text-body-md text-on-surface-variant">
                {answeredCount === total
                  ? 'All questions answered. Ready to see your score?'
                  : `${total - answeredCount} question${total - answeredCount === 1 ? '' : 's'} unanswered — they’ll count as skipped.`}
              </p>
              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  onClick={() => setShowSubmit(false)}
                  className="rounded-xl border border-outline-variant/30 px-4 py-2.5 text-label-md font-label-md text-on-surface transition-colors hover:bg-surface-container-highest"
                >
                  Keep going
                </button>
                <button
                  onClick={() => void handleSubmit()}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-label-md font-label-md text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent" /> : <span className="material-symbols-outlined text-[18px]">check_circle</span>}
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

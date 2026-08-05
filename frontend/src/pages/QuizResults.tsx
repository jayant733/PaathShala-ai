import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import ScoreDonut from '../components/quiz/ScoreDonut';
import { quizApi, type QuizResult } from '../api/quiz.api';

const PASS_PCT = 60;

function formatAnswer(v: string | string[] | null | undefined): string {
  if (v == null) return '—';
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—';
  return v || '—';
}

export default function QuizResults() {
  const { quizId, attemptId } = useParams<{ quizId: string; attemptId: string }>();
  const navigate = useNavigate();

  const [result, setResult] = useState<QuizResult | null>(null);
  const [title, setTitle] = useState('Quiz results');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(0);

  useEffect(() => {
    const load = async () => {
      if (!quizId || !attemptId) return;
      setLoading(true);
      setError(null);
      try {
        const [res, attempt] = await Promise.all([
          quizApi.getAttemptResult(quizId, attemptId),
          quizApi.getAttempt(quizId, attemptId),
        ]);
        setResult(res);
        if (attempt.quiz_title) setTitle(attempt.quiz_title);
      } catch (e) {
        setError((e as Error).message || 'Could not load results');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [quizId, attemptId]);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-body-md text-on-surface-variant">{error || 'Results not found'}</p>
        <button onClick={() => navigate('/quizzes')} className="rounded-xl bg-primary px-4 py-2.5 text-label-md font-label-md text-on-primary">
          Back to quizzes
        </button>
      </div>
    );
  }

  const passed = result.percent >= PASS_PCT;

  return (
    <div className="flex min-h-screen w-full flex-col px-margin-mobile py-stack-lg md:px-margin-desktop">
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col">
        <button onClick={() => navigate('/quizzes')} className="mb-4 inline-flex w-fit items-center gap-1.5 text-label-md font-label-md text-on-surface-variant hover:text-on-surface">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to quizzes
        </button>

        {/* Score header */}
        <div className="flex flex-col items-center gap-6 rounded-[2rem] border border-outline-variant/20 bg-surface-container-low/60 px-6 py-10 text-center sm:flex-row sm:items-center sm:justify-center sm:gap-10 sm:text-left">
          <ScoreDonut
            percent={Math.round(result.percent)}
            caption={passed ? 'Passed' : 'Needs work'}
            colorClass={passed ? 'text-primary' : 'text-error'}
          />
          <div>
            <p className="text-label-md font-label-md uppercase tracking-[0.16em] text-on-surface-variant">{title}</p>
            <h1 className="mt-1 text-headline-lg font-headline-lg text-on-surface">
              You scored <span className="text-primary">{result.score}</span> / {result.total_points}
            </h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              {result.correct_count} correct · {result.wrong_count} wrong · {result.skipped_count} skipped
            </p>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="mt-stack-md grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/60 p-4 text-center">
            <p className="text-[2rem] font-semibold leading-none text-primary tabular-nums">{result.correct_count}</p>
            <p className="mt-1 text-label-sm uppercase tracking-[0.14em] text-on-surface-variant">Correct</p>
          </div>
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/60 p-4 text-center">
            <p className="text-[2rem] font-semibold leading-none text-error tabular-nums">{result.wrong_count}</p>
            <p className="mt-1 text-label-sm uppercase tracking-[0.14em] text-on-surface-variant">Wrong</p>
          </div>
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/60 p-4 text-center">
            <p className="text-[2rem] font-semibold leading-none text-on-surface-variant tabular-nums">{result.skipped_count}</p>
            <p className="mt-1 text-label-sm uppercase tracking-[0.14em] text-on-surface-variant">Skipped</p>
          </div>
        </div>

        {/* Weak topics */}
        {result.weak_topics.length > 0 && (
          <div className="mt-stack-md rounded-2xl border border-outline-variant/20 bg-surface-container-low/60 p-5">
            <h2 className="flex items-center gap-2 text-headline-md font-headline-md text-on-surface">
              <span className="material-symbols-outlined text-[20px] text-secondary">local_fire_department</span>
              Weak topics
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {result.weak_topics.map((t) => (
                <span key={t.topic} className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container/15 px-3 py-1.5 text-label-sm text-secondary">
                  {t.topic}
                  <span className="text-on-surface-variant">· {t.wrong_count}/{t.total_count} wrong</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Question review */}
        <div className="mt-stack-lg">
          <h2 className="mb-4 text-headline-md font-headline-md text-on-surface">Review answers</h2>
          <div className="grid gap-3">
            {result.question_results.map((qr, i) => {
              const isOpen = open === i;
              return (
                <div key={qr.question_id} className="overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-low/60">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-start gap-3 px-5 py-4 text-left"
                  >
                    <span
                      className={clsx(
                        'mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-label-sm font-label-sm',
                        qr.is_correct ? 'bg-primary/15 text-primary' : 'bg-error/15 text-error'
                      )}
                    >
                      <span className="material-symbols-outlined text-[16px]">{qr.is_correct ? 'check' : 'close'}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-body-md font-medium text-on-surface">{qr.question_text}</span>
                      <span className="mt-0.5 block text-label-sm text-on-surface-variant">
                        {i + 1}. {qr.is_correct ? 'Correct' : qr.your_answer == null ? 'Skipped' : 'Incorrect'} · {qr.points} pt
                      </span>
                    </span>
                    <span className={clsx('material-symbols-outlined mt-1 text-on-surface-variant transition-transform', isOpen && 'rotate-180')}>
                      expand_more
                    </span>
                  </button>
                  {isOpen && (
                    <div className="grid gap-3 border-t border-outline-variant/15 px-5 py-4 sm:grid-cols-2">
                      <div className="rounded-xl bg-surface-container-high/70 p-3.5">
                        <p className="text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">Your answer</p>
                        <p className={clsx('mt-1 text-body-md', qr.is_correct ? 'text-on-surface' : 'text-error')}>
                          {formatAnswer(qr.your_answer)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-primary/10 p-3.5">
                        <p className="text-label-sm uppercase tracking-[0.12em] text-primary">Correct answer</p>
                        <p className="mt-1 text-body-md text-on-surface">{formatAnswer(qr.correct_answers)}</p>
                      </div>
                      {qr.explanation && (
                        <div className="rounded-xl bg-surface-container-high/70 p-3.5 sm:col-span-2">
                          <p className="text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">Explanation</p>
                          <p className="mt-1 text-body-md leading-relaxed text-on-surface-variant">{qr.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Retake */}
        <div className="mt-stack-lg flex justify-center">
          <button
            onClick={() => navigate(`/quizzes/${quizId}/take`)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-6 py-3 text-label-md font-label-md text-on-primary transition-opacity hover:opacity-90"
          >
            <span className="material-symbols-outlined text-[18px]">replay</span>
            Take the quiz again
          </button>
        </div>
      </div>
    </div>
  );
}

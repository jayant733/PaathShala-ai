import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import HistorySourceRow from '../components/quiz/HistorySourceRow';
import { useQuizStore } from '../store/quizStore';
import type { QuizSourceItem, QuizTemplate, Difficulty } from '../api/quiz.api';

const TEMPLATES: { value: QuizTemplate; label: string; desc: string }[] = [
  { value: 'beginner', label: 'Beginner', desc: 'Foundational concepts' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Applied understanding' },
  { value: 'advanced', label: 'Advanced', desc: 'Expert-level depth' },
  { value: 'coding', label: 'Coding', desc: 'Code snippets & logic' },
  { value: 'concept', label: 'Concept', desc: 'Definitions & theory' },
];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const STEP_LABELS = ['Generating', 'Validating', 'Repairing', 'Saving'];

/** Two-tab create flow: free-form AI prompt, or from a past chat / AI interaction. */
export default function QuizCreate() {
  const navigate = useNavigate();
  const { generateQuiz, generateFromHistory, fetchSources, sources } = useQuizStore();

  const [tab, setTab] = useState<'prompt' | 'history'>('prompt');
  const [prompt, setPrompt] = useState('');
  const [template, setTemplate] = useState<QuizTemplate>('intermediate');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [questionCount, setQuestionCount] = useState(5);
  const [sourceSearch, setSourceSearch] = useState('');
  const [selectedSource, setSelectedSource] = useState<QuizSourceItem | null>(null);

  const [step, setStep] = useState(-1); // -1 idle, 0..3 progress, 4 done
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => fetchSources(sourceSearch || undefined), 250);
    return () => clearTimeout(t);
  }, [fetchSources, sourceSearch]);

  const runGeneration = async (fn: () => Promise<{ id: string }>) => {
    setError(null);
    setStep(0);
    // Fast-forward through the visible steps; errors abort mid-way.
    try {
      const quiz = await fn();
      setStep(4);
      setTimeout(() => navigate(`/quizzes/${quiz.id}/edit`), 400);
    } catch (e) {
      setStep(-1);
      setError((e as Error).message || 'Generation failed');
    }
  };

  const handlePromptGenerate = () => {
    if (!prompt.trim()) return;
    void runGeneration(() =>
      generateQuiz({
        prompt: prompt.trim(),
        template,
        question_count: questionCount,
        difficulty: difficulty || undefined,
      })
    );
  };

  const handleHistoryGenerate = () => {
    if (!selectedSource) return;
    void runGeneration(() =>
      generateFromHistory({
        source_type: selectedSource.source_type,
        source_id: selectedSource.id,
        template,
        question_count: questionCount,
        difficulty: difficulty || undefined,
      })
    );
  };

  const busy = step >= 0;

  return (
    <div className="flex min-h-screen w-full flex-col px-margin-mobile py-stack-lg md:px-margin-desktop">
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col">
        <button onClick={() => navigate('/quizzes')} className="mb-4 inline-flex w-fit items-center gap-1.5 text-label-md font-label-md text-on-surface-variant hover:text-on-surface">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to quizzes
        </button>

        <h1 className="text-headline-lg font-headline-lg text-on-surface">Create a quiz</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Describe what to test, or pick a past conversation to turn into a quiz.
        </p>

        {/* Tabs */}
        <div className="mt-stack-lg flex gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-high/70 p-1.5">
          {(['prompt', 'history'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); }}
              className={clsx(
                'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-label-md font-label-md transition-colors',
                tab === t ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              <span className="material-symbols-outlined text-[18px]">{t === 'prompt' ? 'edit_note' : 'history'}</span>
              {t === 'prompt' ? 'AI prompt' : 'From history'}
            </button>
          ))}
        </div>

        {/* Generation progress stepper */}
        {busy && (
          <div className="mt-stack-md flex flex-col items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 px-6 py-8 text-center">
            <div className="relative h-10 w-10">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
            </div>
            <div>
              <p className="text-headline-md font-headline-md text-on-surface">
                {step < 4 ? STEP_LABELS[Math.min(step, STEP_LABELS.length - 1)] : 'Done'}
              </p>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                {step < 4 ? 'Crafting your quiz with AI…' : 'Opening the editor…'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {STEP_LABELS.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <span
                    className={clsx(
                      'rounded-full px-3 py-1 text-label-xs font-label-xs uppercase tracking-wide transition-colors',
                      step > i ? 'bg-primary text-on-primary' : step === i ? 'bg-primary/15 text-primary' : 'bg-surface-container-high text-on-surface-variant/60'
                    )}
                  >
                    {label}
                  </span>
                  {i < STEP_LABELS.length - 1 && <span className="h-px w-4 bg-outline-variant/40" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-stack-md rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-body-sm text-error">
            {error}
          </div>
        )}

        {!busy && (
          <div className="mt-stack-md">
            {tab === 'prompt' ? (
              <div className="grid gap-5 rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-low/60 p-6">
                <label className="block">
                  <span className="field-label">Prompt</span>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={5}
                    placeholder="e.g. Create a 5-question medium Java Spring Boot quiz covering dependency injection and REST controllers"
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y transition-colors"
                  />
                </label>

                <div>
                  <span className="field-label">Template</span>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setTemplate(t.value)}
                        className={clsx(
                          'rounded-xl border px-3 py-2.5 text-left transition-colors',
                          template === t.value ? 'border-primary/70 bg-primary/10' : 'border-outline-variant/20 bg-surface-container-high/50 hover:border-primary/40'
                        )}
                      >
                        <span className={clsx('block text-label-md font-label-md', template === t.value ? 'text-primary' : 'text-on-surface')}>{t.label}</span>
                        <span className="mt-0.5 block text-label-xs text-on-surface-variant">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:max-w-md">
                  <label className="block">
                    <span className="field-label">Difficulty</span>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as Difficulty | '')}
                      className="w-full cursor-pointer rounded-xl border border-outline-variant/30 bg-surface-container-high px-3 py-2.5 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    >
                      <option value="">Auto</option>
                      {DIFFICULTIES.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="field-label">Questions</span>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Math.min(50, Math.max(1, Number(e.target.value) || 1)))}
                      className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-3 py-2.5 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </label>
                </div>

                <button
                  onClick={handlePromptGenerate}
                  disabled={!prompt.trim()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-label-md font-label-md text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  Generate quiz
                </button>
              </div>
            ) : (
              <div className="grid gap-5 rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-low/60 p-6">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">search</span>
                  </span>
                  <input
                    value={sourceSearch}
                    onChange={(e) => setSourceSearch(e.target.value)}
                    placeholder="Search your chats & AI interactions…"
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 pl-10 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  />
                </div>

                {sources.length === 0 ? (
                  <p className="py-10 text-center text-body-sm text-on-surface-variant">
                    No past chats or AI interactions yet. Have a conversation in the AI Tutor or Agent Chat first.
                  </p>
                ) : (
                  <div className="grid max-h-[420px] gap-2.5 overflow-y-auto pr-1">
                    {sources.map((item) => (
                      <HistorySourceRow
                        key={`${item.source_type}-${item.id}`}
                        item={item}
                        selected={selectedSource?.id === item.id && selectedSource?.source_type === item.source_type}
                        onSelect={(s) => setSelectedSource(s)}
                      />
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 sm:max-w-md">
                  <label className="block">
                    <span className="field-label">Difficulty</span>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as Difficulty | '')}
                      className="w-full cursor-pointer rounded-xl border border-outline-variant/30 bg-surface-container-high px-3 py-2.5 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    >
                      <option value="">Auto</option>
                      {DIFFICULTIES.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="field-label">Questions</span>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Math.min(50, Math.max(1, Number(e.target.value) || 1)))}
                      className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-3 py-2.5 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </label>
                </div>

                <button
                  onClick={handleHistoryGenerate}
                  disabled={!selectedSource}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-label-md font-label-md text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  Generate from selection
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

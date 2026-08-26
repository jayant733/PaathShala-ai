import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import HistorySourceRow from '../components/quiz/HistorySourceRow';
import { useQuizStore } from '../store/quizStore';
import { useAIStore } from '../store/aiStore';
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
  const { mode, provider, model } = useAIStore();

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
      setTimeout(() => navigate(`/quizzes/${quiz.id}/take`), 400);
    } catch (e: any) {
      setStep(-1);
      const apiError = e.response?.data?.detail;
      setError(apiError || e.message || 'Generation failed');
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
        provider: mode === 'auto' ? undefined : provider,
        model_name: mode === 'auto' ? undefined : model,
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
        // Optional because API might not support it, but if it does, it'll use it
      })
    );
  };

  const busy = step >= 0;

  return (
    <div className="flex flex-col w-full">
      <div className="max-w-[1000px] w-full mx-auto px-spacing-gutter py-12">
        
        {/* Breadcrumb / Back link */}
        <button onClick={() => navigate('/quizzes')} className="inline-flex items-center gap-2 font-button-text text-on-surface-variant hover:text-on-surface transition-colors mb-8 w-fit group">
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">arrow_back</span>
          Back to quizzes
        </button>

        {/* Header Section */}
        <div className="mb-10">
          <h2 className="font-display-lg-mobile lg:font-display-lg text-primary mb-4 tracking-tight">Create a quiz</h2>
          <p className="font-body-lg text-on-surface-variant max-w-2xl">
            Describe what to test, or pick a past conversation to turn into a quiz.
          </p>
        </div>

        {/* Generation progress stepper (Quiz Generation Page) */}
        {busy ? (
          <div className="bg-surface border-4 border-surface-border p-12 shadow-[12px_12px_0_0_#111827] flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[400px]">
            {/* Decorative background grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            <div className="relative h-24 w-24 mb-10 z-10">
              <div className="absolute inset-0 border-4 border-surface-border bg-mint-accent shadow-[4px_4px_0_0_#111827] animate-[spin_3s_linear_infinite]" />
              <div className="absolute inset-2 border-4 border-surface-border bg-secondary animate-[spin_2s_linear_infinite_reverse]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px] text-on-surface z-20 animate-pulse">auto_awesome</span>
              </div>
            </div>

            <div className="relative z-10">
              <span className="bg-ink-black text-on-primary px-4 py-1 font-label-caps uppercase tracking-widest text-[12px] mb-4 inline-block border-2 border-surface-border shadow-[2px_2px_0_0_#003527]">
                Step {Math.min(step + 1, STEP_LABELS.length)} of {STEP_LABELS.length}
              </span>
              <h3 className="font-display-lg text-[48px] font-black text-ink-black uppercase mb-4 leading-none tracking-tight">
                {step < 4 ? STEP_LABELS[Math.min(step, STEP_LABELS.length - 1)] : 'Done'}
              </h3>
              <p className="font-body-lg text-on-surface-variant max-w-md mx-auto bg-surface-container p-4 border-l-4 border-primary">
                {step < 4 ? 'Our AI engine is currently crafting your quiz. This process involves analyzing context, generating questions, and validating difficulty.' : 'Generation complete! Opening the quiz editor...'}
              </p>
            </div>

            <div className="w-full max-w-2xl mt-12 relative z-10">
              <div className="flex justify-between mb-2">
                {STEP_LABELS.map((label, i) => (
                  <span key={label} className={clsx("font-label-caps text-[10px] uppercase tracking-widest transition-colors", step >= i ? 'text-primary font-bold' : 'text-on-surface-variant opacity-50')}>
                    {label}
                  </span>
                ))}
              </div>
              <div className="h-4 w-full bg-surface-container border-2 border-surface-border rounded-none relative overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-secondary transition-all duration-500 ease-out border-r-2 border-surface-border"
                  style={{ width: `${Math.max(5, (step / (STEP_LABELS.length - 1)) * 100)}%` }}
                >
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 20px)' }}></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-error text-on-error border-4 border-surface-border shadow-[4px_4px_0_0_#111827] font-body-lg font-bold">
                Error: {error}
              </div>
            )}

            {/* Tab Switcher */}
            <div className="flex items-center gap-2 mb-6">
              <button 
                onClick={() => { setTab('prompt'); setError(null); }}
                className={clsx("flex items-center gap-2 border-2 px-6 py-3 font-button-text transition-all", tab === 'prompt' ? "bg-primary text-on-primary border-surface-border shadow-[4px_4px_0px_0px_#111827]" : "bg-surface-container-high text-on-surface-variant border-transparent hover:border-surface-border hover:bg-surface-container-highest")}
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                AI prompt
              </button>
              <button 
                onClick={() => { setTab('history'); setError(null); }}
                className={clsx("flex items-center gap-2 border-2 px-6 py-3 font-button-text transition-all", tab === 'history' ? "bg-primary text-on-primary border-surface-border shadow-[4px_4px_0px_0px_#111827]" : "bg-surface-container-high text-on-surface-variant border-transparent hover:border-surface-border hover:bg-surface-container-highest")}
              >
                <span className="material-symbols-outlined text-[18px]">history</span>
                From history
              </button>
            </div>

            {/* Main Configuration Card */}
            <div className="bg-surface-container-lowest border-2 border-surface-border p-6 md:p-10 flex flex-col gap-10 relative">
              
              {tab === 'prompt' ? (
                /* PROMPT Section */
                <div>
                  <label className="block font-label-caps text-on-surface-variant uppercase tracking-widest mb-4" htmlFor="quiz-prompt">Prompt</label>
                  <textarea 
                    id="quiz-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full bg-surface border-2 border-surface-border p-5 min-h-[160px] font-body-md text-on-surface resize-y focus:shadow-[4px_4px_0px_0px_#111827] outline-none transition-all placeholder:text-on-surface-variant/50" 
                    placeholder="e.g. Create a 5-question medium Java Spring Boot quiz covering dependency injection and REST controllers"
                  ></textarea>
                </div>
              ) : (
                /* HISTORY Section */
                <div>
                  <label className="block font-label-caps text-on-surface-variant uppercase tracking-widest mb-4">Select Source</label>
                  <div className="relative mb-4">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">search</span>
                    <input
                      value={sourceSearch}
                      onChange={(e) => setSourceSearch(e.target.value)}
                      placeholder="Search your chats & AI interactions…"
                      className="w-full bg-surface border-2 border-surface-border py-3 pl-12 pr-4 font-body-md focus:shadow-[4px_4px_0px_0px_#111827] outline-none transition-all placeholder:text-on-surface-variant/50"
                    />
                  </div>

                  {sources.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-surface-border text-center">
                      <p className="font-body-md text-on-surface-variant">No past chats or AI interactions yet. Have a conversation in the AI Tutor or Agent Chat first.</p>
                    </div>
                  ) : (
                    <div className="grid max-h-[300px] gap-2 overflow-y-auto pr-2 custom-scrollbar">
                      {sources.map((item) => (
                        <div key={`${item.source_type}-${item.id}`} className="border-2 border-surface-border">
                          <HistorySourceRow
                            item={item}
                            selected={selectedSource?.id === item.id && selectedSource?.source_type === item.source_type}
                            onSelect={(s) => setSelectedSource(s)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TEMPLATE Section */}
              <div>
                <span className="block font-label-caps text-on-surface-variant uppercase tracking-widest mb-4">Template</span>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  {TEMPLATES.map((t) => {
                    const isActive = template === t.value;
                    return (
                      <div 
                        key={t.value} 
                        onClick={() => setTemplate(t.value)}
                        className={clsx("border-2 border-surface-border p-4 transition-all cursor-pointer", isActive ? "bg-mint-accent shadow-[4px_4px_0px_0px_#111827] relative overflow-hidden" : "bg-surface hover:shadow-[4px_4px_0px_0px_#111827] group")}
                      >
                        {isActive && <div className="absolute top-0 right-0 w-8 h-8 bg-surface-border transform translate-x-4 -translate-y-4 rotate-45"></div>}
                        <div className="font-button-text text-on-surface mb-1">{t.label}</div>
                        <div className={clsx("font-body-md text-sm", isActive ? "text-on-surface-variant" : "text-on-surface-variant group-hover:text-on-surface")}>{t.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Settings Row (Difficulty & Questions) */}
              <div className="flex flex-wrap items-end gap-8 border-t-2 border-surface-border pt-8">
                <div>
                  <label className="block font-label-caps text-on-surface-variant uppercase tracking-widest mb-3" htmlFor="difficulty-select">Difficulty</label>
                  <div className="relative">
                    <select 
                      id="difficulty-select"
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as Difficulty | '')}
                      className="appearance-none bg-surface border-2 border-surface-border py-3 pl-4 pr-10 font-button-text text-on-surface w-48 focus:shadow-[4px_4px_0px_0px_#111827] outline-none transition-all cursor-pointer rounded-none"
                    >
                      <option value="">Auto</option>
                      {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface">expand_more</span>
                  </div>
                </div>

                <div>
                  <label className="block font-label-caps text-on-surface-variant uppercase tracking-widest mb-3" htmlFor="questions-input">Questions</label>
                  <input 
                    id="questions-input"
                    type="number" 
                    min={1} max={50} 
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Math.min(50, Math.max(1, Number(e.target.value) || 1)))}
                    className="bg-surface border-2 border-surface-border py-3 px-4 font-button-text text-on-surface w-24 focus:shadow-[4px_4px_0px_0px_#111827] outline-none transition-all rounded-none" 
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4">
                <button 
                  onClick={tab === 'prompt' ? handlePromptGenerate : handleHistoryGenerate}
                  disabled={tab === 'prompt' ? !prompt.trim() : !selectedSource}
                  className="w-full bg-secondary text-on-secondary-container border-2 border-surface-border py-5 font-headline-lg flex items-center justify-center gap-3 hover:shadow-[6px_6px_0px_0px_#111827] hover:-translate-y-1 transition-all active:translate-y-0 active:shadow-[2px_2px_0px_0px_#111827] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0"
                >
                  <span className="material-symbols-outlined text-[28px]">flare</span>
                  Generate quiz
                </button>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}

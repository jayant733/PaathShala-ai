import clsx from 'clsx';
import type { QuestionDraft, QuestionType, Difficulty } from '../../api/quiz.api';

interface QuestionEditorProps {
  index: number;
  question: QuestionDraft;
  onChange: (updated: QuestionDraft) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'MCQ', label: 'Multiple choice' },
  { value: 'multiple', label: 'Checkboxes' },
  { value: 'true_false', label: 'True / False' },
  { value: 'short_answer', label: 'Short answer' },
];

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

function isChoiceType(t: QuestionType) {
  return t === 'MCQ' || t === 'multiple' || t === 'true_false';
}

/** Inline editor for a single question (used by QuizEdit). */
export default function QuestionEditor({ index, question, onChange, onRemove, onMoveUp, onMoveDown, canMoveUp, canMoveDown }: QuestionEditorProps) {
  const set = (patch: Partial<QuestionDraft>) => onChange({ ...question, ...patch });

  const setOption = (i: number, value: string) =>
    set({ options: question.options.map((o, idx) => (idx === i ? value : o)) });
  const addOption = () => set({ options: [...question.options, `Option ${question.options.length + 1}`] });
  const removeOption = (i: number) => {
    const options = question.options.filter((_, idx) => idx !== i);
    // Drop the removed option from correct answers so grading stays consistent.
    const removed = question.options[i];
    const correct_answers = question.correct_answers.filter(a => a !== removed);
    onChange({ ...question, options, correct_answers });
  };

  const toggleCorrect = (opt: string) => {
    const already = question.correct_answers.includes(opt);
    if (question.question_type === 'MCQ' || question.question_type === 'true_false') {
      set({ correct_answers: already ? [] : [opt] });
    } else {
      set({ correct_answers: already ? question.correct_answers.filter(a => a !== opt) : [...question.correct_answers, opt] });
    }
  };

  const options = question.question_type === 'true_false' ? ['True', 'False'] : question.options;

  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/60 p-5">
      {/* Header row: number + actions */}
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-label-md font-label-md text-primary">
          {index + 1}
        </span>
        <div className="flex-1" />
        <button onClick={onMoveUp} disabled={!canMoveUp} aria-label="Move question up" className="icon-btn">
          <span className="material-symbols-outlined text-[20px]">keyboard_arrow_up</span>
        </button>
        <button onClick={onMoveDown} disabled={!canMoveDown} aria-label="Move question down" className="icon-btn">
          <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
        </button>
        <button onClick={onRemove} aria-label="Delete question" className="icon-btn hover:!text-error">
          <span className="material-symbols-outlined text-[20px]">delete</span>
        </button>
      </div>

      <div className="grid gap-4">
        {/* Question text */}
        <textarea
          value={question.question_text}
          onChange={(e) => set({ question_text: e.target.value })}
          rows={2}
          placeholder="Question text…"
          className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y transition-colors"
        />

        {/* Type + difficulty + points */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="col-span-2 block">
            <span className="field-label">Type</span>
            <select
              value={question.question_type}
              onChange={(e) => {
                const t = e.target.value as QuestionType;
                // Reset correct answers on type change — they no longer match.
                onChange({ ...question, question_type: t, correct_answers: [] });
              }}
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-3 py-2.5 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              {QUESTION_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="field-label">Difficulty</span>
            <select
              value={question.difficulty}
              onChange={(e) => set({ difficulty: e.target.value as Difficulty })}
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-3 py-2.5 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              {DIFFICULTIES.map(d => (
                <option key={d} value={d} className="capitalize">{d}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="field-label">Points</span>
            <input
              type="number"
              min={1}
              value={question.points}
              onChange={(e) => set({ points: Math.max(1, Number(e.target.value) || 1) })}
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-3 py-2.5 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </label>
        </div>

        {/* Options + correct answer */}
        {isChoiceType(question.question_type) && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="field-label">Options</span>
              <div className="grid gap-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={opt}
                      onChange={(e) => setOption(i, e.target.value)}
                      readOnly={question.question_type === 'true_false'}
                      className="min-w-0 flex-1 rounded-xl border border-outline-variant/30 bg-surface-container-high px-3 py-2.5 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                    {question.question_type !== 'true_false' && (
                      <button onClick={() => removeOption(i)} aria-label="Remove option" className="icon-btn hover:!text-error">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    )}
                  </div>
                ))}
                {question.question_type !== 'true_false' && (
                  <button onClick={addOption} className="text-label-md font-label-md text-primary inline-flex items-center gap-1 hover:opacity-80">
                    <span className="material-symbols-outlined text-[18px]">add_circle</span> Add option
                  </button>
                )}
              </div>
            </div>
            <div>
              <span className="field-label">
                {question.question_type === 'multiple' ? 'Correct answers' : 'Correct answer'}
              </span>
              <div className="grid gap-2">
                {options.map((opt, i) => {
                  const checked = question.correct_answers.includes(opt);
                  return (
                    <button
                      key={i}
                      onClick={() => toggleCorrect(opt)}
                      className={clsx(
                        'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors',
                        checked ? 'border-primary/70 bg-primary/10' : 'border-outline-variant/30 bg-surface-container-high/50 hover:border-primary/40'
                      )}
                    >
                      <span
                        className={clsx(
                          'flex h-5 w-5 items-center justify-center border-2 transition-colors',
                          question.question_type === 'multiple' ? 'rounded-md' : 'rounded-full',
                          checked ? 'border-primary bg-primary' : 'border-on-surface-variant/50'
                        )}
                      >
                        {checked && (
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="text-on-primary">
                            <path d="M2 6.2 4.7 9 10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <span className="truncate text-body-sm">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Short answer: accepted answers */}
        {question.question_type === 'short_answer' && (
          <div>
            <span className="field-label">Accepted answers (case-insensitive match)</span>
            <div className="grid gap-2">
              {question.correct_answers.map((ans, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={ans}
                    onChange={(e) => set({ correct_answers: question.correct_answers.map((a, idx) => (idx === i ? e.target.value : a)) })}
                    placeholder="e.g. Spring Boot"
                    className="min-w-0 flex-1 rounded-xl border border-outline-variant/30 bg-surface-container-high px-3 py-2.5 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                  <button
                    onClick={() => set({ correct_answers: question.correct_answers.filter((_, idx) => idx !== i) })}
                    aria-label="Remove accepted answer"
                    className="icon-btn hover:!text-error"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              ))}
              <button
                onClick={() => set({ correct_answers: [...question.correct_answers, ''] })}
                className="inline-flex items-center gap-1 text-label-md font-label-md text-primary hover:opacity-80"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span> Add accepted answer
              </button>
            </div>
          </div>
        )}

        {/* Explanation + topic */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Explanation</span>
            <textarea
              value={question.explanation}
              onChange={(e) => set({ explanation: e.target.value })}
              rows={3}
              placeholder="Shown on the results page after submitting…"
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-3 py-2.5 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y"
            />
          </label>
          <label className="block">
            <span className="field-label">Topic</span>
            <input
              value={question.topic}
              onChange={(e) => set({ topic: e.target.value })}
              placeholder="e.g. Dependency Injection"
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-3 py-2.5 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
            <span className="mt-2 block text-label-xs text-on-surface-variant">Topics power the “weak topics” breakdown on results.</span>
          </label>
        </div>
      </div>
    </div>
  );
}

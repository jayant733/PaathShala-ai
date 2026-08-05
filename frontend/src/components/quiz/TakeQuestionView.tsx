import clsx from 'clsx';
import type { QuestionTake } from '../../api/quiz.api';
import type { AnswerValue } from '../../store/quizStore';

interface TakeQuestionViewProps {
  question: QuestionTake;
  /** Current answer for this question (undefined = unanswered). */
  value?: AnswerValue;
  onChange: (value: AnswerValue) => void;
}

/**
 * Answer input for a single take-question, driven by question_type:
 * MCQ / true_false → radio, multiple → checkboxes, short_answer → textarea.
 */
export default function TakeQuestionView({ question, value, onChange }: TakeQuestionViewProps) {
  if (question.question_type === 'short_answer') {
    const text = typeof value === 'string' ? value : '';
    return (
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer…"
        rows={4}
        className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y transition-colors"
      />
    );
  }

  const multiple = question.question_type === 'multiple';
  const selected: string[] = multiple ? (Array.isArray(value) ? value : []) : typeof value === 'string' && value ? [value] : [];
  const options = question.question_type === 'true_false' ? ['True', 'False'] : question.options;

  const toggle = (opt: string) => {
    if (multiple) {
      onChange(selected.includes(opt) ? selected.filter(o => o !== opt) : [...selected, opt]);
    } else {
      onChange(selected[0] === opt ? '' : opt);
    }
  };

  return (
    <div className="grid gap-2.5">
      {options.map((opt, i) => {
        const isSelected = selected.includes(opt);
        return (
          <button
            key={`${opt}-${i}`}
            onClick={() => toggle(opt)}
            className={clsx(
              'flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors',
              isSelected
                ? 'border-primary/70 bg-primary/10 text-on-surface'
                : 'border-outline-variant/30 bg-surface-container-low/60 text-on-surface hover:border-primary/40 hover:bg-surface-container-high'
            )}
          >
            <span
              className={clsx(
                'flex h-5 w-5 flex-shrink-0 items-center justify-center border-2 transition-colors',
                multiple ? 'rounded-md' : 'rounded-full',
                isSelected ? 'border-primary bg-primary' : 'border-on-surface-variant/50'
              )}
            >
              {isSelected && (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="text-on-primary">
                  <path d="M2 6.2 4.7 9 10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className="text-body-md font-body-md">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

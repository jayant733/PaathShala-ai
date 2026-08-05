import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import QuestionEditor from '../components/quiz/QuestionEditor';
import ExportMenu from '../components/quiz/ExportMenu';
import { quizApi, type Quiz, type QuestionDraft, type Difficulty } from '../api/quiz.api';
import { useQuizStore } from '../store/quizStore';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

function toDraft(q: Quiz['questions'][number]): QuestionDraft {
  return {
    question_text: q.question_text,
    question_type: q.question_type,
    options: q.options,
    correct_answers: q.correct_answers,
    explanation: q.explanation,
    difficulty: q.difficulty,
    topic: q.topic,
    points: q.points,
  };
}

function blankQuestion(): QuestionDraft {
  return {
    question_text: '',
    question_type: 'MCQ',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correct_answers: [],
    explanation: '',
    difficulty: 'medium',
    topic: '',
    points: 1,
  };
}

export default function QuizEdit() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { updateQuiz, publishQuiz, regenerateQuiz } = useQuizStore();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [duration, setDuration] = useState(10);
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!quizId) return;
    setLoading(true);
    setError(null);
    try {
      const q = await quizApi.get(quizId);
      setQuiz(q);
      setTitle(q.title);
      setDescription(q.description ?? '');
      setSubject(q.subject ?? '');
      setDifficulty(q.difficulty);
      setDuration(q.duration_minutes);
      setQuestions(q.questions.map(toDraft));
    } catch (e) {
      setError((e as Error).message || 'Could not load quiz');
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateQuestion = (i: number, updated: QuestionDraft) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? updated : q)));

  const addQuestion = () => setQuestions((qs) => [...qs, blankQuestion()]);
  const removeQuestion = (i: number) => setQuestions((qs) => qs.filter((_, idx) => idx !== i));
  const moveQuestion = (i: number, dir: -1 | 1) =>
    setQuestions((qs) => {
      const j = i + dir;
      if (j < 0 || j >= qs.length) return qs;
      const copy = [...qs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const save = async (publish: boolean) => {
    if (!quizId) return;
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const payload = { title: title.trim(), description, subject, difficulty, duration_minutes: duration, questions };
      if (publish) {
        await updateQuiz(quizId, payload);
        const published = await publishQuiz(quizId);
        setQuiz(published);
        setNotice('Quiz published — it’s now available to take.');
      } else {
        const updated = await updateQuiz(quizId, payload);
        setQuiz(updated);
        setNotice('Draft saved.');
      }
    } catch (e) {
      setError((e as Error).message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!quizId) return;
    setSaving(true);
    setError(null);
    try {
      const fresh = await regenerateQuiz(quizId);
      await load();
      setNotice(`Regenerated a fresh draft "${fresh.title}".`);
    } catch (e) {
      setError((e as Error).message || 'Regeneration failed');
    } finally {
      setSaving(false);
    }
  };

  const answered = questions.map((q, i) => (q.question_text.trim() ? i : null)).filter((i) => i !== null) as number[];

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-body-md text-on-surface-variant">This quiz doesn’t exist or you don’t have access.</p>
        <button onClick={() => navigate('/quizzes')} className="rounded-xl bg-primary px-4 py-2.5 text-label-md font-label-md text-on-primary">
          Back to quizzes
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col px-margin-mobile py-stack-lg md:px-margin-desktop">
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col">
        <button onClick={() => navigate('/quizzes')} className="mb-4 inline-flex w-fit items-center gap-1.5 text-label-md font-label-md text-on-surface-variant hover:text-on-surface">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to quizzes
        </button>

        {/* Header */}
        <div className="mb-stack-lg flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-headline-lg font-headline-lg text-on-surface">{title || 'Untitled quiz'}</h1>
            <span
              className={clsx(
                'rounded-full px-2.5 py-1 text-label-xs font-label-xs uppercase tracking-wide',
                quiz.status === 'published' ? 'bg-primary/15 text-primary' : 'bg-surface-container-highest text-on-surface-variant'
              )}
            >
              {quiz.status}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <ExportMenu quizId={quiz.id} quizTitle={title} disabled={saving} />
            <button
              onClick={() => void save(false)}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-2.5 text-label-md font-label-md text-on-surface transition-colors hover:border-primary/50 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              Save draft
            </button>
            <button
              onClick={() => void save(true)}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-label-md font-label-md text-on-primary transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
              Publish
            </button>
          </div>
        </div>

        {/* Notices */}
        {notice && <div className="mb-stack-md rounded-xl border border-tertiary/30 bg-tertiary/10 px-4 py-3 text-body-sm text-on-tertiary">{notice}</div>}
        {error && <div className="mb-stack-md rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-body-sm text-error">{error}</div>}

        {/* Metadata */}
        <div className="mb-stack-lg grid gap-4 rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-low/60 p-6 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="field-label">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quiz title"
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="field-label">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional description shown on the library card"
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y transition-colors"
            />
          </label>
          <label className="block">
            <span className="field-label">Subject</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Spring Boot"
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="field-label">Difficulty</span>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full cursor-pointer rounded-xl border border-outline-variant/30 bg-surface-container-high px-3 py-3 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d} className="capitalize">{d}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="field-label">Minutes</span>
              <input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Math.max(1, Number(e.target.value) || 1))}
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-3 py-3 text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </label>
          </div>
        </div>

        {/* Questions */}
        <div className="mb-stack-md flex items-center justify-between">
          <h2 className="text-headline-md font-headline-md text-on-surface">Questions <span className="text-on-surface-variant">({questions.length})</span></h2>
          <button
            onClick={addQuestion}
            className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-2 text-label-md font-label-md text-on-surface transition-colors hover:border-primary/50"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add question
          </button>
        </div>

        {questions.length === 0 ? (
          <p className="py-10 text-center text-body-sm text-on-surface-variant">No questions yet — add one or regenerate from AI.</p>
        ) : (
          <div className="grid gap-4">
            {questions.map((q, i) => (
              <QuestionEditor
                key={i}
                index={i}
                question={q}
                onChange={(updated) => updateQuestion(i, updated)}
                onRemove={() => removeQuestion(i)}
                onMoveUp={() => moveQuestion(i, -1)}
                onMoveDown={() => moveQuestion(i, 1)}
                canMoveUp={i > 0}
                canMoveDown={i < questions.length - 1}
              />
            ))}
          </div>
        )}

        {/* Footer actions */}
        <div className="sticky bottom-4 z-20 mt-stack-lg flex flex-wrap items-center gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-high/90 px-4 py-3 shadow-lg backdrop-blur-md">
          <span className="text-label-sm text-on-surface-variant">
            {answered.length} of {questions.length} questions have text
          </span>
          <div className="flex-1" />
          <button
            onClick={handleRegenerate}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/30 px-4 py-2.5 text-label-md font-label-md text-on-surface transition-colors hover:border-primary/50 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Regenerate from AI
          </button>
          <button
            onClick={() => void save(false)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-2.5 text-label-md font-label-md text-on-surface transition-colors hover:border-primary/50 disabled:opacity-50"
          >
            Save draft
          </button>
          <button
            onClick={() => void save(true)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-label-md font-label-md text-on-primary transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}

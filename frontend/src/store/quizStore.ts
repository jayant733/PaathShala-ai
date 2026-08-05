import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  quizApi,
  type Quiz,
  type QuizSourceItem,
  type QuizGenerateRequest,
  type QuizGenerateFromHistoryRequest,
  type QuizUpdateRequest,
  type QuizAttempt,
  type QuizStatus,
  type Difficulty,
} from '../api/quiz.api';

export type AnswerValue = string | string[];

/** The resumable "take" session — persisted so a refresh doesn't lose progress. */
export interface ActiveAttempt {
  quizId: string;
  attemptId: string;
  quizTitle: string;
  answers: Record<string, AnswerValue>;
  currentIndex: number;
  markedForReview: string[];
  secondsLeft: number;
}

interface QuizState {
  quizzes: Quiz[];
  sources: QuizSourceItem[];
  loading: boolean;
  error: string | null;
  activeAttempt: ActiveAttempt | null;

  fetchQuizzes: (params?: { status?: QuizStatus; subject?: string; difficulty?: Difficulty; search?: string }) => Promise<void>;
  fetchSources: (search?: string) => Promise<void>;
  generateQuiz: (req: QuizGenerateRequest) => Promise<Quiz>;
  generateFromHistory: (req: QuizGenerateFromHistoryRequest) => Promise<Quiz>;
  createDraft: (body: QuizUpdateRequest) => Promise<Quiz>;
  updateQuiz: (id: string, body: QuizUpdateRequest) => Promise<Quiz>;
  publishQuiz: (id: string) => Promise<Quiz>;
  duplicateQuiz: (id: string) => Promise<Quiz>;
  regenerateQuiz: (id: string) => Promise<Quiz>;
  deleteQuiz: (id: string) => Promise<void>;

  startAttempt: (attempt: QuizAttempt, quizTitle: string, durationMinutes: number) => void;
  setAnswer: (questionId: string, value: AnswerValue) => void;
  toggleMark: (questionId: string) => void;
  setIndex: (i: number) => void;
  setSecondsLeft: (s: number) => void;
  resetAttempt: () => void;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      quizzes: [],
      sources: [],
      loading: false,
      error: null,
      activeAttempt: null,

      fetchQuizzes: async (params) => {
        set({ loading: true, error: null });
        try {
          const quizzes = await quizApi.list(params);
          set({ quizzes, loading: false });
        } catch (e) {
          set({ error: (e as Error).message, loading: false });
        }
      },

      fetchSources: async (search) => {
        try {
          const sources = await quizApi.listSources(search);
          set({ sources });
        } catch (e) {
          set({ error: (e as Error).message });
        }
      },

      generateQuiz: async (req) => {
        const quiz = await quizApi.generate(req);
        set({ quizzes: [quiz, ...get().quizzes] });
        return quiz;
      },

      generateFromHistory: async (req) => {
        const quiz = await quizApi.generateFromHistory(req);
        set({ quizzes: [quiz, ...get().quizzes] });
        return quiz;
      },

      createDraft: async (body) => {
        const quiz = await quizApi.create(body);
        set({ quizzes: [quiz, ...get().quizzes] });
        return quiz;
      },

      updateQuiz: async (id, body) => {
        const quiz = await quizApi.update(id, body);
        set({ quizzes: get().quizzes.map(q => (q.id === id ? quiz : q)) });
        return quiz;
      },

      publishQuiz: async (id) => {
        const quiz = await quizApi.publish(id);
        set({ quizzes: get().quizzes.map(q => (q.id === id ? quiz : q)) });
        return quiz;
      },

      duplicateQuiz: async (id) => {
        const quiz = await quizApi.duplicate(id);
        set({ quizzes: [quiz, ...get().quizzes] });
        return quiz;
      },

      regenerateQuiz: async (id) => {
        const quiz = await quizApi.regenerate(id);
        set({ quizzes: [quiz, ...get().quizzes] });
        return quiz;
      },

      deleteQuiz: async (id) => {
        await quizApi.remove(id);
        set({ quizzes: get().quizzes.filter(q => q.id !== id) });
      },

      startAttempt: (attempt, quizTitle, durationMinutes) => {
        set({
          activeAttempt: {
            quizId: attempt.quiz_id,
            attemptId: attempt.id,
            quizTitle,
            answers: {},
            currentIndex: 0,
            markedForReview: [],
            secondsLeft: durationMinutes * 60,
          },
        });
      },

      setAnswer: (questionId, value) => {
        const attempt = get().activeAttempt;
        if (!attempt) return;
        set({
          activeAttempt: {
            ...attempt,
            answers: { ...attempt.answers, [questionId]: value },
          },
        });
      },

      toggleMark: (questionId) => {
        const attempt = get().activeAttempt;
        if (!attempt) return;
        const marked = attempt.markedForReview.includes(questionId)
          ? attempt.markedForReview.filter(id => id !== questionId)
          : [...attempt.markedForReview, questionId];
        set({ activeAttempt: { ...attempt, markedForReview: marked } });
      },

      setIndex: (i) => {
        const attempt = get().activeAttempt;
        if (!attempt) return;
        set({ activeAttempt: { ...attempt, currentIndex: i } });
      },

      setSecondsLeft: (s) => {
        const attempt = get().activeAttempt;
        if (!attempt) return;
        set({ activeAttempt: { ...attempt, secondsLeft: s } });
      },

      resetAttempt: () => set({ activeAttempt: null }),
    }),
    {
      name: 'quiz-active-attempt',
      partialize: (state) => ({ activeAttempt: state.activeAttempt }),
    }
  )
);

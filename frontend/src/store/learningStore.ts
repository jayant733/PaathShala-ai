import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AnswerType, Presentation } from '../components/ai-response/types';

export interface LearningTopic {
  topic: string;
  /** Human-readable category derived from the answer type (e.g. "Architecture"). */
  category?: string;
  difficulty?: string;
  /** Core concepts covered by this lesson. */
  concepts?: string[];
  /** Natural follow-on topics from the presentation. */
  nextTopics?: string[];
  ts: number;
}

const CATEGORIES: Record<AnswerType, string> = {
  architecture: 'Architecture',
  system_design: 'System Design',
  concept: 'Concept',
  code: 'Coding',
  comparison: 'Comparison',
  learning: 'Learning',
  tutorial: 'Tutorial',
  research: 'Research',
  roadmap: 'Roadmap',
  debugging: 'Debugging',
  default: 'Topic',
};

interface LearningState {
  /** Topics the learner has engaged with (presentations rendered). */
  completed: LearningTopic[];
  /** The most recent / current topic. */
  current: LearningTopic | null;
  /** Record a completed presentation as part of the learner's progress. */
  record: (p: Presentation) => void;
  /** Recommended next topic (from the current presentation). */
  recommendedNext: () => string | null;
  /** Clear the tracked progress. */
  reset: () => void;
}

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      completed: [],
      current: null,

      record: (p) => {
        const topic = (p.title || '').trim();
        if (!topic) return;

        const entry: LearningTopic = {
          topic,
          category: p.answerType ? (CATEGORIES[p.answerType] ?? 'Topic') : undefined,
          difficulty: p.difficulty ? String(p.difficulty) : undefined,
          concepts: p.concepts,
          nextTopics: p.nextTopics,
          ts: Date.now(),
        };

        const completed = get().completed;
        const exists = completed.some((c) => c.topic.toLowerCase() === topic.toLowerCase());
        set({
          current: entry,
          completed: exists ? completed : [entry, ...completed].slice(0, 50),
        });
      },

      recommendedNext: () => {
        const next = get().current?.nextTopics?.[0];
        return next || null;
      },

      reset: () => set({ completed: [], current: null }),
    }),
    {
      name: 'learning-progress',
      partialize: (state) => ({ completed: state.completed, current: state.current }),
    }
  )
);

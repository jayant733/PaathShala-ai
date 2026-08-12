import api from './axios';

export type MasteryStatus = 'weak' | 'improving' | 'strong';
export type ReviewOutcome = 'correct' | 'wrong';

export interface TopicMastery {
  topic: string;
  mastery: number;
  elo_rating: number;
  attempts: number;
  correct_count: number;
  wrong_count: number;
  p_correct: number | null;
  confidence: number;
  status: MasteryStatus;
  updated_at: string | null;
}

export interface MasterySummary {
  topics: TopicMastery[];
  average_mastery: number;
  goal_progress: number;
  strong_count: number;
  improving_count: number;
  weak_count: number;
}

export interface LearningPathItem {
  topic: string;
  mastery: number;
  status: MasteryStatus;
  suggested_action: string;
  next_topics: string[];
}

export interface LearningPathResponse {
  items: LearningPathItem[];
  ordered_topics: string[];
}

export interface ReviewDue {
  topic: string;
  due_date: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  decayed_mastery: number;
  reason: string;
}

export interface ReviewCompleteResponse {
  topic: string;
  next_due_date: string;
  interval_days: number;
  ease_factor: number;
}

export const mlApi = {
  getMastery: () => api.get<MasterySummary>('/api/v1/ml/mastery').then(r => r.data),
  getLearningPath: () => api.get<LearningPathResponse>('/api/v1/ml/learning-path').then(r => r.data),
  getDueReviews: () => api.get<ReviewDue[]>('/api/v1/ml/reviews/due').then(r => r.data),
  completeReview: (topic: string, outcome: ReviewOutcome) =>
    api.post<ReviewCompleteResponse>('/api/v1/ml/reviews/complete', { topic, outcome }).then(r => r.data),
  train: () => api.post('/api/v1/ml/train').then(r => r.data),
};

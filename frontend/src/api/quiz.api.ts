import api from './axios';

export type QuestionType = 'MCQ' | 'multiple' | 'true_false' | 'short_answer';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuizStatus = 'draft' | 'published' | 'archived';
export type QuizTemplate = 'beginner' | 'intermediate' | 'advanced' | 'coding' | 'concept';
export type SourceType = 'conversation' | 'interaction';

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: QuestionType;
  options: string[];
  correct_answers: string[];
  explanation: string;
  difficulty: Difficulty;
  topic: string;
  points: number;
  order_index: number;
}

export interface QuestionDraft {
  question_text: string;
  question_type: QuestionType;
  options: string[];
  correct_answers: string[];
  explanation: string;
  difficulty: Difficulty;
  topic: string;
  points: number;
}

/** Student/taking view — no correct_answers / explanation. */
export interface QuestionTake {
  id: string;
  question_text: string;
  question_type: QuestionType;
  options: string[];
  difficulty: Difficulty;
  topic: string;
  order_index: number;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string | null;
  subject?: string | null;
  difficulty: Difficulty;
  duration_minutes: number;
  number_of_questions: number;
  status: QuizStatus;
  created_by: string;
  source_title?: string | null;
  created_at: string;
  updated_at: string;
  questions: Question[];
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  status: string;
  score: number | null;
  total_points: number;
  correct_count: number;
  wrong_count: number;
  skipped_count: number;
  answers: Record<string, string | string[]> | null;
  started_at: string;
  submitted_at: string | null;
  time_taken_seconds: number | null;
  questions?: QuestionTake[] | null;
  quiz_title?: string | null;
  duration_minutes?: number | null;
}

export interface WeakTopic {
  topic: string;
  wrong_count: number;
  total_count: number;
}

export interface QuestionResult {
  question_id: string;
  question_text: string;
  question_type: QuestionType;
  your_answer?: string | string[] | null;
  correct_answers: string[];
  is_correct: boolean;
  explanation: string;
  topic: string;
  points: number;
}

export interface QuizResult {
  attempt_id: string;
  quiz_id: string;
  score: number;
  total_points: number;
  percent: number;
  correct_count: number;
  wrong_count: number;
  skipped_count: number;
  weak_topics: WeakTopic[];
  question_results: QuestionResult[];
}

export interface QuizSourceItem {
  id: string;
  source_type: SourceType;
  title: string;
  preview: string;
  created_at: string;
}

export interface QuizGenerateRequest {
  prompt: string;
  template: QuizTemplate;
  question_count?: number | null;
  difficulty?: Difficulty | null;
  subject?: string | null;
  provider?: string | null;
  model_name?: string | null;
}

export interface QuizGenerateFromHistoryRequest {
  source_type: SourceType;
  source_id: string;
  template: QuizTemplate;
  question_count?: number | null;
  difficulty?: Difficulty | null;
}

export interface QuizUpdateRequest {
  title: string;
  description: string;
  subject: string;
  difficulty: Difficulty;
  duration_minutes: number;
  questions: QuestionDraft[];
}

export interface QuizAttemptUpdate {
  answers?: Record<string, string | string[]> | null;
  status?: 'in_progress' | 'completed' | null;
  time_taken_seconds?: number | null;
}

/** Trigger a browser download for a Blob (used by the export endpoints). */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const quizApi = {
  generate: (req: QuizGenerateRequest) => api.post<Quiz>('/api/v1/quizzes/generate', req).then(r => r.data),
  generateFromHistory: (req: QuizGenerateFromHistoryRequest) =>
    api.post<Quiz>('/api/v1/quizzes/generate-from-history', req).then(r => r.data),

  list: (params?: { status?: QuizStatus; subject?: string; difficulty?: Difficulty; search?: string }) =>
    api.get<Quiz[]>('/api/v1/quizzes', { params }).then(r => r.data),
  get: (id: string) => api.get<Quiz>(`/api/v1/quizzes/${id}`).then(r => r.data),
  create: (body: QuizUpdateRequest) => api.post<Quiz>('/api/v1/quizzes', body).then(r => r.data),
  update: (id: string, body: QuizUpdateRequest) => api.put<Quiz>(`/api/v1/quizzes/${id}`, body).then(r => r.data),
  remove: (id: string) => api.delete(`/api/v1/quizzes/${id}`),
  publish: (id: string) => api.post<Quiz>(`/api/v1/quizzes/${id}/publish`).then(r => r.data),
  duplicate: (id: string) => api.post<Quiz>(`/api/v1/quizzes/${id}/duplicate`).then(r => r.data),
  regenerate: (id: string) => api.post<Quiz>(`/api/v1/quizzes/${id}/regenerate`).then(r => r.data),

  listSources: (search?: string) =>
    api.get<QuizSourceItem[]>('/api/v1/quizzes/sources', { params: { search } }).then(r => r.data),

  createAttempt: (quizId: string) => api.post<QuizAttempt>(`/api/v1/quizzes/${quizId}/attempts`).then(r => r.data),
  getAttempt: (quizId: string, attemptId: string) =>
    api.get<QuizAttempt>(`/api/v1/quizzes/${quizId}/attempts/${attemptId}`).then(r => r.data),
  saveAttempt: (quizId: string, attemptId: string, body: QuizAttemptUpdate) =>
    api.put<QuizAttempt>(`/api/v1/quizzes/${quizId}/attempts/${attemptId}`, body).then(r => r.data),
  submitAttempt: (quizId: string, attemptId: string) =>
    api.post<QuizResult>(`/api/v1/quizzes/${quizId}/attempts/${attemptId}/submit`).then(r => r.data),
  getAttemptResult: (quizId: string, attemptId: string) =>
    api.get<QuizResult>(`/api/v1/quizzes/${quizId}/attempts/${attemptId}/result`).then(r => r.data),
  listMyAttempts: () => api.get<QuizAttempt[]>('/api/v1/quizzes/attempts').then(r => r.data),

  exportPdf: (id: string) => api.get(`/api/v1/quizzes/${id}/export/pdf`, { responseType: 'blob' }).then(r => r.data as Blob),
  exportDocx: (id: string) => api.get(`/api/v1/quizzes/${id}/export/docx`, { responseType: 'blob' }).then(r => r.data as Blob),
  exportJson: (id: string) => api.get(`/api/v1/quizzes/${id}/export/json`, { responseType: 'blob' }).then(r => r.data as Blob),
  exportAppsScript: (id: string) =>
    api.get(`/api/v1/quizzes/${id}/export/appsscript`, { responseType: 'blob' }).then(r => r.data as Blob),
  exportGoogleFormsJson: (id: string) =>
    api.get(`/api/v1/quizzes/${id}/export/google-forms-json`, { responseType: 'blob' }).then(r => r.data as Blob),
};

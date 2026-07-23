import api from './axios';
import { chatApi } from './chat.api';
import type { ConversationItem } from './chat.api';

export interface UserProfile {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

export interface Recommendation {
  title: string;
  reason: string;
}

export interface LearningStatistics {
  totalMessages: number;
}

export interface BackendDashboardResponse {
  is_new_user: boolean;
  username: string;
  goal: { title: string; progress: number } | null;
  streak: { days: number; message?: string };
  learning_time: { hours: number; minutes: number };
  knowledge_nodes: number;
  continue_learning: { empty: boolean; title?: string; progress?: number; message?: string };
  recommendations: Recommendation[];
  recent_sessions: { title: string; date: string }[];
}

export class DashboardService {
  /**
   * Fetch the current user profile.
   */
  static async getUserProfile(): Promise<UserProfile> {
    const response = await api.get('/api/v1/users/me');
    return response.data;
  }

  /**
   * Fetch the conversation history.
   */
  static async getConversationHistory(): Promise<ConversationItem[]> {
    const response = await chatApi.getConversations();
    return response.conversations || [];
  }

  /**
   * Fetch all dashboard data from the backend.
   */
  static async getBackendDashboardData(): Promise<BackendDashboardResponse> {
    const response = await api.get('/api/v1/dashboard');
    return response.data;
  }

  /**
   * Manage pinned conversation locally.
   */
  static getPinnedConversationId(): string | null {
    return localStorage.getItem('pinned_conversation_id');
  }

  static pinConversation(id: string): void {
    localStorage.setItem('pinned_conversation_id', id);
    // Dispatch a storage event manually so other components in the same tab can react
    window.dispatchEvent(new Event('storage'));
  }

  static unpinConversation(): void {
    localStorage.removeItem('pinned_conversation_id');
    // Dispatch a storage event manually so other components in the same tab can react
    window.dispatchEvent(new Event('storage'));
  }

  static getPinnedConversation(conversations: ConversationItem[]): ConversationItem | null {
    const pinnedId = this.getPinnedConversationId();
    if (pinnedId) {
      const found = conversations.find(c => c.id === pinnedId);
      if (found) return found;
    }
    // Fallback to the latest conversation if none is pinned or pinned is deleted
    return conversations.length > 0 ? conversations[0] : null;
  }

  /**
   * Calculate dynamic learning statistics for the target conversation.
   */
  static async getLearningStatistics(targetId: string | null): Promise<LearningStatistics> {
    if (!targetId) {
      return { totalMessages: 0 };
    }
    
    try {
      const msgRes = await chatApi.getConversationMessages(targetId);
      return { totalMessages: (msgRes.messages || []).length };
    } catch (e) {
      console.warn("Failed to fetch messages for stats", e);
      return { totalMessages: 0 };
    }
  }

  /**
   * Fetch recommendations securely from the backend dashboard endpoint.
   */
  static async getRecommendations(): Promise<Recommendation[]> {
    try {
      const data = await this.getBackendDashboardData();
      return data.recommendations || [];
    } catch (e) {
      console.error("Failed to fetch recommendations", e);
      return [];
    }
  }
}

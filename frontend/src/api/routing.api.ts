import api from './axios';

export type RoutingConditionType = 'message_contains' | 'message_regex' | 'always';

export interface RoutingRule {
  id: string;
  priority: number;
  name: string;
  condition_type: RoutingConditionType;
  condition_value: string | null;
  provider: 'gemini' | 'ollama';
  model: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoutingRuleInput {
  name: string;
  condition_type: RoutingConditionType;
  condition_value: string | null;
  provider: 'gemini' | 'ollama';
  model: string | null;
  enabled: boolean;
}

export const routingApi = {
  list: async (): Promise<RoutingRule[]> => {
    const response = await api.get('/api/v1/router/rules');
    return response.data;
  },

  create: async (rule: RoutingRuleInput): Promise<RoutingRule> => {
    const response = await api.post('/api/v1/router/rules', rule);
    return response.data;
  },

  update: async (id: string, rule: Partial<RoutingRuleInput>): Promise<RoutingRule> => {
    const response = await api.put(`/api/v1/router/rules/${id}`, rule);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/router/rules/${id}`);
  },

  reorder: async (ruleIds: string[]): Promise<RoutingRule[]> => {
    const response = await api.put('/api/v1/router/rules/reorder', { rule_ids: ruleIds });
    return response.data;
  }
};

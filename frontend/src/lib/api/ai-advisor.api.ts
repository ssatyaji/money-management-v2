import apiClient from './client';
import { ApiResponse } from '@/types/api.types';

export interface AiInsight {
  id: string;
  title: string;
  body: string;
  actionLabel: string | null;
  actionUrl: string | null;
  isRead: boolean;
  generatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  context: string;
  contextId: string | null;
  createdAt: string;
  messages: ChatMessage[];
}

export const aiAdvisorApi = {
  getInsights: async (): Promise<AiInsight[]> => {
    const res = await apiClient.get<ApiResponse<AiInsight[]>>('/ai-advisor/insights');
    return res.data.data;
  },
  createSession: async (context = 'GENERAL', contextId?: string): Promise<ChatSession> => {
    const res = await apiClient.post<ApiResponse<ChatSession>>('/ai-advisor/sessions', {
      context,
      contextId,
    });
    return res.data.data;
  },
  getSession: async (id: string): Promise<ChatSession> => {
    const res = await apiClient.get<ApiResponse<ChatSession>>(`/ai-advisor/sessions/${id}`);
    return res.data.data;
  },
  sendMessage: async (sessionId: string, content: string): Promise<ChatMessage> => {
    const res = await apiClient.post<ApiResponse<ChatMessage>>(`/ai-advisor/sessions/${sessionId}/messages`, {
      content,
    });
    return res.data.data;
  },
  generateInsights: async (): Promise<void> => {
    await apiClient.post('/ai-advisor/insights/generate');
  },
};

import apiClient from './client';

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface SubscribePayload {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

export const subscribeToNotifications = async (payload: SubscribePayload) => {
  const response = await apiClient.post('/notifications/subscribe', payload);
  return response.data;
};

export const unsubscribeFromNotifications = async (endpoint: string) => {
  const response = await apiClient.delete('/notifications/unsubscribe', {
    data: { endpoint },
  });
  return response.data;
};

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/query-keys';
import { remindersApi } from '@/lib/api/reminders.api';
import type { CreateReminderInput, UpdateReminderInput, ReminderFilter } from '@/types/reminder.types';

export function useReminders(filter?: ReminderFilter) {
  return useQuery({
    queryKey: [...queryKeys.reminders.all, filter ?? 'all'],
    queryFn: () => remindersApi.getAll(filter),
  });
}

export function useUpcomingReminders() {
  return useQuery({
    queryKey: [...queryKeys.reminders.all, 'upcoming-7d'],
    queryFn: remindersApi.getUpcoming,
  });
}

export function useOverdueReminders() {
  return useQuery({
    queryKey: [...queryKeys.reminders.all, 'overdue'],
    queryFn: remindersApi.getOverdue,
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReminderInput) => remindersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reminders.all });
    },
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReminderInput }) =>
      remindersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reminders.all });
    },
  });
}

export function useMarkComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remindersApi.markComplete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reminders.all });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remindersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reminders.all });
    },
  });
}

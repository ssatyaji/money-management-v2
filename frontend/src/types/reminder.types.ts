export interface Reminder {
  id: string;
  title: string;
  description: string | null;
  amount: number | null;
  dueDate: string;
  isRecurring: boolean;
  frequency: string | null;
  isCompleted: boolean;
  notifyBefore: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderInput {
  title: string;
  description?: string;
  amount?: number;
  dueDate: string;
  isRecurring?: boolean;
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  notifyBefore?: number;
}

export type UpdateReminderInput = Partial<CreateReminderInput>;

export type ReminderFilter = 'upcoming' | 'overdue' | 'completed';

import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Format date to Indonesian locale string
 */
export function formatDate(date: string | Date, formatStr: string = 'dd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: id });
}

/**
 * Format date to relative time (e.g., "2 jam yang lalu")
 */
export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;

  if (isToday(d)) return 'Hari ini';
  if (isYesterday(d)) return 'Kemarin';

  return formatDistanceToNow(d, { addSuffix: true, locale: id });
}

/**
 * Format date for display in transaction lists
 */
export function formatTransactionDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;

  if (isToday(d)) return `Hari ini, ${format(d, 'HH:mm')}`;
  if (isYesterday(d)) return `Kemarin, ${format(d, 'HH:mm')}`;

  return format(d, 'dd MMM yyyy', { locale: id });
}

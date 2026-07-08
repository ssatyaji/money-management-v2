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
 * Format date for display in transaction lists (always includes time)
 */
export function formatTransactionDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;

  if (isToday(d)) return `Hari ini, ${format(d, 'HH:mm')}`;
  if (isYesterday(d)) return `Kemarin, ${format(d, 'HH:mm')}`;

  return format(d, 'dd MMM yyyy, HH:mm', { locale: id });
}

/**
 * Format date for transaction detail view (full day name + time)
 */
export function formatTransactionDateFull(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;

  if (isToday(d)) return `Hari ini, ${format(d, 'HH:mm')}`;
  if (isYesterday(d)) return `Kemarin, ${format(d, 'HH:mm')}`;

  return format(d, 'EEEE, dd MMMM yyyy • HH:mm', { locale: id });
}

/**
 * Format date for grouping header in transaction list
 */
export function formatGroupHeaderDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;

  const formattedDateStr = format(d, 'dd MMMM yyyy', { locale: id });
  if (isToday(d)) return `Hari Ini — ${formattedDateStr}`;
  if (isYesterday(d)) return `Kemarin — ${formattedDateStr}`;

  return format(d, 'EEEE — dd MMMM yyyy', { locale: id });
}

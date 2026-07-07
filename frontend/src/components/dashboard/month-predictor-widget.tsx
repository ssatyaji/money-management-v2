'use client';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { useMonthPredictor } from '@/hooks/use-month-predictor';
import { Skeleton } from '@/components/ui/skeleton';

const cfg = {
  SAFE: {
    label: 'Aman',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    Icon: TrendingUp,
  },
  CAUTION: {
    label: 'Hati-Hati',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    Icon: Minus,
  },
  DANGER: {
    label: 'Perhatian',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    Icon: TrendingDown,
  },
};

export function MonthPredictorWidget() {
  const { data, isLoading } = useMonthPredictor();
  if (isLoading) return <Skeleton className="h-28 w-full rounded-2xl" />;
  if (!data) return null;
  const c = cfg[data.status];
  const { Icon } = c;
  const month = new Date().toLocaleString('id-ID', { month: 'long' });
  return (
    <div className={`rounded-2xl border p-4 ${c.bg} ${c.border}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">Estimasi Saldo Akhir {month}</span>
        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${c.bg} ${c.color}`}>
          <Icon className="w-3 h-3" />{c.label}
        </span>
      </div>
      <p className={`text-2xl font-bold ${c.color}`}>{formatCurrency(data.estimatedEndBalance)}</p>
      <p className="text-xs text-muted-foreground mt-1">
        Masih {data.daysRemaining} hari · Aman dipakai: {formatCurrency(data.safeToSpend)}
      </p>
      <Link href="/reports/monthly" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors">
        Lihat detail <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

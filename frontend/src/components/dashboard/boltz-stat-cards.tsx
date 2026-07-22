'use client';

import { TrendingUp, ArrowDownRight, Wallet, PiggyBank, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';

export interface StatTrend {
  value: number;
  label: string;
  isPositive?: boolean;
}

interface BoltzStatCardsProps {
  totalBalance: number;
  income: number;
  expense: number;
  savings: number;
  showBalance: boolean;
  incomeTrend?: StatTrend;
  expenseTrend?: StatTrend;
  savingsTrend?: StatTrend;
}

export function BoltzStatCards({
  totalBalance,
  income,
  expense,
  savings,
  showBalance,
  incomeTrend,
  expenseTrend,
  savingsTrend,
}: BoltzStatCardsProps) {
  const cards = [
    {
      title: 'Total Saldo Utama',
      amount: totalBalance,
      trendText: 'Kas & Akun Terdaftar',
      isPositive: true,
      icon: Wallet,
      iconBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
    },
    {
      title: 'Pemasukan',
      amount: income,
      trendText: incomeTrend
        ? `${incomeTrend.value >= 0 ? '+' : ''}${incomeTrend.value.toFixed(1)}% ${incomeTrend.label}`
        : '0% vs bln lalu',
      isPositive: incomeTrend ? incomeTrend.value >= 0 : true,
      icon: TrendingUp,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Pengeluaran',
      amount: expense,
      trendText: expenseTrend
        ? `${expenseTrend.value >= 0 ? '+' : ''}${expenseTrend.value.toFixed(1)}% ${expenseTrend.label}`
        : '0% vs bln lalu',
      isPositive: expenseTrend ? expenseTrend.value <= 0 : false, // Untuk pengeluaran, minus artinya hemat (positif)
      icon: ArrowDownRight,
      iconBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Tabungan & Investasi',
      amount: savings,
      trendText: savingsTrend
        ? `${savingsTrend.value >= 0 ? '+' : ''}${savingsTrend.value.toFixed(1)}% ${savingsTrend.label}`
        : '0% pertumbuhan',
      isPositive: savingsTrend ? savingsTrend.value >= 0 : true,
      icon: PiggyBank,
      iconBg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between"
          >
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {card.title}
              </p>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {showBalance ? formatCurrency(card.amount) : 'Rp ••••••'}
              </h3>
              <p
                className={cn(
                  'text-[11px] font-semibold flex items-center gap-1',
                  card.isPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400',
                )}
              >
                <span>{card.isPositive ? '📈' : '📉'}</span>
                <span>{card.trendText}</span>
              </p>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}
            >
              <Icon className="w-6 h-6" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

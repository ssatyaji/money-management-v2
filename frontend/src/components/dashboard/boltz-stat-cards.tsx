'use client';

import { useState } from 'react';
import {
  TrendingUp,
  ArrowDownRight,
  Wallet,
  PiggyBank,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

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
  netWorth?: number;
  totalSavings?: number;
  totalInvestments?: number;
  totalReceivables?: number;
  totalPayables?: number;
  accountsCount?: number;
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
  netWorth = 0,
  totalSavings = 0,
  totalInvestments = 0,
  totalReceivables = 0,
  totalPayables = 0,
  accountsCount = 1,
}: BoltzStatCardsProps) {
  const [showNetWorthModal, setShowNetWorthModal] = useState(false);

  const cards = [
    {
      type: 'balance',
      title: 'Total Saldo Dompet',
      amount: totalBalance,
      trendText: `Uang Cair (${accountsCount} Dompet)`,
      isPositive: true,
      icon: Wallet,
      iconBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
    },
    {
      type: 'standard',
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
      type: 'standard',
      title: 'Pengeluaran',
      amount: expense,
      trendText: expenseTrend
        ? `${expenseTrend.value >= 0 ? '+' : ''}${expenseTrend.value.toFixed(1)}% ${expenseTrend.label}`
        : '0% vs bln lalu',
      isPositive: expenseTrend ? expenseTrend.value <= 0 : false,
      icon: ArrowDownRight,
      iconBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
    },
    {
      type: 'standard',
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
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, idx) => {
          const Icon = card.icon;

          if (card.type === 'balance') {
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {card.title}
                  </span>
                  <div
                    className={`w-10 h-10 rounded-2xl ${card.iconBg} flex items-center justify-center shrink-0 shadow-sm`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {showBalance ? formatCurrency(card.amount) : 'Rp ••••••'}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                    {card.trendText}
                  </p>
                </div>

                {/* Net Worth Badge Button inside Saldo Utama Card */}
                <button
                  type="button"
                  onClick={() => setShowNetWorthModal(true)}
                  className="w-full mt-1 p-2 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-500/20 hover:border-indigo-500/40 text-left transition-all cursor-pointer group flex items-center justify-between"
                  title="Klik untuk melihat kalkulasi Net Worth lengkap"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                        Net Worth (Kekayaan)
                      </p>
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {showBalance ? formatCurrency(netWorth) : 'Rp ••••••'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline shrink-0 pl-1">
                    Detail ➔
                  </span>
                </button>
              </div>
            );
          }

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

      {/* Net Worth Breakdown Modal Dialog */}
      <Dialog open={showNetWorthModal} onOpenChange={setShowNetWorthModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Kalkulasi Net Worth (Kekayaan Bersih)
            </DialogTitle>
            <DialogDescription>
              Kekayaan bersih dihitung dari seluruh aset (kas, tabungan, investasi, piutang) dikurangi total kewajiban (hutang).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {/* Component 1: Liquid Cash */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <span className="text-base">💳</span>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Uang di Dompet (Liquid Cash)</p>
                  <p className="text-[10px] text-slate-400">Total saldo kas & akun bank</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                +{showBalance ? formatCurrency(totalBalance) : 'Rp ••••••'}
              </span>
            </div>

            {/* Component 2: Tabungan Goals */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <span className="text-base">🎯</span>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Target Tabungan</p>
                  <p className="text-[10px] text-slate-400">Terkumpul di target impian</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                +{showBalance ? formatCurrency(totalSavings) : 'Rp ••••••'}
              </span>
            </div>

            {/* Component 3: Investasi */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <span className="text-base">📈</span>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Portofolio Investasi</p>
                  <p className="text-[10px] text-slate-400">Saham, Emas, Crypto, dll.</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                +{showBalance ? formatCurrency(totalInvestments) : 'Rp ••••••'}
              </span>
            </div>

            {/* Component 4: Piutang */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <span className="text-base">📥</span>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Piutang (Tagihan)</p>
                  <p className="text-[10px] text-slate-400">Uang yang dipinjam orang lain</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                +{showBalance ? formatCurrency(totalReceivables) : 'Rp ••••••'}
              </span>
            </div>

            {/* Component 5: Hutang (Kewajiban) */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/60">
              <div className="flex items-center gap-2.5">
                <span className="text-base">📤</span>
                <div>
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-400">Hutang (Kewajiban)</p>
                  <p className="text-[10px] text-slate-400">Pinjaman & tagihan yang harus dibayar</p>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                -{showBalance ? formatCurrency(totalPayables) : 'Rp ••••••'}
              </span>
            </div>

            {/* Formula Total Summary Box */}
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-500/20 text-center space-y-1">
              <p className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                Total Net Worth (Kekayaan Bersih)
              </p>
              <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {showBalance ? formatCurrency(netWorth) : 'Rp ••••••'}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                (Dompet + Tabungan + Investasi + Piutang - Hutang)
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

'use client';

import { useState } from 'react';
import {
  TrendingUp,
  ArrowDownRight,
  Wallet,
  Coins,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  Target,
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
  showBalance,
  incomeTrend,
  expenseTrend,
  netWorth = 0,
  totalSavings = 0,
  totalInvestments = 0,
  totalReceivables = 0,
  totalPayables = 0,
  accountsCount = 1,
}: BoltzStatCardsProps) {
  const [showNetWorthModal, setShowNetWorthModal] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Saldo Dompet */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Saldo Dompet
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {showBalance ? formatCurrency(totalBalance) : 'Rp ••••••'}
            </h3>
            <p className="text-[11px] font-medium text-slate-400 mt-1">
              Kas & Bank ({accountsCount} Dompet)
            </p>
          </div>
        </div>

        {/* Card 2: Net Worth (Kekayaan Bersih) */}
        <div
          onClick={() => setShowNetWorthModal(true)}
          className="p-4 rounded-2xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Kekayaan Bersih (Net Worth)
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {showBalance ? formatCurrency(netWorth) : 'Rp ••••••'}
            </h3>
            <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center gap-0.5 mt-1">
              <span>Lihat rincian kalkulasi</span>
              <ChevronRight className="w-3 h-3" />
            </p>
          </div>
        </div>

        {/* Card 3: Pemasukan */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pemasukan
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {showBalance ? formatCurrency(income) : 'Rp ••••••'}
            </h3>
            <p
              className={cn(
                'text-[11px] font-semibold flex items-center gap-1 mt-1',
                incomeTrend && incomeTrend.value >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400',
              )}
            >
              <span>{incomeTrend && incomeTrend.value >= 0 ? '📈' : '📉'}</span>
              <span>
                {incomeTrend
                  ? `${incomeTrend.value >= 0 ? '+' : ''}${incomeTrend.value.toFixed(1)}% ${incomeTrend.label}`
                  : '0% vs bln lalu'}
              </span>
            </p>
          </div>
        </div>

        {/* Card 4: Pengeluaran */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151c2c] border border-slate-200/70 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pengeluaran
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {showBalance ? formatCurrency(expense) : 'Rp ••••••'}
            </h3>
            <p
              className={cn(
                'text-[11px] font-semibold flex items-center gap-1 mt-1',
                expenseTrend && expenseTrend.value <= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400',
              )}
            >
              <span>{expenseTrend && expenseTrend.value <= 0 ? '📈' : '📉'}</span>
              <span>
                {expenseTrend
                  ? `${expenseTrend.value >= 0 ? '+' : ''}${expenseTrend.value.toFixed(1)}% ${expenseTrend.label}`
                  : '0% vs bln lalu'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Net Worth Breakdown Modal Dialog */}
      <Dialog open={showNetWorthModal} onOpenChange={setShowNetWorthModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
              <Coins className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Rincian Net Worth (Kekayaan Bersih)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Total aset bersih dihitung dari akumulasi seluruh kas, tabungan, investasi, dan piutang dikurangi kewajiban hutang.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 pt-2">
            {/* Component 1: Liquid Cash */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Saldo Dompet (Kas & Bank)</p>
                  <p className="text-[10px] text-slate-400">Saldo cair di seluruh akun</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                +{showBalance ? formatCurrency(totalBalance) : 'Rp ••••••'}
              </span>
            </div>

            {/* Component 2: Tabungan Goals */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Target Tabungan</p>
                  <p className="text-[10px] text-slate-400">Dana impian yang terkumpul</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                +{showBalance ? formatCurrency(totalSavings) : 'Rp ••••••'}
              </span>
            </div>

            {/* Component 3: Investasi */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Portofolio Investasi</p>
                  <p className="text-[10px] text-slate-400">Saham, Emas, Crypto & Reksa Dana</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                +{showBalance ? formatCurrency(totalInvestments) : 'Rp ••••••'}
              </span>
            </div>

            {/* Component 4: Piutang */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Piutang (Tagihan)</p>
                  <p className="text-[10px] text-slate-400">Uang yang dipinjamkan ke orang lain</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                +{showBalance ? formatCurrency(totalReceivables) : 'Rp ••••••'}
              </span>
            </div>

            {/* Component 5: Hutang (Kewajiban) */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-400">Hutang (Kewajiban)</p>
                  <p className="text-[10px] text-slate-400">Total pinjaman yang harus dibayar</p>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                -{showBalance ? formatCurrency(totalPayables) : 'Rp ••••••'}
              </span>
            </div>

            {/* Total Summary Box */}
            <div className="mt-4 p-4 rounded-xl bg-slate-900 dark:bg-slate-800 text-white shadow-md flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Total Kekayaan Bersih
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  (Dompet + Tabungan + Investasi + Piutang - Hutang)
                </p>
              </div>
              <h4 className="text-lg font-extrabold tracking-tight">
                {showBalance ? formatCurrency(netWorth) : 'Rp ••••••'}
              </h4>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

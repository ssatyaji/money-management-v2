'use client';

import { formatCurrency } from '@/lib/utils/currency';
import { Account } from '@/lib/api/accounts.api';

interface BoltzWalletCardsProps {
  accounts: Account[];
  showBalance: boolean;
}

const gradients = [
  'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/10',
  'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-blue-500/10',
  'bg-gradient-to-tr from-purple-600 to-indigo-700 text-white shadow-purple-500/10',
  'bg-gradient-to-tr from-orange-500 to-amber-600 text-white shadow-orange-500/10',
];

export function BoltzWalletCards({ accounts, showBalance }: BoltzWalletCardsProps) {
  const displayAccounts = accounts.slice(0, 4);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Kartu Dompet & Rekening
        </h3>
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
          {accounts.length} Akun Terhubung
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {displayAccounts.map((acc, idx) => {
          const grad = gradients[idx % gradients.length];
          return (
            <div
              key={acc.id}
              className={`p-5 rounded-2xl ${grad} shadow-lg relative overflow-hidden flex flex-col justify-between h-44 transition-transform hover:-translate-y-1`}
            >
              {/* Top Card Info */}
              <div className="flex items-center justify-between z-10">
                <span className="text-xs font-bold uppercase tracking-wider opacity-90">
                  {acc.name}
                </span>
                <span className="text-lg opacity-80 font-mono">💳</span>
              </div>

              {/* Balance */}
              <div className="z-10 my-2">
                <p className="text-[10px] uppercase tracking-widest opacity-75 font-semibold">
                  Saldo Akun
                </p>
                <h4 className="text-2xl font-extrabold tracking-tight">
                  {showBalance ? formatCurrency(Number(acc.balance)) : 'Rp ••••••'}
                </h4>
              </div>

              {/* Bottom Card Holder */}
              <div className="flex items-center justify-between text-[11px] opacity-90 z-10 pt-2 border-t border-white/15">
                <div>
                  <p className="text-[9px] uppercase opacity-75 font-medium">Rekening</p>
                  <p className="font-semibold">Aktif</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase opacity-75 font-medium">Status</p>
                  <p className="font-semibold">Terverifikasi</p>
                </div>
              </div>

              {/* Decorative wave circles */}
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl"></div>
              <div className="absolute -left-6 -top-6 w-24 h-24 rounded-full bg-black/10 blur-xl"></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

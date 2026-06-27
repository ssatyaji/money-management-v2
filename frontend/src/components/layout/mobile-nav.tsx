'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/dashboard', icon: 'home_app_logo' },
    { label: 'Transaksi', href: '/transactions', icon: 'receipt_long' },
    { label: 'Budget', href: '/budgets', icon: 'savings' },
    { label: 'Goals', href: '/goals', icon: 'target' },
    { label: 'Hutang', href: '/debts', icon: 'hand_coins' },
    { label: 'Investasi', href: '/investments', icon: 'trending_up' },
    { label: 'Laporan', href: '/reports/monthly', icon: 'insights' },
    { label: 'Reminder', href: '/reminders', icon: 'notifications' },
    { label: 'Scanner', href: '/scan/receipt', icon: 'document_scanner' },
    { label: 'Pengaturan', href: '/settings', icon: 'settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex overflow-x-auto hide-scrollbar items-center h-20 pb-safe px-2 bg-card border-t border-border shadow-[0px_-4px_12px_rgba(26,43,60,0.05)] rounded-t-none lg:hidden">
      <div className="flex w-max min-w-full justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center active:scale-90 transition-transform min-w-[64px] px-1 group",
                isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-primary"
              )}
            >
              <span
                className="material-symbols-outlined transition-colors duration-200"
                style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
              >
                {item.icon}
              </span>
              <span className="font-heading text-[10px] font-medium mt-1 truncate max-w-full">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

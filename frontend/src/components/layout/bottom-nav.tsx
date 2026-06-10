'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: 'home_app_logo', activeIcon: true },
    { name: 'History', href: '/transactions', icon: 'receipt_long' },
    { name: 'Import', href: '/transactions/scan', icon: 'upload_file' },
    { name: 'Reports', href: '/dashboard', icon: 'insights' }, // Currently links to dashboard as placeholder
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-20 pb-safe px-6 bg-white border-t border-slate-100 shadow-[0px_-4px_12px_rgba(26,43,60,0.05)] rounded-t-none dark:bg-slate-900 dark:border-slate-800">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center active:scale-90 transition-transform w-16",
              isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-primary"
            )}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
            >
              {item.icon}
            </span>
            <span className="font-heading text-[11px] font-medium mt-1">
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

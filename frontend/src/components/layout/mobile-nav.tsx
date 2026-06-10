'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/dashboard', icon: 'home_app_logo' },
    { label: 'History', href: '/transactions', icon: 'receipt_long' },
    { label: 'Import', href: '/scan/receipt', icon: 'upload_file' },
    { label: 'Reports', href: '/reports/monthly', icon: 'insights' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-20 pb-safe px-6 bg-card border-t border-border shadow-[0px_-4px_12px_rgba(26,43,60,0.05)] rounded-t-none lg:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center active:scale-90 transition-transform w-16 group",
              isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-primary"
            )}
          >
            <span
              className="material-symbols-outlined transition-colors duration-200"
              style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
            >
              {item.icon}
            </span>
            <span className="font-heading text-[11px] font-medium mt-1">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

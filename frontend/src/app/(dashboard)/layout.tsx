'use client';

import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppSidebar } from '@/components/layout/sidebar';
import { AppHeader } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { BoltzSidebar } from '@/components/layout/boltz-sidebar';
import { BoltzHeader } from '@/components/layout/boltz-header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!user?.isEmailVerified) {
      router.push(`/verify-email?email=${encodeURIComponent(user?.email ?? '')}`);
      return;
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.isEmailVerified) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Desktop Fixed Boltz Sidebar */}
      <BoltzSidebar />

      {/* Legacy Collapsible Sidebar for Tablet/Intermediate screens */}
      <div className="lg:hidden">
        <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      {/* Main Content Layout Container */}
      <div className="lg:pl-64 flex flex-col min-h-screen transition-all duration-300">
        {/* Desktop Sticky Boltz Header */}
        <BoltzHeader />

        {/* Mobile / Tablet Header */}
        <div className="lg:hidden">
          <AppHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav />
    </div>
  );
}

'use client';

import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppSidebar } from '@/components/layout/sidebar';
import { AppHeader } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();  // ← tambah 'user'
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return; // Tunggu hingga auth state selesai dimuat

    if (!isAuthenticated) {
      // Tidak login → ke halaman login
      router.push('/login');
      return;
    }

    if (!user?.isEmailVerified) {
      // Sudah login tapi belum verifikasi email → ke halaman verify-email
      router.push(`/verify-email?email=${encodeURIComponent(user?.email ?? '')}`);
      return;
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Tampilkan loading spinner selama auth state dimuat
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

  // Jangan render konten jika tidak terautentikasi atau belum verifikasi email
  if (!isAuthenticated || !user?.isEmailVerified) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <AppHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav />
    </div>
  );
}

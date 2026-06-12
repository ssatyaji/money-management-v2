'use client';

import { useAuth } from '@/providers/auth-provider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // If user is on verify-email page, only redirect if they are already verified.
      // For all other auth pages (login, register, forgot-password), redirect immediately if authenticated.
      if (pathname === '/verify-email') {
        if (user?.isEmailVerified) {
          router.push('/dashboard');
        }
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, user, pathname, router]);

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

  // Prevent flash of auth page content if authenticated (except for unverified user on verify-email page)
  if (isAuthenticated) {
    if (pathname === '/verify-email' && !user?.isEmailVerified) {
      // Allow unverified user to see verify-email page
    } else {
      return null;
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-40 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 -right-40 w-[500px] h-[500px] rounded-full bg-chart-2/10 blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-chart-4/5 blur-[100px] animate-pulse delay-500" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="w-full max-w-md mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}


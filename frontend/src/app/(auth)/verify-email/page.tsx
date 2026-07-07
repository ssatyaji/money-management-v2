'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth.api';
import { useAuth } from '@/providers/auth-provider';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const { verifyEmail, user } = useAuth();
  
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Handle countdown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error('Masukkan 6 digit kode OTP');
      return;
    }

    setIsLoading(true);
    try {
      if (user) {
        // If logged in, use the auth context verification which updates user state
        await verifyEmail(code);
      } else {
        // Fallback to general API verification if not currently logged in
        if (!email) {
          throw new Error('Email tidak ditemukan. Silakan masuk terlebih dahulu.');
        }
        await authApi.verifyOtp({ email, code, purpose: 'REGISTER' });
      }
      toast.success('Email berhasil diverifikasi! Selamat datang 🎉');
      router.push('/dashboard');
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || error.message || 'Verifikasi OTP gagal.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    
    const targetEmail = email || user?.email;
    if (!targetEmail) {
      toast.error('Email tidak valid. Silakan muat ulang halaman.');
      return;
    }

    setIsResending(true);
    setResendCooldown(60); // Set cooldown immediately to block spamming
    try {
      await authApi.resendOtp({ email: targetEmail, purpose: 'REGISTER' });
      toast.success('Kode OTP verifikasi baru telah dikirim ke email Anda 📧');
    } catch (error: any) {
      setResendCooldown(0); // Reset cooldown on failure
      const msg = error.response?.data?.error?.message || 'Gagal mengirim ulang OTP. Silakan coba lagi.';
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center space-y-6 bg-card/65 backdrop-blur-xl border border-border/60 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
      {/* Top border light highlight */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>

      <header className="w-full text-center space-y-2 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-emerald-600 dark:to-emerald-400 bg-clip-text text-transparent">
            Zayn Finance
          </span>
          <div className="h-[3px] w-6 bg-emerald-500 rounded-full"></div>
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Verifikasi Email</h1>
          <p className="text-xs text-muted-foreground">
            Masukkan 6-digit kode OTP yang telah dikirim ke: <br />
            <strong className="text-foreground">{email || user?.email || 'email Anda'}</strong>
          </p>
        </div>
      </header>

      <form className="w-full space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center block mb-1" htmlFor="otp">
            Kode OTP
          </label>
          <input
            id="otp"
            type="text"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              setCode(val);
            }}
            className="w-full h-12 bg-muted/40 hover:bg-muted/65 focus:bg-background border border-border/80 focus:border-emerald-500/80 rounded-xl text-center text-3xl font-bold tracking-[8px] outline-none focus:ring-2 focus:ring-emerald-500/20 text-foreground transition-all"
            autoFocus
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || code.length !== 6}
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Memverifikasi...
            </span>
          ) : (
            'Verifikasi & Masuk'
          )}
        </button>
      </form>

      <div className="text-center text-xs text-muted-foreground">
        Belum menerima kode?{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || isResending}
          className={`font-semibold hover:underline transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
            resendCooldown > 0 || isResending 
              ? 'text-muted-foreground cursor-not-allowed' 
              : 'text-emerald-500 hover:text-emerald-600'
          }`}
        >
          {isResending ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              Mengirim...
            </>
          ) : resendCooldown > 0 ? (
            `Kirim ulang (${resendCooldown}s)`
          ) : (
            'Kirim Ulang'
          )}
        </button>
      </div>

      <footer className="w-full text-center pt-1 border-t border-border/40">
        <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground underline">
          Kembali ke halaman masuk
        </Link>
      </footer>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <>
      <main className="min-h-screen flex flex-col items-center justify-center px-4 md:px-8 py-12 relative">
        <Suspense fallback={
          <div className="w-full max-w-md flex flex-col items-center justify-center p-12 bg-card/65 backdrop-blur-xl border border-border/60 rounded-2xl shadow-xl">
            <span className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="mt-4 text-muted-foreground text-sm">Memuat halaman...</p>
          </div>
        }>
          <VerifyEmailForm />
        </Suspense>
      </main>

      {/* Ambient Visual Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[45%] h-[45%] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full"></div>
      </div>
    </>
  );
}

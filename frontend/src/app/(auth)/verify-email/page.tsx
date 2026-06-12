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
      const msg = error.response?.data?.message || error.message || 'Verifikasi OTP gagal.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    const targetEmail = email || user?.email;
    if (!targetEmail) {
      toast.error('Email tidak valid. Silakan muat ulang halaman.');
      return;
    }

    try {
      await authApi.resendOtp({ email: targetEmail, purpose: 'REGISTER' });
      toast.success('Kode OTP verifikasi baru telah dikirim 📧');
      setResendCooldown(60); // 60 seconds cooldown
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengirim ulang OTP.');
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center space-y-8 bg-card/40 backdrop-blur-md border border-border p-8 rounded-2xl shadow-xl">
      <header className="w-full text-center space-y-4">
        <div className="flex flex-col items-center gap-1">
          <span className="text-h2 font-bold text-primary tracking-tight">Zayn Finance</span>
          <div className="h-1 w-8 bg-emerald-500 rounded-full"></div>
        </div>
        <div className="space-y-1">
          <h1 className="text-h1 text-primary">Verifikasi Email</h1>
          <p className="text-body-md text-muted-foreground mt-2">
            Masukkan 6-digit kode OTP yang telah dikirim ke: <br />
            <strong className="text-foreground">{email || user?.email || 'email Anda'}</strong>
          </p>
        </div>
      </header>

      <form className="w-full space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-label-caps text-muted-foreground uppercase tracking-widest text-xs text-center block mb-2" htmlFor="otp">
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
            className="w-full h-16 bg-muted/60 border border-border rounded-xl text-center text-3xl font-bold tracking-[8px] outline-none focus:border-emerald-500 focus:bg-background text-foreground transition-all"
            autoFocus
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || code.length !== 6}
          className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
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

      <div className="text-center text-body-md text-muted-foreground">
        Belum menerima kode?{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className={`font-semibold hover:underline transition-colors ${resendCooldown > 0 ? 'text-muted-foreground cursor-not-allowed' : 'text-emerald-500'}`}
        >
          {resendCooldown > 0 ? `Kirim ulang (${resendCooldown}s)` : 'Kirim Ulang'}
        </button>
      </div>

      <footer className="w-full text-center pt-2">
        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground underline">
          Kembali ke halaman masuk
        </Link>
      </footer>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <>
      <main className="min-h-screen flex flex-col items-center justify-center px-4 md:px-8 py-12">
        <Suspense fallback={
          <div className="w-full max-w-md flex flex-col items-center justify-center p-12 bg-card/40 border border-border rounded-2xl shadow-xl">
            <span className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="mt-4 text-muted-foreground">Memuat halaman...</p>
          </div>
        }>
          <VerifyEmailForm />
        </Suspense>
      </main>

      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 opacity-10 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-500/10 opacity-10 blur-[120px] rounded-full"></div>
      </div>
    </>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth.api';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email tidak valid'),
});

const resetPasswordSchema = z
  .object({
    code: z.string().min(6, 'Masukkan 6 digit kode OTP').max(6),
    password: z
      .string()
      .min(8, 'Password minimal 8 karakter')
      .regex(/[A-Z]/, 'Harus ada huruf besar')
      .regex(/[a-z]/, 'Harus ada huruf kecil')
      .regex(/[0-9]/, 'Harus ada angka')
      .regex(/[^A-Za-z0-9]/, 'Harus ada karakter spesial'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
  });

type ForgotFormValues = z.infer<typeof forgotPasswordSchema>;
type ResetFormValues = z.infer<typeof resetPasswordSchema>;

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${met ? 'text-emerald-500' : 'text-muted-foreground'}`}>
      <span className="material-symbols-outlined text-[14px]">
        {met ? 'check' : 'close'}
      </span>
      {label}
    </div>
  );
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const forgotForm = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { code: '', password: '', confirmPassword: '' },
  });

  const passwordVal = resetForm.watch('password', '');
  const passwordRules = [
    { met: passwordVal.length >= 8, label: 'Minimal 8 karakter' },
    { met: /[A-Z]/.test(passwordVal), label: 'Huruf besar (A-Z)' },
    { met: /[a-z]/.test(passwordVal), label: 'Huruf kecil (a-z)' },
    { met: /[0-9]/.test(passwordVal), label: 'Angka (0-9)' },
    { met: /[^A-Za-z0-9]/.test(passwordVal), label: 'Karakter spesial (!@#$)' },
  ];

  const onForgotSubmit = async (data: ForgotFormValues) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email: data.email });
      setEmail(data.email);
      setStep(2);
      toast.success('Kode OTP reset password telah dikirim ke email Anda 📧');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengirim kode verifikasi.');
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data: ResetFormValues) => {
    setIsLoading(true);
    try {
      await authApi.resetPassword({
        email,
        code: data.code,
        password: data.password,
      });
      toast.success('Kata sandi berhasil diperbarui! Silakan masuk kembali 🎉');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mereset kata sandi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <main className="min-h-screen flex flex-col items-center justify-center px-4 md:px-8 py-12">
        <div className="w-full max-w-md flex flex-col items-center space-y-8 bg-card/40 backdrop-blur-md border border-border p-8 rounded-2xl shadow-xl">
          
          {/* Brand & Heading Section */}
          <header className="w-full text-center space-y-4">
            <div className="flex flex-col items-center gap-1">
              <span className="text-h2 font-bold text-primary tracking-tight">Zayn Finance</span>
              <div className="h-1 w-8 bg-emerald-500 rounded-full"></div>
            </div>
            <div className="space-y-1">
              <h1 className="text-h1 text-primary">Lupa Sandi?</h1>
              <p className="text-body-md text-muted-foreground mt-2">
                {step === 1 
                  ? 'Masukkan email terdaftar untuk meminta kode pemulihan OTP'
                  : `Kode verifikasi dikirim ke ${email}. Setel kata sandi baru Anda.`}
              </p>
            </div>
          </header>

          {step === 1 ? (
            // STEP 1: REQUEST OTP
            <form className="w-full space-y-4" onSubmit={forgotForm.handleSubmit(onForgotSubmit)}>
              <div className="space-y-1">
                <label className="text-label-caps text-muted-foreground uppercase tracking-widest text-xs" htmlFor="forgot-email">
                  Alamat Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="nama@email.com"
                  {...forgotForm.register('email')}
                  className={`w-full h-12 px-4 bg-muted/60 border border-border rounded-lg text-body-md text-foreground transition-all outline-none focus:border-emerald-500 focus:bg-background ${forgotForm.formState.errors.email ? 'border-destructive' : ''}`}
                />
                {forgotForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{forgotForm.formState.errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    Kirim Kode OTP
                  </>
                )}
              </button>
            </form>
          ) : (
            // STEP 2: RESET PASSWORD WITH OTP
            <form className="w-full space-y-4" onSubmit={resetForm.handleSubmit(onResetSubmit)}>
              {/* Code Field */}
              <div className="space-y-1">
                <label className="text-label-caps text-muted-foreground uppercase tracking-widest text-xs" htmlFor="reset-code">
                  Kode OTP (6-Digit)
                </label>
                <input
                  id="reset-code"
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  {...resetForm.register('code')}
                  className={`w-full h-12 px-4 bg-muted/60 border border-border rounded-lg text-center text-xl font-bold tracking-[4px] outline-none focus:border-emerald-500 focus:bg-background ${resetForm.formState.errors.code ? 'border-destructive' : ''}`}
                />
                {resetForm.formState.errors.code && (
                  <p className="text-sm text-destructive">{resetForm.formState.errors.code.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label className="text-label-caps text-muted-foreground uppercase tracking-widest text-xs" htmlFor="reset-password">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    id="reset-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...resetForm.register('password')}
                    className={`w-full h-12 px-4 pr-12 bg-muted/60 border border-border rounded-lg text-body-md text-foreground transition-all outline-none focus:border-emerald-500 focus:bg-background ${resetForm.formState.errors.password ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {passwordVal.length > 0 && (
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    {passwordRules.map((rule) => (
                      <PasswordRule key={rule.label} met={rule.met} label={rule.label} />
                    ))}
                  </div>
                )}
                {resetForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{resetForm.formState.errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1">
                <label className="text-label-caps text-muted-foreground uppercase tracking-widest text-xs" htmlFor="reset-confirmPassword">
                  Konfirmasi Kata Sandi Baru
                </label>
                <input
                  id="reset-confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...resetForm.register('confirmPassword')}
                  className={`w-full h-12 px-4 bg-muted/60 border border-border rounded-lg text-body-md text-foreground transition-all outline-none focus:border-emerald-500 focus:bg-background ${resetForm.formState.errors.confirmPassword ? 'border-destructive' : ''}`}
                />
                {resetForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{resetForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 h-12 bg-transparent border border-border text-foreground hover:bg-muted/50 rounded-lg font-bold transition-all"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-2/3 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memperbarui...
                    </span>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footer */}
          <footer className="w-full text-center pt-2">
            <p className="text-body-md text-muted-foreground">
              Ingat sandi Anda?{' '}
              <Link href="/login" className="text-emerald-500 font-bold hover:underline transition-all">
                Masuk
              </Link>
            </p>
          </footer>
        </div>
      </main>

      {/* Ambient Visual Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 opacity-10 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-500/10 opacity-10 blur-[120px] rounded-full"></div>
      </div>
    </>
  );
}

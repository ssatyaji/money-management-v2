'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-provider';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { login, googleSignIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleGoogleSignIn = async (credential: string) => {
    setIsLoading(true);
    try {
      await googleSignIn(credential);
      toast.success('Login dengan Google berhasil! 🎉');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal masuk dengan Google. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // ponytail: load google signin script natively from cdn, simpler than bringing in a large third-party react auth package
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '17811954369-dummy.apps.googleusercontent.com';
        
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            handleGoogleSignIn(response.credential);
          },
        });

        const btnElement = document.getElementById('google-signin-btn');
        if (btnElement) {
          window.google.accounts.id.renderButton(btnElement, {
            theme: 'filled_blue',
            size: 'large',
            width: btnElement.clientWidth || 336,
            text: 'signin_with',
            shape: 'rectangular',
          });
        }
      }
    };
  }, []);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(data);
      toast.success('Login berhasil!');
      router.push('/dashboard');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <main className="min-h-screen flex flex-col items-center justify-center px-4 md:px-8 relative">
        <div className="w-full max-w-[400px] flex flex-col items-center space-y-6 bg-card/65 backdrop-blur-xl border border-border/60 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
          {/* Top border light highlight */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
          
          {/* Brand & Heading Section */}
          <header className="w-full text-center space-y-2 animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-emerald-600 dark:to-emerald-400 bg-clip-text text-transparent">
                Zayn Finance
              </span>
              <div className="h-[3px] w-6 bg-emerald-500 rounded-full"></div>
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-foreground">Sign In</h1>
              <p className="text-xs text-muted-foreground">Kelola keuangan Anda secara cerdas dan terarah.</p>
            </div>
          </header>

          {/* Login Form Section */}
          <section className="w-full space-y-5">
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              
              {/* Email Field */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider" htmlFor="email">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 w-4 h-4" />
                  <input
                    id="email"
                    type="email"
                    placeholder="nama@email.com"
                    autoComplete="email"
                    autoFocus
                    {...register('email')}
                    className={`w-full h-11 pl-10 pr-4 bg-muted/40 hover:bg-muted/65 focus:bg-background border border-border/80 focus:border-emerald-500/80 rounded-xl text-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-muted-foreground/70 ${errors.email ? 'border-destructive/80 focus:border-destructive focus:ring-destructive/20' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <div className="flex justify-between items-end mb-0.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider" htmlFor="password">
                    Kata Sandi
                  </label>
                  <Link className="text-xs text-emerald-500 hover:text-emerald-600 font-semibold transition-colors" href="/forgot-password">
                    Lupa Sandi?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 w-4 h-4" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...register('password')}
                    className={`w-full h-11 pl-10 pr-10 bg-muted/40 hover:bg-muted/65 focus:bg-background border border-border/80 focus:border-emerald-500/80 rounded-xl text-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-muted-foreground/70 ${errors.password ? 'border-destructive/80 focus:border-destructive focus:ring-destructive/20' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
              </div>

              {/* Submit Action */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none group/btn cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Masuk
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-border/60"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">ATAU</span>
              <div className="flex-grow border-t border-border/60"></div>
            </div>

            {/* Social Logins */}
            <div className="flex justify-center w-full min-h-[44px]">
              <div id="google-signin-btn" className="w-full flex justify-center" />
            </div>
          </section>

          {/* Footer Signup */}
          <footer className="w-full text-center pt-1 border-t border-border/40">
            <p className="text-xs text-muted-foreground">
              Belum punya akun?{' '}
              <Link href="/register" className="text-emerald-500 hover:text-emerald-600 font-bold transition-colors">
                Daftar
              </Link>
            </p>
          </footer>
        </div>
      </main>

      {/* Ambient Visual Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[45%] h-[45%] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full"></div>
      </div>
    </>
  );
}

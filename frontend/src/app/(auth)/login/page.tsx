'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-provider';

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
    // Load Google GIS script dynamically
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
            width: btnElement.clientWidth || 320,
            text: 'signin_with',
            shape: 'rectangular',
          });
        }
      }
    };

    return () => {
      // Clean up script if desired
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
      <main className="min-h-screen flex flex-col items-center justify-center px-4 md:px-8">
        <div className="w-full max-w-sm flex flex-col items-center space-y-8 bg-card/40 backdrop-blur-md border border-border p-8 rounded-2xl shadow-xl">
          
          {/* Brand & Heading Section */}
          <header className="w-full text-center space-y-4 animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col items-center gap-1">
              <span className="text-h2 font-bold text-primary tracking-tight">Zayn Finance</span>
              <div className="h-1 w-8 bg-emerald-500 rounded-full"></div>
            </div>
            <div className="space-y-1">
              <h1 className="text-h1 text-primary">Sign In</h1>
              <p className="text-body-md text-muted-foreground">Kelola keuangan Anda secara cerdas dan terarah.</p>
            </div>
          </header>

          {/* Login Form Section */}
          <section className="w-full space-y-6">
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              
              {/* Email Field */}
              <div className="space-y-1">
                <label className="text-label-caps text-muted-foreground uppercase tracking-widest text-xs" htmlFor="email">
                  Alamat Email
                </label>
                <div className="relative group">
                  <input
                    id="email"
                    type="email"
                    placeholder="nama@email.com"
                    autoComplete="email"
                    autoFocus
                    {...register('email')}
                    className={`w-full h-12 px-4 bg-muted/60 border border-border rounded-lg text-body-md text-foreground transition-all outline-none focus:border-emerald-500 focus:bg-background ${errors.email ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <div className="flex justify-between items-end mb-1">
                  <label className="text-label-caps text-muted-foreground uppercase tracking-widest text-xs" htmlFor="password">
                    Kata Sandi
                  </label>
                  <Link className="text-body-sm text-emerald-500 font-semibold hover:underline transition-all" href="/forgot-password">
                    Lupa Sandi?
                  </Link>
                </div>
                <div className="relative group">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...register('password')}
                    className={`w-full h-12 px-4 pr-12 bg-muted/60 border border-border rounded-lg text-body-md text-foreground transition-all outline-none focus:border-emerald-500 focus:bg-background ${errors.password ? 'border-destructive' : ''}`}
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
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>

              {/* Submit Action */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memproses...
                    </span>
                  ) : (
                    <>
                      Masuk
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-4 text-label-caps text-muted-foreground uppercase tracking-widest text-xs">ATAU</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            {/* Social Logins */}
            <div className="flex justify-center w-full min-h-[44px]">
              <div id="google-signin-btn" className="w-full flex justify-center" />
            </div>
          </section>

          {/* Footer Signup */}
          <footer className="w-full text-center pt-2">
            <p className="text-body-md text-muted-foreground">
              Belum punya akun?{' '}
              <Link href="/register" className="text-emerald-500 font-bold hover:underline transition-all">
                Daftar
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

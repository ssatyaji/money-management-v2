'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-provider';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Nama minimal 2 karakter'),
    email: z.string().email('Email tidak valid'),
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

type RegisterFormValues = z.infer<typeof registerSchema>;

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${met ? 'text-secondary' : 'text-muted-foreground'}`}>
      <span className="material-symbols-outlined text-[14px]">
        {met ? 'check' : 'close'}
      </span>
      {label}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const password = watch('password', '');
  const passwordRules = [
    { met: password.length >= 8, label: 'Minimal 8 karakter' },
    { met: /[A-Z]/.test(password), label: 'Huruf besar (A-Z)' },
    { met: /[a-z]/.test(password), label: 'Huruf kecil (a-z)' },
    { met: /[0-9]/.test(password), label: 'Angka (0-9)' },
    { met: /[^A-Za-z0-9]/.test(password), label: 'Karakter spesial (!@#$)' },
  ];

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      toast.success('Registrasi berhasil! Selamat datang 🎉');
      router.push('/dashboard');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <main className="min-h-screen flex flex-col items-center justify-center px-4 md:px-8 py-12">
        <div className="w-full max-w-sm flex flex-col items-center space-y-8">
          
          {/* Brand & Heading Section */}
          <header className="w-full text-center space-y-4 animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col items-center gap-1">
              <span className="text-h2 font-bold text-primary tracking-tight">Steward Finance</span>
              <div className="h-1 w-8 bg-secondary rounded-full"></div>
            </div>
            <div className="space-y-1">
              <h1 className="text-h1 text-primary">Sign Up</h1>
              <p className="text-body-md text-muted-foreground">Create an account to start managing your wealth.</p>
            </div>
          </header>

          {/* Register Form Section */}
          <section className="w-full space-y-6">
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              
              {/* Name Field */}
              <div className="space-y-1">
                <label className="text-label-caps text-muted-foreground uppercase tracking-widest" htmlFor="name">
                  Full Name
                </label>
                <div className="relative group">
                  <input
                    id="name"
                    type="text"
                    placeholder="Your Full Name"
                    autoComplete="name"
                    autoFocus
                    {...register('name')}
                    className={`w-full h-14 px-4 bg-muted border border-transparent rounded-lg text-body-md text-foreground transition-all duration-200 outline-none focus:border-primary focus:bg-card focus:ring-0 ${errors.name ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              {/* Email Field */}
              <div className="space-y-1">
                <label className="text-label-caps text-muted-foreground uppercase tracking-widest" htmlFor="email">
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    {...register('email')}
                    className={`w-full h-14 px-4 bg-muted border border-transparent rounded-lg text-body-md text-foreground transition-all duration-200 outline-none focus:border-primary focus:bg-card focus:ring-0 ${errors.email ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label className="text-label-caps text-muted-foreground uppercase tracking-widest" htmlFor="password">
                  Password
                </label>
                <div className="relative group">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...register('password')}
                    className={`w-full h-14 px-4 pr-12 bg-muted border border-transparent rounded-lg text-body-md text-foreground transition-all duration-200 outline-none focus:border-primary focus:bg-card focus:ring-0 ${errors.password ? 'border-destructive' : ''}`}
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
                {password.length > 0 && (
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    {passwordRules.map((rule) => (
                      <PasswordRule key={rule.label} met={rule.met} label={rule.label} />
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1">
                <label className="text-label-caps text-muted-foreground uppercase tracking-widest" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative group">
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                    className={`w-full h-14 px-4 pr-12 bg-muted border border-transparent rounded-lg text-body-md text-foreground transition-all duration-200 outline-none focus:border-primary focus:bg-card focus:ring-0 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
              </div>

              {/* Submit Action */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 bg-primary text-primary-foreground rounded-lg text-h3 font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Memproses...
                    </span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">person_add</span>
                      Sign Up
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-4 text-label-caps text-muted-foreground uppercase tracking-widest">OR</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-1 gap-4">
              <button type="button" className="w-full h-14 bg-card border border-border rounded-lg flex items-center justify-center gap-4 hover:bg-muted transition-colors duration-200 group">
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-body-md text-foreground font-semibold">Sign up with Google</span>
              </button>
            </div>
          </section>

          {/* Footer Signup */}
          <footer className="w-full text-center pt-4 pb-8">
            <p className="text-body-md text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-bold hover:underline transition-all">
                Sign In
              </Link>
            </p>
          </footer>
        </div>
      </main>

      {/* Ambient Visual Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary opacity-10 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-secondary opacity-10 blur-[120px] rounded-full"></div>
      </div>
    </>
  );
}

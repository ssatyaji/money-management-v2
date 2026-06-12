'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-provider';

const registerSchema = z
  .object({
    email: z.string().email('Email tidak valid'),
    password: z
      .string()
      .min(8, 'Password minimal 8 karakter')
      .regex(/[A-Z]/, 'Harus ada huruf besar')
      .regex(/[a-z]/, 'Harus ada huruf kecil')
      .regex(/[0-9]/, 'Harus ada angka')
      .regex(/[^A-Za-z0-9]/, 'Harus ada karakter spesial'),
    confirmPassword: z.string(),
    firstName: z.string().min(1, 'Nama depan wajib diisi'),
    lastName: z.string().min(1, 'Nama belakang wajib diisi'),
    phoneNumber: z.string().optional(),
    occupation: z.string().optional(),
    monthlyIncome: z.string().optional(),
    startingBalance: z.string().optional(),
    financialGoal: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${met ? 'text-emerald-500' : 'text-muted-foreground'}`}>
      <span className="material-symbols-outlined text-[14px]">
        {met ? 'check' : 'close'}
      </span>
      {ruleTranslate(label)}
    </div>
  );
}

function ruleTranslate(label: string) {
  return label;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, googleSignIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      occupation: '',
      monthlyIncome: '',
      startingBalance: '0',
      financialGoal: 'Menabung',
    },
  });

  const password = watch('password', '');
  const passwordRules = [
    { met: password.length >= 8, label: 'Minimal 8 karakter' },
    { met: /[A-Z]/.test(password), label: 'Huruf besar (A-Z)' },
    { met: /[a-z]/.test(password), label: 'Huruf kecil (a-z)' },
    { met: /[0-9]/.test(password), label: 'Angka (0-9)' },
    { met: /[^A-Za-z0-9]/.test(password), label: 'Karakter spesial (!@#$)' },
  ];

  const handleNextStep = async () => {
    const isStep1Valid = await trigger(['email', 'password', 'confirmPassword']);
    if (isStep1Valid) {
      setStep(2);
    }
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const incomeNum = data.monthlyIncome ? Number(data.monthlyIncome.replace(/[^0-9]/g, '')) : 0;
      const balanceNum = data.startingBalance ? Number(data.startingBalance.replace(/[^0-9]/g, '')) : 0;

      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        name: `${data.firstName} ${data.lastName}`.trim(),
        occupation: data.occupation || undefined,
        phoneNumber: data.phoneNumber || undefined,
        monthlyIncome: incomeNum || undefined,
        startingBalance: balanceNum || undefined,
        financialGoal: data.financialGoal || undefined,
      });

      toast.success('Registrasi berhasil! Kode verifikasi telah dikirim ke email Anda 📧');
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async (credential: string) => {
    setIsLoading(true);
    try {
      await googleSignIn(credential);
      toast.success('Daftar dengan Google berhasil! 🎉');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal masuk dengan Google.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (step !== 1) return;
    
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

        const btnElement = document.getElementById('google-signin-btn-register');
        if (btnElement) {
          window.google.accounts.id.renderButton(btnElement, {
            theme: 'filled_blue',
            size: 'large',
            width: btnElement.clientWidth || 320,
            text: 'signup_with',
            shape: 'rectangular',
          });
        }
      }
    };
  }, [step]);

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
              <h1 className="text-h1 text-primary">Daftar Akun</h1>
              <p className="text-body-md text-muted-foreground">
                Langkah {step} dari 2: {step === 1 ? 'Informasi Kredensial' : 'Informasi Profil & Finansial'}
              </p>
            </div>
          </header>

          {/* Form */}
          <form className="w-full space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {step === 1 ? (
              // STEP 1 FIELDS
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                {/* Email Field */}
                <div className="space-y-1">
                  <label className="text-label-caps text-muted-foreground uppercase tracking-widest text-xs" htmlFor="email">
                    Alamat Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="nama@email.com"
                    {...register('email')}
                    className={`w-full h-12 px-4 bg-muted/60 border border-border rounded-lg text-body-md text-foreground transition-all outline-none focus:border-emerald-500 focus:bg-background ${errors.email ? 'border-destructive' : ''}`}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <label className="text-label-caps text-muted-foreground uppercase tracking-widest text-xs" htmlFor="password">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
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
                  {password.length > 0 && (
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      {passwordRules.map((rule) => (
                        <PasswordRule key={rule.label} met={rule.met} label={rule.label} />
                      ))}
                    </div>
                  )}
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-1">
                  <label className="text-label-caps text-muted-foreground uppercase tracking-widest text-xs" htmlFor="confirmPassword">
                    Konfirmasi Kata Sandi
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                    className={`w-full h-12 px-4 bg-muted/60 border border-border rounded-lg text-body-md text-foreground transition-all outline-none focus:border-emerald-500 focus:bg-background ${errors.confirmPassword ? 'border-destructive' : ''}`}
                  />
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    Lanjut
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            ) : (
              // STEP 2 FIELDS
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="grid grid-cols-2 gap-4">
                  {/* First Name */}
                  <div className="space-y-1">
                    <label className="text-label-caps text-muted-foreground uppercase tracking-widest text-xs" htmlFor="firstName">
                      Nama Depan
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      {...register('firstName')}
                      className={`w-full h-12 px-4 bg-muted/60 border border-border rounded-lg text-body-md text-foreground transition-all outline-none focus:border-emerald-500 focus:bg-background ${errors.firstName ? 'border-destructive' : ''}`}
                    />
                    {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-1">
                    <label className="text-label-caps text-muted-foreground uppercase tracking-widest text-xs" htmlFor="lastName">
                      Nama Belakang
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      {...register('lastName')}
                      className={`w-full h-12 px-4 bg-muted/60 border border-border rounded-lg text-body-md text-foreground transition-all outline-none focus:border-emerald-500 focus:bg-background ${errors.lastName ? 'border-destructive' : ''}`}
                    />
                    {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="text-label-caps text-muted-foreground uppercase tracking-widest text-xs" htmlFor="phoneNumber">
                    Nomor Telepon (Opsional)
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    placeholder="08123456789"
                    {...register('phoneNumber')}
                    className="w-full h-12 px-4 bg-muted/60 border border-border rounded-lg text-body-md text-foreground transition-all outline-none focus:border-emerald-500 focus:bg-background"
                  />
                </div>

                {/* Occupation */}
                <div className="space-y-1">
                  <label className="text-label-caps text-muted-foreground uppercase tracking-widest text-xs" htmlFor="occupation">
                    Pekerjaan (Opsional)
                  </label>
                  <input
                    id="occupation"
                    type="text"
                    placeholder="Karyawan, Pengusaha, Freelancer"
                    {...register('occupation')}
                    className="w-full h-12 px-4 bg-muted/60 border border-border rounded-lg text-body-md text-foreground transition-all outline-none focus:border-emerald-500 focus:bg-background"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Monthly Income */}
                  <div className="space-y-1">
                    <label className="text-label-caps text-muted-foreground uppercase tracking-widest text-xs" htmlFor="monthlyIncome">
                      Pendapatan Bulanan (Rp)
                    </label>
                    <input
                      id="monthlyIncome"
                      type="text"
                      placeholder="5.000.000"
                      {...register('monthlyIncome')}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        e.target.value = val ? Number(val).toLocaleString('id-ID') : '';
                      }}
                      className="w-full h-12 px-4 bg-muted/60 border border-border rounded-lg text-body-md text-foreground transition-all outline-none focus:border-emerald-500 focus:bg-background"
                    />
                  </div>

                  {/* Starting Balance */}
                  <div className="space-y-1">
                    <label className="text-label-caps text-muted-foreground uppercase tracking-widest text-xs" htmlFor="startingBalance">
                      Saldo Awal Utama (Rp)
                    </label>
                    <input
                      id="startingBalance"
                      type="text"
                      placeholder="1.000.000"
                      {...register('startingBalance')}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        e.target.value = val ? Number(val).toLocaleString('id-ID') : '';
                      }}
                      className="w-full h-12 px-4 bg-muted/60 border border-border rounded-lg text-body-md text-foreground transition-all outline-none focus:border-emerald-500 focus:bg-background"
                    />
                  </div>
                </div>

                {/* Financial Goal */}
                <div className="space-y-1">
                  <label className="text-label-caps text-muted-foreground uppercase tracking-widest text-xs" htmlFor="financialGoal">
                    Tujuan Finansial Utama
                  </label>
                  <select
                    id="financialGoal"
                    {...register('financialGoal')}
                    className="w-full h-12 px-4 bg-muted/60 border border-border rounded-lg text-body-md text-foreground transition-all outline-none focus:border-emerald-500 focus:bg-background cursor-pointer"
                  >
                    <option value="Menabung">Menabung (Savings)</option>
                    <option value="Investasi">Investasi (Investment)</option>
                    <option value="Mengurangi Hutang">Melunasi / Mengurangi Hutang</option>
                    <option value="Dana Darurat">Mengumpulkan Dana Darurat</option>
                    <option value="Membeli Barang">Membeli Aset / Barang Impian</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
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
                    className="w-2/3 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Mendaftar...
                      </span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                        Daftar
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          {step === 1 && (
            <>
              {/* Divider */}
              <div className="relative flex items-center py-2 w-full">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink mx-4 text-label-caps text-muted-foreground uppercase tracking-widest text-xs">ATAU</span>
                <div className="flex-grow border-t border-border"></div>
              </div>

              {/* Social Logins */}
              <div className="flex justify-center w-full min-h-[44px]">
                <div id="google-signin-btn-register" className="w-full flex justify-center" />
              </div>
            </>
          )}

          {/* Footer Signup */}
          <footer className="w-full text-center pt-2">
            <p className="text-body-md text-muted-foreground">
              Sudah punya akun?{' '}
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

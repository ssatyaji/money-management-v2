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

      toast.success('Akun berhasil dibuat! 🎉 Silakan cek inbox email Anda untuk kode verifikasi. Jika tidak ada, periksa folder spam atau kirim ulang di halaman verifikasi.');
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string | string[]; statusCode?: number } }; message?: string };
      const statusCode = err.response?.data?.statusCode;
      const backendMsg = err.response?.data?.message;
      
      if (backendMsg) {
        const errorMessage = Array.isArray(backendMsg) ? backendMsg.join(', ') : backendMsg;
        toast.error(errorMessage);
      } else if (statusCode === 409) {
        toast.error('Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.');
      } else if (statusCode === 400) {
        toast.error('Data yang dimasukkan tidak valid. Periksa kembali isian form Anda.');
      } else {
        toast.error('Registrasi gagal. Periksa koneksi internet Anda dan coba lagi.');
      }
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
      <main className="min-h-screen flex flex-col items-center justify-center px-4 md:px-8 py-12 relative">
        <div className="w-full max-w-md flex flex-col items-center space-y-6 bg-card/65 backdrop-blur-xl border border-border/60 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
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
              <h1 className="text-xl font-bold tracking-tight text-foreground">Daftar Akun</h1>
              <p className="text-xs text-muted-foreground">
                Langkah {step} dari 2: {step === 1 ? 'Informasi Kredensial' : 'Informasi Profil & Finansial'}
              </p>
            </div>
          </header>

          {/* Form */}
          <form className="w-full space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {step === 1 ? (
              // STEP 1 FIELDS
              <div key="step-1" className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                {/* Email Field */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider" htmlFor="email">
                    Alamat Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="nama@email.com"
                    {...register('email')}
                    className={`w-full h-11 px-4 bg-muted/40 hover:bg-muted/65 focus:bg-background border border-border/80 focus:border-emerald-500/80 rounded-xl text-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-muted-foreground/70 ${errors.email ? 'border-destructive/80 focus:border-destructive focus:ring-destructive/20' : ''}`}
                  />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider" htmlFor="password">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...register('password')}
                      className={`w-full h-11 px-4 pr-12 bg-muted/40 hover:bg-muted/65 focus:bg-background border border-border/80 focus:border-emerald-500/80 rounded-xl text-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-muted-foreground/70 ${errors.password ? 'border-destructive/80 focus:border-destructive focus:ring-destructive/20' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
                  {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider" htmlFor="confirmPassword">
                    Konfirmasi Kata Sandi
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                    className={`w-full h-11 px-4 bg-muted/40 hover:bg-muted/65 focus:bg-background border border-border/80 focus:border-emerald-500/80 rounded-xl text-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-muted-foreground/70 ${errors.confirmPassword ? 'border-destructive/80 focus:border-destructive focus:ring-destructive/20' : ''}`}
                  />
                  {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Lanjut
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            ) : (
              // STEP 2 FIELDS
              <div key="step-2" className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="grid grid-cols-2 gap-4">
                  {/* First Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider" htmlFor="firstName">
                      Nama Depan
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      {...register('firstName')}
                      className={`w-full h-11 px-4 bg-muted/40 hover:bg-muted/65 focus:bg-background border border-border/80 focus:border-emerald-500/80 rounded-xl text-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-muted-foreground/70 ${errors.firstName ? 'border-destructive/80 focus:border-destructive focus:ring-destructive/20' : ''}`}
                    />
                    {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName.message}</p>}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider" htmlFor="lastName">
                      Nama Belakang
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      {...register('lastName')}
                      className={`w-full h-11 px-4 bg-muted/40 hover:bg-muted/65 focus:bg-background border border-border/80 focus:border-emerald-500/80 rounded-xl text-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-muted-foreground/70 ${errors.lastName ? 'border-destructive/80 focus:border-destructive focus:ring-destructive/20' : ''}`}
                    />
                    {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName.message}</p>}
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider" htmlFor="phoneNumber">
                    Nomor Telepon (Opsional)
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    placeholder="08123456789"
                    {...register('phoneNumber')}
                    className="w-full h-11 px-4 bg-muted/40 hover:bg-muted/65 focus:bg-background border border-border/80 focus:border-emerald-500/80 rounded-xl text-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-muted-foreground/70"
                  />
                </div>

                {/* Occupation */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider" htmlFor="occupation">
                    Pekerjaan (Opsional)
                  </label>
                  <input
                    id="occupation"
                    type="text"
                    placeholder="Karyawan, Pengusaha, Freelancer"
                    {...register('occupation')}
                    className="w-full h-11 px-4 bg-muted/40 hover:bg-muted/65 focus:bg-background border border-border/80 focus:border-emerald-500/80 rounded-xl text-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-muted-foreground/70"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Monthly Income */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider" htmlFor="monthlyIncome">
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
                      className="w-full h-11 px-4 bg-muted/40 hover:bg-muted/65 focus:bg-background border border-border/80 focus:border-emerald-500/80 rounded-xl text-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-muted-foreground/70"
                    />
                  </div>

                  {/* Starting Balance */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider" htmlFor="startingBalance">
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
                      className="w-full h-11 px-4 bg-muted/40 hover:bg-muted/65 focus:bg-background border border-border/80 focus:border-emerald-500/80 rounded-xl text-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-muted-foreground/70"
                    />
                  </div>
                </div>

                {/* Financial Goal */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider" htmlFor="financialGoal">
                    Tujuan Finansial Utama
                  </label>
                  <select
                    id="financialGoal"
                    {...register('financialGoal')}
                    className="w-full h-11 px-4 bg-muted/40 hover:bg-muted/65 focus:bg-background border border-border/80 focus:border-emerald-500/80 rounded-xl text-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-muted-foreground/70 cursor-pointer"
                  >
                    <option value="Menabung">Menabung (Savings)</option>
                    <option value="Investasi">Investasi (Investment)</option>
                    <option value="Mengurangi Hutang">Melunasi / Mengurangi Hutang</option>
                    <option value="Dana Darurat">Mengumpulkan Dana Darurat</option>
                    <option value="Membeli Barang">Membeli Aset / Barang Impian</option>
                  </select>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 h-11 bg-transparent border border-border text-foreground hover:bg-muted/50 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-2/3 h-11 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
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
              <div className="relative flex items-center py-1 w-full">
                <div className="flex-grow border-t border-border/60"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">ATAU</span>
                <div className="flex-grow border-t border-border/60"></div>
              </div>

              {/* Social Logins */}
              <div className="flex justify-center w-full min-h-[44px]">
                <div id="google-signin-btn-register" className="w-full flex justify-center" />
              </div>
            </>
          )}

          {/* Footer Signup */}
          <footer className="w-full text-center pt-1 border-t border-border/40">
            <p className="text-xs text-muted-foreground">
              Sudah punya akun?{' '}
              <Link href="/login" className="text-emerald-500 hover:text-emerald-600 font-bold transition-colors">
                Masuk
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

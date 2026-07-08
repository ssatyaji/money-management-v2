'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';

export default function RemindersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/transactions/recurring');
    }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 animate-bounce">
        <Clock className="w-8 h-8" />
      </div>
      <h1 className="text-xl font-bold text-foreground">Fitur Telah Diperbarui</h1>
      <p className="text-muted-foreground mt-2 max-w-sm">
        Fitur Reminder kini telah digabungkan ke halaman <strong>Tagihan Berulang</strong> untuk kemudahan manajemen transaksi otomatis Anda.
      </p>
      <p className="text-xs text-muted-foreground/60 mt-4">
        Mengalihkan Anda secara otomatis...
      </p>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

export function InstallPrompt() {
  const [isReadyForInstall, setIsReadyForInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if app is already installed or if user dismissed recently
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }
    
    if (localStorage.getItem('pwa_prompt_dismissed')) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsReadyForInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const downloadApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsReadyForInstall(false);
    }
    setDeferredPrompt(null);
  };

  const dismissPrompt = () => {
    setIsReadyForInstall(false);
    setIsDismissed(true);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!isReadyForInstall || isDismissed) return null;

  return (
    <div className="fixed bottom-24 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in slide-in-from-bottom-5">
      <div className="relative bg-card border border-border shadow-[0px_8px_24px_rgba(26,43,60,0.12)] rounded-2xl p-4">
        {/* Close button (X) — selalu terlihat di pojok kanan atas */}
        <button
          onClick={dismissPrompt}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex gap-3 pr-6">
          {/* Ikon menggunakan Lucide (tidak tergantung Material Symbols font) */}
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Install Aplikasi</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Akses lebih cepat & dapat digunakan secara offline.
            </p>
          </div>
        </div>

        {/* Tombol aksi — satu baris di desktop, stack di mobile kecil */}
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={downloadApp} className="flex-1 h-8 text-xs rounded-full">
            Install Sekarang
          </Button>
          <Button size="sm" variant="outline" onClick={dismissPrompt} className="flex-1 h-8 text-xs rounded-full border-border">
            Nanti Saja
          </Button>
        </div>
      </div>
    </div>
  );
}

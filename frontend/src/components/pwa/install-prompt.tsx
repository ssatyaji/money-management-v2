'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

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
      <div className="bg-card border border-border shadow-[0px_8px_24px_rgba(26,43,60,0.12)] rounded-2xl p-4 flex gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary text-2xl">install_mobile</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Install Aplikasi</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Akses lebih cepat & dapat digunakan secara offline.
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={downloadApp} className="w-full h-8 text-xs rounded-full">
              Install Sekarang
            </Button>
            <Button size="sm" variant="outline" onClick={dismissPrompt} className="w-full h-8 text-xs rounded-full border-border">
              Nanti Saja
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

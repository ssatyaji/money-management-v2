import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { Toaster } from 'sonner';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { GoogleAnalytics } from '@next/third-parties/google';

export const metadata: Metadata = {
  title: {
    default: 'Zayn Finance',
    template: '%s | Zayn Finance',
  },
  description: 'Aplikasi manajemen keuangan pribadi untuk keluarga',
  keywords: ['money management', 'keuangan', 'budgeting', 'finance', 'zayn finance'],
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Fonts loaded at runtime — no build-time network dependency */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster
                position="top-right"
                richColors
                closeButton
                duration={4000}
              />
              <InstallPrompt />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}

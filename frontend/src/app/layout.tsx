import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: {
    default: 'Money Management',
    template: '%s | Money Management',
  },
  description: 'Aplikasi manajemen keuangan pribadi untuk keluarga',
  keywords: ['money management', 'keuangan', 'budgeting', 'finance'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen">
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
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

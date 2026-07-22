import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { Toaster } from 'sonner';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { GoogleAnalytics } from '@next/third-parties/google';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zaynfinance.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Zayn Finance — Aplikasi Manajemen Keuangan Pribadi & Keluarga',
    template: '%s | Zayn Finance',
  },
  description:
    'Kelola keuangan pribadi dan keluarga secara cerdas dengan Zayn Finance. Lacak transaksi, impor e-statement bank (BCA, Jago, SeaBank, Permata), analisa anggaran, dan dapatkan insight AI.',
  keywords: [
    'money management',
    'manajemen keuangan',
    'aplikasi keuangan',
    'pencatat keuangan',
    'budgeting',
    'e-statement parser',
    'zayn finance',
    'laporan keuangan pribadi',
    'kelola anggaran',
  ],
  authors: [{ name: 'Zayn Finance Team' }],
  creator: 'Zayn Finance',
  publisher: 'Zayn Finance',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Zayn Finance — Aplikasi Manajemen Keuangan Pribadi & Keluarga',
    description:
      'Kelola keuangan pribadi dan keluarga secara cerdas. Lacak transaksi, impor e-statement bank, analisa anggaran, dan dapatkan rekomendasi AI.',
    url: baseUrl,
    siteName: 'Zayn Finance',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: `${baseUrl}/icons/icon-512x512.png`,
        width: 512,
        height: 512,
        alt: 'Zayn Finance App Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zayn Finance — Aplikasi Manajemen Keuangan Pribadi',
    description:
      'Kelola keuangan pribadi dan keluarga secara cerdas. Impor e-statement bank & dapatkan rekomendasi AI.',
    images: [`${baseUrl}/icons/icon-512x512.png`],
  },
  manifest: '/manifest.json',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FinancialApplication',
  name: 'Zayn Finance',
  operatingSystem: 'All',
  applicationCategory: 'FinanceApplication',
  description:
    'Aplikasi manajemen keuangan pribadi untuk melacak transaksi, impor e-statement bank, dan rekomendasi AI.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'IDR',
  },
  author: {
    '@type': 'Organization',
    name: 'Zayn Finance',
  },
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
        {/* Schema.org Structured Data for Google Rich Snippets */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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

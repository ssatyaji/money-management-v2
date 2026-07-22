import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zaynfinance.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/register', '/forgot-password'],
        disallow: [
          '/dashboard',
          '/dashboard/*',
          '/transactions/*',
          '/budgets/*',
          '/goals/*',
          '/debts/*',
          '/investments/*',
          '/reports/*',
          '/reminders/*',
          '/scan/*',
          '/settings/*',
          '/admin/*',
          '/api/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from './components/ThemeProvider';
import Script from 'next/script';

// ==========================================================================
// Font Configuration
// ==========================================================================

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

const playfair = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '700', '900'],
  style: ['normal', 'italic'],
});

// ==========================================================================
// Viewport Configuration
// ==========================================================================

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ec4899' },
    { media: '(prefers-color-scheme: dark)', color: '#a855f7' },
  ],
  colorScheme: 'light dark',
};

// ==========================================================================
// Metadata Configuration
// ==========================================================================

export const metadata: Metadata = {
  title: {
    default: 'Kalendarz Adwentowy 🎄 - Prezent dla Ciebie',
    template: '%s | Kalendarz Adwentowy',
  },
  description: 'Specjalny kalendarz adwentowy z 24 niespodziankami pełnymi miłości. Każdy dzień grudnia przynosi nowy kupon na wyjątkowe chwile razem. ❤️',
  keywords: [
    'kalendarz adwentowy',
    'prezent dla dziewczyny',
    'romantyczne kupony',
    'prezent na święta',
    'voucher book',
    'love coupons',
    'advent calendar',
    'romantic gift',
  ],
  authors: [
    {
      name: 'Twoje Imię',
      url: 'https://twojastrona.pl',
    },
  ],
  creator: 'Twoje Imię',
  publisher: 'Twoje Imię',

  alternates: {
    canonical: 'https://twojastrona.pl',
    languages: {
      'pl-PL': 'https://twojastrona.pl',
    },
  },

  applicationName: 'Kalendarz Adwentowy',

  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    noimageindex: true,
  },

  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#ec4899',
      },
    ],
  },

  manifest: '/manifest.json',

  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Advent Calendar',
    startupImage: [
      {
        url: '/apple-splash-2048-2732.png',
        media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/apple-splash-1668-2388.png',
        media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/apple-splash-1536-2048.png',
        media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },

  openGraph: {
    type: 'website',
    locale: 'pl_PL',
    url: 'https://twojastrona.pl',
    siteName: 'Kalendarz Adwentowy',
    title: 'Kalendarz Adwentowy 🎄 - Prezent dla Ciebie',
    description: 'Specjalny kalendarz adwentowy z 24 niespodziankami pełnymi miłości ❤️',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kalendarz Adwentowy - 24 dni niespodzianek',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Kalendarz Adwentowy 🎄',
    description: '24 dni pełne niespodzianek i miłości',
    images: ['/twitter-image.png'],
    creator: '@twojTwitter',
  },

  category: 'lifestyle',
  classification: 'Personal Gift',

  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
};

// ==========================================================================
// JSON-LD Structured Data
// ==========================================================================

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Kalendarz Adwentowy',
  description: 'Interaktywny kalendarz adwentowy z 24 kuponami i niespodziankami',
  url: 'https://twojastrona.pl',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'PLN',
  },
  author: {
    '@type': 'Person',
    name: 'Twoje Imię',
  },
  datePublished: '2025-12-01',
  inLanguage: 'pl-PL',
};

// ==========================================================================
// Root Layout Component
// ==========================================================================

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pl" suppressHydrationWarning className="scroll-smooth">
      <head>
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS Prefetch for performance */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Microsoft Tile */}
        <meta name="msapplication-TileColor" content="#ec4899" />
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Additional PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Advent Calendar" />

        {/* Security Headers */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />

        {/* Disable translation prompt */}
        <meta name="google" content="notranslate" />
      </head>

      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
          storageKey="advent-calendar-theme"
        >
          {/* Skip to main content (Accessibility) */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-primary focus:text-white focus:rounded-lg focus:shadow-lg"
          >
            Przejdź do głównej treści
          </a>

          {/* Main Content */}
          <main id="main-content" className="min-h-screen relative" role="main">
            {children}
          </main>

          {/* Accessibility Announcement Region */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
            id="announcements"
          />
        </ThemeProvider>

        {/* Analytics (Optional - Google Analytics example) */}
        {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                  page_path: window.location.pathname,
                  anonymize_ip: true,
                });
              `}
            </Script>
          </>
        )}

        {/* Service Worker Registration */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('ServiceWorker registration successful');
                  },
                  function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  }
                );
              });
            }
          `}
        </Script>

        {/* Performance Monitoring */}
        <Script id="web-vitals" strategy="afterInteractive">
          {`
            if ('PerformanceObserver' in window) {
              const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
              });
              lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

              const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                  console.log('FID:', entry.processingStart - entry.startTime);
                });
              });
              fidObserver.observe({ entryTypes: ['first-input'] });

              let clsValue = 0;
              const clsObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                  if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                    console.log('CLS:', clsValue);
                  }
                }
              });
              clsObserver.observe({ entryTypes: ['layout-shift'] });
            }
          `}
        </Script>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/provider/theme-provider';
import { ConvexAuthNextjsServerProvider } from '@convex-dev/auth/nextjs/server';
import ConvexClientProvider from '@/provider/ConvexClientProvider';
import { Toaster } from '@/components/ui/sonner';

// @ts-ignore
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Orca',
    template: 'Orca | %s',
  },
  description: 'The fun way to learn a new language',
  metadataBase: new URL('https://orca.ahmedbna.com'),
  openGraph: {
    title: 'Orca',
    description: 'Orca',
    url: 'https://orca.ahmedbna.com',
    siteName: 'Orca',
    images: [
      {
        url: '/android-chrome-512x512.png',
        width: 800,
        height: 800,
        alt: 'Orca',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Orca',
    description: 'Orca',
    images: ['/android-chrome-512x512.png'],
  },
  icons: {
    icon: '/apple-touch-icon.png',
    shortcut: '/apple-touch-icon.png',
    apple: '/apple-touch-icon.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/apple-touch-icon.png',
    },
  },
  appLinks: {
    web: {
      url: 'https://orca.ahmedbna.com/',
      should_fallback: true,
    },
  },
  verification: {
    google: 'google-site-verification=id',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang='en' suppressHydrationWarning>
        <head />

        <body className={`${inter.variable} antialiased`}>
          <ThemeProvider
            enableSystem
            attribute='class'
            defaultTheme='dark'
            storageKey='bna-ai-cad-theme'
            disableTransitionOnChange
          >
            <ConvexClientProvider>{children}</ConvexClientProvider>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}

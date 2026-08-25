import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PlayerBar } from '@/components/PlayerBar';
import { QueueDrawer } from '@/components/QueueDrawer';
import { LyricsModal } from '@/components/LyricsModal';
import { FullScreenPlayer } from '@/components/FullScreenPlayer';
import { PWAProvider } from '@/components/PWAProvider';

export const metadata: Metadata = {
  title: 'CloudBeatz Web - Free High Quality Music Streamer',
  description: 'Stream unlimited music with synchronized lyrics, zero ads, and smart recommendations powered by YouTube Music.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CloudBeatz',
  },
  applicationName: 'CloudBeatz',
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-[#09090b] text-zinc-100 min-h-screen selection:bg-emerald-500 selection:text-black antialiased">
        <PWAProvider>
          {children}
          <PlayerBar />
          <QueueDrawer />
          <LyricsModal />
          <FullScreenPlayer />
        </PWAProvider>
      </body>
    </html>
  );
}

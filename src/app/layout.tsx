import type { Metadata } from 'next';
import './globals.css';
import { PlayerBar } from '@/components/PlayerBar';
import { QueueDrawer } from '@/components/QueueDrawer';
import { LyricsModal } from '@/components/LyricsModal';
import { FullScreenPlayer } from '@/components/FullScreenPlayer';

export const metadata: Metadata = {
  title: 'CloudBeatz Web - Free High Quality Music Streamer',
  description: 'Stream unlimited music with synchronized lyrics, zero ads, and smart recommendations powered by YouTube Music.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#09090b] text-zinc-100 min-h-screen selection:bg-emerald-500 selection:text-black">
        {children}
        <PlayerBar />
        <QueueDrawer />
        <LyricsModal />
        <FullScreenPlayer />
      </body>
    </html>
  );
}

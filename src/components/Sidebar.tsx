'use client';

import React from 'react';
import {
  Home,
  Music2,
  ListMusic,
  Disc3,
  Mic2,
  Settings,
  Sparkles,
} from 'lucide-react';

import { usePlayerStore } from '@/store/usePlayerStore';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentTrack } = usePlayerStore();

  const mainNavItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'songs', label: 'Songs', icon: Music2 },
    { id: 'playlists', label: 'Playlists', icon: ListMusic },
    { id: 'albums', label: 'Albums', icon: Disc3 },
    { id: 'artists', label: 'Artists', icon: Mic2 },
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* 📱 MOBILE VERTICAL ROTATED RAIL (Screenshot 1, 2, 4 Exact Replica)         */}
      {/* ========================================================================= */}
      <nav
        className={`flex md:hidden flex-col justify-between items-center w-10 sm:w-12 py-5 select-none z-30 flex-shrink-0 bg-black/10 no-scrollbar ${
          currentTrack ? 'h-[calc(100vh-70px)]' : 'h-screen'
        }`}
      >
        <div className="flex flex-col items-center space-y-6 sm:space-y-7 pt-3">
          {mainNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`py-1 transition-all duration-200 cursor-pointer flex items-center justify-center ${
                  isActive ? 'font-black text-white' : 'text-zinc-500 hover:text-zinc-300 font-medium'
                }`}
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                }}
              >
                <span className={`text-[10px] sm:text-[11px] uppercase tracking-wider ${isActive ? 'text-white font-black' : 'text-zinc-500'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Settings Icon */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`p-2.5 rounded-xl transition-all ${
            activeTab === 'settings'
              ? 'text-white bg-white/10'
              : 'text-zinc-500 hover:text-white'
          }`}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* 💻 DESKTOP SIDEBAR (Visible on screens >= 768px)                          */}
      {/* ========================================================================= */}
      <aside
        className={`w-64 hidden md:flex flex-col ${
          currentTrack ? 'h-[calc(100vh-88px)]' : 'h-screen'
        } glass border-r border-white/10 p-5 select-none transition-all duration-300`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-emerald-500/20 border border-white/10 flex-shrink-0 bg-zinc-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="CloudBeatz Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-emerald-400 bg-clip-text text-transparent">
              CloudBeatz
            </h1>
            <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Web Edition</p>
          </div>
        </div>

        {/* Main Nav Items */}
        <div className="space-y-1.5">
          <p className="px-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2" suppressHydrationWarning>
            Discover
          </p>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white/10 text-white font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                {item.label}
              </button>
            );
          })}

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === 'settings'
                ? 'bg-white/10 text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-white' : 'text-zinc-400'}`} />
            Settings
          </button>
        </div>
      </aside>
    </>
  );
};

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

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const mainNavItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'songs', label: 'Songs', icon: Music2 },
    { id: 'playlists', label: 'Playlists', icon: ListMusic },
    { id: 'albums', label: 'Albums', icon: Disc3 },
    { id: 'artists', label: 'Artists', icon: Mic2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 hidden md:flex flex-col h-[calc(100vh-88px)] glass border-r border-white/10 p-5 select-none">
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
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-auto pt-4 border-t border-white/5 px-2">
        <div className="p-3 rounded-xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>BOLI Smart Engine</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Auto-customizes home dashboard based on your last played song.
          </p>
        </div>
      </div>
    </aside>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Music2,
  ListMusic,
  Disc3,
  Mic2,
  Settings,
} from 'lucide-react';

import { usePlayerStore } from '@/store/usePlayerStore';
import { useThemeStore } from '@/lib/themeStore';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentTrack } = usePlayerStore();
  const { backgroundColor, themeMode } = useThemeStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapse state preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cloudbeatz_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem('cloudbeatz_sidebar_collapsed', String(next));
    } catch {
      // ignore
    }
  };

  const activeBg =
    themeMode === 'dark'
      ? '#09090b'
      : themeMode === 'light'
      ? '#261622'
      : themeMode === 'dynamic'
      ? backgroundColor || '#140a17'
      : '#140a17';

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
        className={`flex md:hidden flex-col items-center w-10 sm:w-12 select-none z-30 flex-shrink-0 bg-transparent no-scrollbar ${
          currentTrack ? 'h-[calc(100vh-70px)]' : 'h-screen'
        }`}
      >
        <div className="flex flex-col items-center space-y-8 sm:space-y-10 pt-20 sm:pt-24">
          {mainNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`py-1 transition-all duration-200 cursor-pointer flex items-center justify-center ${
                  isActive ? 'scale-105 font-bold text-white' : 'text-zinc-500 hover:text-zinc-300 font-medium'
                }`}
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                }}
              >
                <span className={`text-xs sm:text-[13px] tracking-wide ${isActive ? 'text-white font-bold' : 'text-zinc-400'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Settings Icon placed right below Artists */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`p-2 rounded-xl transition-all ${
              activeTab === 'settings'
                ? 'text-white bg-white/10'
                : 'text-zinc-500 hover:text-white'
            }`}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 💻 DESKTOP SIDEBAR (Framer-Motion Smooth Width Spring & Zero Shift)         */}
      {/* ========================================================================= */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 76 : 240 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        style={{ backgroundColor: activeBg }}
        className={`hidden md:flex flex-col ${
          currentTrack ? 'h-[calc(100vh-88px)]' : 'h-screen'
        } border-r border-white/5 px-3.5 pt-10 pb-4 select-none overflow-hidden transition-colors duration-500`}
      >
        {/* Brand Header: Click to Toggle Expand / Collapse */}
        <div
          onClick={toggleCollapse}
          className="flex items-center gap-3.5 px-2 mb-8 h-10 cursor-pointer group select-none flex-shrink-0"
          title={isCollapsed ? 'Click to Expand' : 'Click to Collapse'}
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-rose-500/25 border border-white/10 flex-shrink-0 bg-zinc-900 group-hover:scale-105 transition-transform flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="CloudBeatz Logo" className="w-full h-full object-cover" />
          </div>

          <motion.div
            initial={false}
            animate={{
              opacity: isCollapsed ? 0 : 1,
              x: isCollapsed ? -10 : 0,
            }}
            transition={{ duration: 0.18 }}
            className={`min-w-0 flex-1 overflow-hidden whitespace-nowrap ${
              isCollapsed ? 'pointer-events-none' : ''
            }`}
          >
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-100 to-rose-300 bg-clip-text text-transparent truncate">
              CloudBeatz
            </h1>
            <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider truncate">
              Web Edition
            </p>
          </motion.div>
        </div>

        {/* Main Nav Items */}
        <div className="space-y-3 flex-1 flex flex-col pt-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-medium transition-colors duration-200 overflow-hidden flex-shrink-0 ${
                  isActive
                    ? 'bg-white/10 text-white font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                </div>

                <motion.span
                  initial={false}
                  animate={{
                    opacity: isCollapsed ? 0 : 1,
                    x: isCollapsed ? -8 : 0,
                  }}
                  transition={{ duration: 0.18 }}
                  className={`truncate whitespace-nowrap ${
                    isCollapsed ? 'pointer-events-none' : ''
                  }`}
                >
                  {item.label}
                </motion.span>
              </button>
            );
          })}

          <button
            onClick={() => setActiveTab('settings')}
            title={isCollapsed ? 'Settings' : undefined}
            className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-medium transition-colors duration-200 overflow-hidden flex-shrink-0 ${
              activeTab === 'settings'
                ? 'bg-white/10 text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'text-white' : 'text-zinc-400'}`} />
            </div>

            <motion.span
              initial={false}
              animate={{
                opacity: isCollapsed ? 0 : 1,
                x: isCollapsed ? -8 : 0,
              }}
              transition={{ duration: 0.18 }}
              className={`truncate whitespace-nowrap ${
                isCollapsed ? 'pointer-events-none' : ''
              }`}
            >
              Settings
            </motion.span>
          </button>
        </div>
      </motion.aside>
    </>
  );
};

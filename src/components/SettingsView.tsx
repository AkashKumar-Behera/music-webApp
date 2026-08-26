'use client';

import React, { useState, useEffect } from 'react';
import { CacheService } from '@/lib/cache';
import { OfflineStore } from '@/lib/offlineStore';
import { useThemeStore, ThemeMode } from '@/lib/themeStore';
import {
  Palette,
  Database,
  Sparkles,
  Radio,
  CheckCircle,
  RefreshCw,
  Trash2,
  Plane,
  ChevronRight,
  Check,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { themeMode, setThemeMode } = useThemeStore();

  const [cacheStats, setCacheStats] = useState({ count: 0, estimatedSizeKb: 0 });
  const [offlineStats, setOfflineStats] = useState({ count: 0, totalMb: 0 });
  const [isCleared, setIsCleared] = useState(false);
  const [isOfflineCleared, setIsOfflineCleared] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  useEffect(() => {
    updateStats();
  }, []);

  const updateStats = async () => {
    const stats = CacheService.getCacheSize();
    setCacheStats(stats);
    const offStats = await OfflineStore.getStorageStats();
    setOfflineStats(offStats);
  };

  const handleClearCache = () => {
    CacheService.clearAll();
    updateStats();
    setIsCleared(true);
    setTimeout(() => setIsCleared(false), 3000);
  };

  const handleClearOffline = async () => {
    await OfflineStore.clearAll();
    updateStats();
    setIsOfflineCleared(true);
    setTimeout(() => setIsOfflineCleared(false), 3000);
  };

  const themeOptions: { mode: ThemeMode; label: string }[] = [
    { mode: 'dynamic', label: 'Dynamic' },
    { mode: 'system', label: 'System default' },
    { mode: 'dark', label: 'Dark' },
    { mode: 'light', label: 'Light' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Settings</h2>
        <p className="text-xs text-zinc-400 mt-1">Personalisation, offline caching, and playback controls.</p>
      </div>

      {/* Personalisation (Screenshot 1 Exact replica) */}
      <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/5 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-300">
            <Palette className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-white">Personalisation</h3>
        </div>

        <div
          onClick={() => setIsThemeModalOpen(true)}
          className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all cursor-pointer select-none"
        >
          <div>
            <p className="text-sm font-medium text-white">Theme Mode</p>
            <p className="text-xs text-zinc-400 capitalize mt-0.5">{themeMode}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </div>
      </div>

      {/* Theme Selection Modal (Screenshot 1) */}
      {isThemeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#1e131d] border border-white/10 p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white">Theme Mode</h3>

            <div className="space-y-4">
              {themeOptions.map((opt) => {
                const isSelected = themeMode === opt.mode;
                return (
                  <div
                    key={opt.mode}
                    onClick={() => {
                      setThemeMode(opt.mode);
                      setIsThemeModalOpen(false);
                    }}
                    className="flex items-center gap-3.5 cursor-pointer group py-1"
                  >
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-white bg-white/20'
                          : 'border-zinc-500 group-hover:border-zinc-400'
                      }`}
                    >
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                    </div>
                    <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                      {opt.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsThemeModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Storage / IndexedDB */}
      <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/5 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
            <Plane className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Offline Cached Songs (IndexedDB)</h3>
            <p className="text-xs text-zinc-400">Auto-saves played songs for 0-internet offline playback.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
            <p className="text-[11px] text-zinc-400">Saved Songs</p>
            <p className="text-xl font-bold text-white mt-0.5">{offlineStats.count} <span className="text-xs font-normal text-zinc-500">tracks</span></p>
          </div>
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
            <p className="text-[11px] text-zinc-400">Offline Storage</p>
            <p className="text-xl font-bold text-rose-400 mt-0.5">{offlineStats.totalMb} <span className="text-xs font-normal text-zinc-500">MB</span></p>
          </div>
        </div>

        {/* Cache Storage Limit Selector (30, 50, 100, Unlimited) */}
        <div className="pt-2 border-t border-white/5 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-zinc-300">Auto-Cache Limit</p>
            <span className="text-[11px] text-zinc-500">Oldest tracks pruned when full</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(['30', '50', '100', 'unlimited'] as const).map((lim) => {
              const currentLimit = OfflineStore.getLimit();
              const isSelected = currentLimit === lim;
              return (
                <button
                  key={lim}
                  onClick={() => {
                    OfflineStore.setLimit(lim);
                    updateStats();
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/25'
                      : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {lim === 'unlimited' ? 'Unlimited' : `${lim} Songs`}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={handleClearOffline}
            disabled={offlineStats.count === 0}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 ${
              isOfflineCleared
                ? 'bg-emerald-500 text-black'
                : 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20'
            }`}
          >
            {isOfflineCleared ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Cleared!</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Offline Songs</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Web Metadata Cache */}
      <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Metadata & API Cache</h3>
              <p className="text-xs text-zinc-400">Fast 0ms tab switching cache.</p>
            </div>
          </div>
          <button
            onClick={updateStats}
            title="Refresh"
            className="p-2 rounded-lg text-zinc-400 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-zinc-400">{cacheStats.count} items ({cacheStats.estimatedSizeKb} KB)</p>
          <button
            onClick={handleClearCache}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
              isCleared
                ? 'bg-emerald-500 text-black'
                : 'bg-white/5 text-zinc-300 hover:text-white border border-white/10'
            }`}
          >
            {isCleared ? 'Cache Cleared!' : 'Clear Cache'}
          </button>
        </div>
      </div>
    </div>
  );
};

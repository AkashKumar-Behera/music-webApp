'use client';

import React, { useState, useEffect } from 'react';
import { CacheService } from '@/lib/cache';
import { Trash2, Database, Sparkles, Radio, CheckCircle, Info, RefreshCw } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [cacheStats, setCacheStats] = useState({ count: 0, estimatedSizeKb: 0 });
  const [isCleared, setIsCleared] = useState(false);

  useEffect(() => {
    updateCacheStats();
  }, []);

  const updateCacheStats = () => {
    const stats = CacheService.getCacheSize();
    setCacheStats(stats);
  };

  const handleClearCache = () => {
    CacheService.clearAll();
    updateCacheStats();
    setIsCleared(true);
    setTimeout(() => setIsCleared(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">App Settings & Preferences</h2>
        <p className="text-sm text-zinc-400 mt-1">Manage cache, streaming engine, and discovery configuration.</p>
      </div>

      {/* Discovery Engine (BOLI) Info Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900/90 to-zinc-900/40 border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">BOLI (Based On Last Interaction) Discovery</h3>
            <p className="text-xs text-zinc-400">Smart contextual dashboard engine adapted from CloudBeatz Android.</p>
          </div>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed bg-black/30 p-3.5 rounded-xl border border-white/5">
          Whenever you play any track, CloudBeatz automatically transforms your <strong>Home</strong> tab with Quick Picks, Artist Albums, Top Tracks, and Mood Playlists tailored to that specific song.
        </p>
      </div>

      {/* Smart Cache Management */}
      <div className="p-6 rounded-2xl bg-zinc-900/80 border border-white/10 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Local Storage & Memory Cache</h3>
              <p className="text-xs text-zinc-400">Fast 0ms tab switching and reduced network data usage.</p>
            </div>
          </div>
          <button
            onClick={updateCacheStats}
            title="Refresh cache statistics"
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-black/40 border border-white/5">
            <p className="text-xs text-zinc-400 font-medium">Cached Sections</p>
            <p className="text-2xl font-bold text-white mt-1">{cacheStats.count} <span className="text-xs font-normal text-zinc-500">items</span></p>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-white/5">
            <p className="text-xs text-zinc-400 font-medium">Estimated Cache Size</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{cacheStats.estimatedSizeKb} <span className="text-xs font-normal text-zinc-500">KB</span></p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-zinc-400">Clearing cache will refresh all personalized recommendations and categories.</p>
          <button
            onClick={handleClearCache}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 ${
              isCleared
                ? 'bg-emerald-500 text-black'
                : 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30'
            }`}
          >
            {isCleared ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Cache Cleared!</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Clear Cached Data</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Streaming Engine Info */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Stream Pipeline Details</h3>
            <p className="text-xs text-zinc-400">High-Fidelity Audio Direct from Google CDN</p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-zinc-300">
          <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-zinc-400">Stream Delivery</span>
            <span className="text-emerald-400 font-semibold">HTTP 302 Direct CDN Redirect</span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-zinc-400">Audio Codec</span>
            <span className="font-semibold text-white">M4A (AAC 140 / 128-256 kbps)</span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-zinc-400">Server Footprint</span>
            <span className="font-semibold text-white">0-Bandwidth VPS Proxying</span>
          </div>
        </div>
      </div>
    </div>
  );
};

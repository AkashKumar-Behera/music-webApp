'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Link as LinkIcon, Loader2, TrendingUp, History } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cloudbeatz_recent_searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Save query to recent searches
  const saveRecentSearch = (term: string) => {
    try {
      const updated = [term, ...recentSearches.filter((s) => s.toLowerCase() !== term.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('cloudbeatz_recent_searches', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  // Debounced fetch for live suggestions
  useEffect(() => {
    if (!query.trim() || query.includes('youtube.com') || query.includes('youtu.be')) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggestions?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (data.suggestions) {
          setSuggestions(data.suggestions);
        }
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalQuery = selectedIndex >= 0 && suggestions[selectedIndex] ? suggestions[selectedIndex] : query;
    if (finalQuery.trim()) {
      saveRecentSearch(finalQuery.trim());
      onSearch(finalQuery.trim());
      setIsDropdownOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleSelectSuggestion = (term: string) => {
    setQuery(term);
    saveRecentSearch(term);
    onSearch(term);
    setIsDropdownOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setSelectedIndex(-1);
    }
  };

  const isUrl = query.includes('youtube.com') || query.includes('youtu.be');

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-4 pointer-events-none text-zinc-400">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          ) : isUrl ? (
            <LinkIcon className="w-5 h-5 text-emerald-400" />
          ) : (
            <Search className="w-5 h-5 text-zinc-400" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onFocus={() => setIsDropdownOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsDropdownOpen(true);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Songs, Playlist, Album or Artist"
          className="w-full pl-12 pr-12 py-3 bg-[#34242f]/90 hover:bg-[#34242f] text-white placeholder-zinc-400 text-sm rounded-full border border-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/20 focus:outline-none transition-all shadow-inner"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
            }}
            className="absolute right-4 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Autocomplete / Suggestions Dropdown */}
      {isDropdownOpen && (suggestions.length > 0 || (query.trim() === '' && recentSearches.length > 0)) && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in duration-150 divide-y divide-white/5">
          {/* Live Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-1 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                Search Suggestions
              </p>
              {suggestions.map((suggestion, idx) => (
                <button
                  key={suggestion}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${
                    selectedIndex === idx
                      ? 'bg-emerald-500/15 text-emerald-400 font-medium'
                      : 'text-zinc-200 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <TrendingUp
                    className={`w-4 h-4 flex-shrink-0 ${
                      selectedIndex === idx ? 'text-emerald-400' : 'text-zinc-400'
                    }`}
                  />
                  <span className="truncate">{suggestion}</span>
                </button>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {query.trim() === '' && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-1">
                <p className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">Recent Searches</p>
                <button
                  onClick={() => {
                    setRecentSearches([]);
                    localStorage.removeItem('cloudbeatz_recent_searches');
                  }}
                  className="text-[11px] text-zinc-400 hover:text-red-400 transition-colors"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((recent) => (
                <button
                  key={recent}
                  onClick={() => handleSelectSuggestion(recent)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <History className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <span className="truncate">{recent}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

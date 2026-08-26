import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dynamic' | 'system' | 'dark' | 'light';

interface ThemeState {
  themeMode: ThemeMode;
  dominantColor: string;
  accentColor: string;
  backgroundColor: string;
  setThemeMode: (mode: ThemeMode) => void;
  setColors: (dominant: string, accent: string, bg: string) => void;
  extractColorsFromImage: (imageUrl: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themeMode: 'dynamic',
      dominantColor: '#e11d48',
      accentColor: '#f43f5e',
      backgroundColor: '#160913',

      setThemeMode: (mode) => set({ themeMode: mode }),

      setColors: (dominant, accent, bg) =>
        set({ dominantColor: dominant, accentColor: accent, backgroundColor: bg }),

      extractColorsFromImage: (imageUrl) => {
        if (get().themeMode !== 'dynamic') return;
        if (typeof window === 'undefined') return;

        // Fallback default dynamic shades
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imageUrl;

        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 10;
            canvas.height = 10;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.drawImage(img, 0, 0, 10, 10);
            const data = ctx.getImageData(0, 0, 10, 10).data;

            let r = 0, g = 0, b = 0, count = 0;
            for (let i = 0; i < data.length; i += 4) {
              r += data[i];
              g += data[i + 1];
              b += data[i + 2];
              count++;
            }

            r = Math.floor(r / count);
            g = Math.floor(g / count);
            b = Math.floor(b / count);

            // Boost saturation and clamp background to deep luxury tones
            const bgR = Math.max(12, Math.min(28, Math.floor(r * 0.18)));
            const bgG = Math.max(8, Math.min(20, Math.floor(g * 0.15)));
            const bgB = Math.max(14, Math.min(26, Math.floor(b * 0.20)));

            const dominant = `rgb(${Math.max(180, r)}, ${g}, ${b})`;
            const accent = `rgb(${r}, ${g}, ${b})`;
            const bg = `rgb(${bgR}, ${bgG}, ${bgB})`;

            set({ dominantColor: dominant, accentColor: accent, backgroundColor: bg });
          } catch {
            // Ignore canvas security errors on some external CDNs
          }
        };
      },
    }),
    {
      name: 'cloudbeatz-theme-storage',
    }
  )
);

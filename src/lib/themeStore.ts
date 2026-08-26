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

function updateMetaThemeColor(color: string) {
  if (typeof document === 'undefined') return;
  try {
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute('content', color);

    let metaApple = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!metaApple) {
      metaApple = document.createElement('meta');
      metaApple.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
      document.head.appendChild(metaApple);
    }
    metaApple.setAttribute('content', 'black-translucent');
  } catch {
    // ignore SSR error
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themeMode: 'dynamic',
      dominantColor: '#e11d48',
      accentColor: '#f43f5e',
      backgroundColor: '#160913',

      setThemeMode: (mode) => {
        set({ themeMode: mode });
        const bg = mode === 'dark' ? '#09090b' : mode === 'light' ? '#261622' : get().backgroundColor || '#160913';
        updateMetaThemeColor(bg);
      },

      setColors: (dominant, accent, bg) => {
        set({ dominantColor: dominant, accentColor: accent, backgroundColor: bg });
        if (get().themeMode === 'dynamic') {
          updateMetaThemeColor(bg);
        }
      },

      extractColorsFromImage: (imageUrl) => {
        if (get().themeMode !== 'dynamic') return;
        if (typeof window === 'undefined' || !imageUrl) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        // Use local image proxy to bypass external CDN CORS restrictions
        img.src = imageUrl.startsWith('http')
          ? `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`
          : imageUrl;

        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            ctx.drawImage(img, 0, 0, 32, 32);
            const data = ctx.getImageData(0, 0, 32, 32).data;

            let maxSat = 0;
            let domR = 225, domG = 29, domB = 72; // default vibrant rose
            let totalR = 0, totalG = 0, totalB = 0, count = 0;

            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const a = data[i + 3];
              if (a < 128) continue;

              totalR += r;
              totalG += g;
              totalB += b;
              count++;

              // Calculate saturation & luminance
              const max = Math.max(r, g, b);
              const min = Math.min(r, g, b);
              const sat = max === 0 ? 0 : (max - min) / max;
              const lum = 0.299 * r + 0.587 * g + 0.114 * b;

              // Pick the most vibrant color in natural visibility range
              if (sat > maxSat && lum > 35 && lum < 225) {
                maxSat = sat;
                domR = r;
                domG = g;
                domB = b;
              }
            }

            const avgR = count > 0 ? Math.floor(totalR / count) : domR;
            const avgG = count > 0 ? Math.floor(totalG / count) : domG;
            const avgB = count > 0 ? Math.floor(totalB / count) : domB;

            // Deep luxury background tint adapted to the cover's dominant mood
            const bgR = Math.max(10, Math.min(26, Math.floor(domR * 0.13 + avgR * 0.06)));
            const bgG = Math.max(8, Math.min(22, Math.floor(domG * 0.13 + avgG * 0.06)));
            const bgB = Math.max(12, Math.min(28, Math.floor(domB * 0.13 + avgB * 0.06)));

            const dominant = `rgb(${domR}, ${domG}, ${domB})`;
            const accent = `rgb(${Math.min(255, domR + 35)}, ${Math.min(255, domG + 35)}, ${Math.min(255, domB + 35)})`;
            const bg = `rgb(${bgR}, ${bgG}, ${bgB})`;

            set({ dominantColor: dominant, accentColor: accent, backgroundColor: bg });
            updateMetaThemeColor(bg);
          } catch (err) {
            console.warn('Dynamic color extraction failed:', err);
          }
        };
      },
    }),
    {
      name: 'cloudbeatz-theme-storage',
    }
  )
);

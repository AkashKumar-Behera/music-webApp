import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track } from '@/lib/types';
import { useThemeStore } from '@/lib/themeStore';

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  queue: Track[];
  history: Track[];
  favorites: Track[];
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: 'off' | 'one' | 'all';
  isShuffled: boolean;
  isQueueOpen: boolean;
  isLyricsOpen: boolean;
  isFullScreenPlayerOpen: boolean;

  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  toggleQueue: () => void;
  toggleLyrics: () => void;
  toggleFullScreenPlayer: () => void;
  setIsFullScreenPlayerOpen: (open: boolean) => void;
  toggleFavorite: (track: Track) => void;
  isFavorite: (id: string) => boolean;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      isPlaying: false,
      isLoading: false,
      queue: [],
      history: [],
      favorites: [],
      currentTime: 0,
      duration: 0,
      volume: 1.0,
      isMuted: false,
      repeatMode: 'off',
      isShuffled: false,
      isQueueOpen: false,
      isLyricsOpen: false,
      isFullScreenPlayerOpen: false,

      playTrack: (track, newQueue) => {
        const state = get();
        
        // Sync dynamic theme palette
        if (track.thumbnail) {
          useThemeStore.getState().extractColorsFromImage(track.thumbnail);
        }

        // Add to history if unique
        const updatedHistory = [track, ...state.history.filter((t) => t.id !== track.id)].slice(0, 100);

        if (newQueue) {
          const filteredQueue = newQueue.filter((t) => t.id !== track.id);
          set({
            currentTrack: track,
            queue: filteredQueue,
            history: updatedHistory,
            isPlaying: true,
            isLoading: true,
            currentTime: 0,
            duration: track.duration || 0,
          });
        } else {
          set({
            currentTrack: track,
            history: updatedHistory,
            isPlaying: true,
            isLoading: true,
            currentTime: 0,
            duration: track.duration || 0,
          });
        }
      },

      togglePlay: () => {
        const { isPlaying, currentTrack } = get();
        if (!currentTrack) return;
        set({ isPlaying: !isPlaying });
      },

      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration: duration }),

      nextTrack: () => {
        const { queue, repeatMode, currentTrack, history } = get();
        if (repeatMode === 'one' && currentTrack) {
          set({ currentTime: 0, isPlaying: true });
          return;
        }

        if (queue.length > 0) {
          const nextSong = queue[0];
          const remainingQueue = queue.slice(1);
          if (nextSong.thumbnail) {
            useThemeStore.getState().extractColorsFromImage(nextSong.thumbnail);
          }
          const updatedHistory = currentTrack
            ? [currentTrack, ...history.filter((t) => t.id !== currentTrack.id)].slice(0, 100)
            : history;

          set({
            currentTrack: nextSong,
            queue: remainingQueue,
            history: updatedHistory,
            isPlaying: true,
            isLoading: true,
            currentTime: 0,
          });
        } else if (repeatMode === 'all' && history.length > 0) {
          const firstSong = history[history.length - 1];
          if (firstSong.thumbnail) {
            useThemeStore.getState().extractColorsFromImage(firstSong.thumbnail);
          }
          set({
            currentTrack: firstSong,
            queue: history.slice(0, -1).reverse(),
            isPlaying: true,
            isLoading: true,
            currentTime: 0,
          });
        } else {
          set({ isPlaying: false });
        }
      },

      prevTrack: () => {
        const { history, currentTrack, queue, currentTime } = get();
        if (currentTime > 3) {
          set({ currentTime: 0 });
          return;
        }

        if (history.length > 1) {
          const prevSong = history[1]; // 0 is current song
          const newQueue = currentTrack ? [currentTrack, ...queue] : queue;
          if (prevSong.thumbnail) {
            useThemeStore.getState().extractColorsFromImage(prevSong.thumbnail);
          }
          set({
            currentTrack: prevSong,
            history: history.slice(1),
            queue: newQueue,
            isPlaying: true,
            isLoading: true,
            currentTime: 0,
          });
        } else {
          set({ currentTime: 0 });
        }
      },

      addToQueue: (track) => {
        set((state) => ({ queue: [...state.queue, track] }));
      },

      removeFromQueue: (index) => {
        set((state) => ({
          queue: state.queue.filter((_, i) => i !== index),
        }));
      },

      clearQueue: () => set({ queue: [] }),

      setVolume: (volume) => set({ volume, isMuted: volume === 0 }),

      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

      toggleRepeat: () => {
        const { repeatMode } = get();
        const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
        const nextIndex = (modes.indexOf(repeatMode) + 1) % modes.length;
        set({ repeatMode: modes[nextIndex] });
      },

      toggleShuffle: () => {
        const { isShuffled, queue } = get();
        if (!isShuffled) {
          const shuffled = [...queue].sort(() => Math.random() - 0.5);
          set({ isShuffled: true, queue: shuffled });
        } else {
          set({ isShuffled: false });
        }
      },

      toggleQueue: () => set((state) => ({ isQueueOpen: !state.isQueueOpen })),
      toggleLyrics: () => set((state) => ({ isLyricsOpen: !state.isLyricsOpen })),
      toggleFullScreenPlayer: () => set((state) => ({ isFullScreenPlayerOpen: !state.isFullScreenPlayerOpen })),
      setIsFullScreenPlayerOpen: (open) => set({ isFullScreenPlayerOpen: open }),

      toggleFavorite: (track) => {
        const { favorites } = get();
        const exists = favorites.some((t) => t.id === track.id);
        if (exists) {
          set({ favorites: favorites.filter((t) => t.id !== track.id) });
        } else {
          set({ favorites: [track, ...favorites] });
        }
      },

      isFavorite: (id) => {
        return get().favorites.some((t) => t.id === id);
      },
    }),
    {
      name: 'cloudbeatz-player-state',
      partialize: (state) => ({
        history: state.history,
        favorites: state.favorites,
        volume: state.volume,
        repeatMode: state.repeatMode,
      }),
    }
  )
);

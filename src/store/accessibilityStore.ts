import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ContrastMode = 'normal' | 'high' | 'inverted';

interface AccessibilityState {
  contrastMode: ContrastMode;
  fontSizeBase: number;
  fontScale: number;
  toggleContrast: () => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetAll: () => void;
}

export const useAccessibilityStore = create<AccessibilityState>()(
  persist(
    (set) => ({
      contrastMode: 'normal',
      fontSizeBase: 14,
      fontScale: 1.0,

      toggleContrast: () =>
        set((state) => ({
          contrastMode:
            state.contrastMode === 'normal'
              ? 'high'
              : state.contrastMode === 'high'
              ? 'inverted'
              : 'normal',
        })),

      increaseFontSize: () =>
        set((state) => ({
          fontSizeBase: Math.min(state.fontSizeBase + 2, 22),
          fontScale: Math.min(state.fontScale + 0.15, 1.6),
        })),

      decreaseFontSize: () =>
        set((state) => ({
          fontSizeBase: Math.max(state.fontSizeBase - 2, 14),
          fontScale: Math.max(state.fontScale - 0.15, 1.0),
        })),

      resetAll: () => set({ contrastMode: 'normal', fontSizeBase: 14, fontScale: 1.0 }),
    }),
    {
      name: 'sorria-accessibility',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

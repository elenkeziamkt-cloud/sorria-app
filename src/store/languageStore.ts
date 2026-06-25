import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Lang } from '../i18n/translations';

interface LanguageState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      lang: 'pt',
      setLang: (lang) => set({ lang }),
    }),
    {
      name: 'sorria-language',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

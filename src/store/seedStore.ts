import { create } from 'zustand';

interface SeedState {
  seeded: boolean;
  setSeeded: (v: boolean) => void;
}

export const useSeedStore = create<SeedState>()(set => ({
  seeded: false,
  setSeeded: (v) => set({ seeded: v }),
}));

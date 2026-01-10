import { create } from "zustand";

export type UserRole = "CEO" | "CFO" | "KAM";

type AppState = {
  user: { name: string; role: UserRole } | null;
  companyId: number;
  versionId: number;
  sheetKey: string | null;

  login: (u: string, p: string) => Promise<void>;
  logout: () => void;
  setSheet: (k: string | null) => void;
};

export const useAppStore = create<AppState>((set) => ({
  user: null,
  companyId: 1,
  versionId: 1,
  sheetKey: null,

  login: async () => {
    set({ user: { name: "Sharat Prakash", role: "CFO" } });
  },

  logout: () => set({ user: null }),

  setSheet: (k) => set({ sheetKey: k }),
}));
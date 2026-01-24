import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { secureStorage } from "./secureStorage";

export interface ISessionData {
  userId: string;
  userEmail: string;
  token: string;
}

interface SessionState {
  session: ISessionData | null;
  setSession: (s: ISessionData) => void;
  clearSession: () => void;
}

export const useSessionStore = create(
  persist<SessionState>(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
    }),
    {
      name: "secure-session",
      storage: createJSONStorage(() => secureStorage),
    },
  ),
);

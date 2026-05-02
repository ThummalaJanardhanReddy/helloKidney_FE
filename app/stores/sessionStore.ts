import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { secureStorage } from "./secureStorage";

export interface ISessionData {
  userId: string;
  userEmail: string;
  token: string;
  userType?: string;
  userName?: string;
}

interface SessionState {
  session: ISessionData | null;
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  setSession: (s: ISessionData) => void;
  updateUserDetails: (details: { userEmail?: string; userType?: 'healthworker'|'patient' }) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      hasHydrated: false,

      setHasHydrated: (v) => set({ hasHydrated: v }),

      setSession: (session) => set({ session }),

      updateUserDetails: (details) =>
        set((state) => ({
          session: state.session
            ? { ...state.session, ...details }
            : null,
        })),

      clearSession: () => set({ session: null }),
    }),
    {
      name: "secure-session",

      storage: createJSONStorage(() => secureStorage),

      onRehydrateStorage: () => {
        return (state, error) => {
          if (!error) {
            state?.setHasHydrated(true);
          }
        };
      },
    }
  )
);
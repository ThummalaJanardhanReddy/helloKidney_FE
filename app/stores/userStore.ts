import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { secureStorage } from "./secureStorage";
import { IPatient } from "@/src/utils/constants";

// ✅ Types
export type UserType = "healthworker" | "patient";

export interface IUser {
  userId: string;
  userEmail: string;
  token: string;
  userType?: UserType;
  userName?: string;
}

interface UserState {
  user: IUser | null;
  patient: IPatient | null;
  hasHydrated: boolean;

  // actions
  setHasHydrated: (value: boolean) => void;
  setUser: (user: IUser) => void;
  updateUser: (data: Partial<IUser>) => void;
  setUserType: (type: UserType) => void;
  clearUser: () => void;

  // helpers
  isLoggedIn: () => boolean;

  setSelectedPatient: (patient: IPatient | null) => void;
}

// 🚀 Single Store
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      patient: null,
      hasHydrated: false,

      // hydration flag
      setHasHydrated: (value) => set({ hasHydrated: value }),

      // set full user/session
      setUser: (user) => set({ user }),

      // partial update
      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),

      // update only userType safely
      setUserType: (type) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, userType: type }
            : state.user,
        })),

      // clear everything
      clearUser: () => set({ user: null }),

      // helper
      isLoggedIn: () => !!get().user?.token,

      setSelectedPatient: (patient) => set({ patient }),
    }),
    {
      name: "user-store",

      storage: createJSONStorage(() => secureStorage),

      onRehydrateStorage: () => (state, error) => {
        if (!error) {
          state?.setHasHydrated(true);
        }
      },
    }
  )
);
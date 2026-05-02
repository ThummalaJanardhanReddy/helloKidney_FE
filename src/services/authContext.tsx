import { useUserStore } from "@/app/stores/userStore";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

type Props = {
  children: React.ReactNode;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: Props) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const user = useUserStore((state) => state.user);
  const hasHydrated = useUserStore((s) => s.hasHydrated);
  const clearSession = useUserStore((state) => state.clearUser);

  // useEffect(() => {
  //   const initAuth = async () => {
  //     // const token = await getAccessToken();
  //     if (session?.token) setIsAuthenticated(true);
  //     else setIsAuthenticated(false);
  //     setIsLoading(false);
  //   };
  //   initAuth();
  // }, []);

  useEffect(() => {
    if (!hasHydrated) return;

    setIsAuthenticated(!!user?.token);
    setIsLoading(false);
  }, [hasHydrated, user?.token]);

  const logout = async () => {
    clearSession();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

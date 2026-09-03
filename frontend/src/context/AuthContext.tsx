"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, refreshAccessToken } from "@/lib/axios";
import { tokenStore } from "@/lib/tokenStore";
import { decodeAccessToken } from "@/lib/jwt";
import { AuthUser, Role, SessionState } from "@/types";

interface AuthContextValue extends SessionState {
  setSession: (accessToken: string, user: AuthUser | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DASHBOARD_PATH: Record<Role, string> = {
  DEVELOPER: "/dashboard/developer",
  ADMIN: "/dashboard/admin",
  ACCOUNTANT: "/dashboard/accountant",
  HOUSEMASTER: "/dashboard/housemaster",
  STUDENT: "/dashboard/student",
  SELLER: "/dashboard/seller",
};

export function dashboardPathFor(role: Role) {
  return DASHBOARD_PATH[role];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<SessionState>({
    accessToken: null,
    role: null,
    user: null,
    isHydrating: true,
  });

  useEffect(() => {
    const unsubscribe = tokenStore.subscribe(() => {
      setState((prev) => ({
        ...prev,
        accessToken: tokenStore.get(),
        role: tokenStore.getRole(),
      }));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let cancelled = false;
    refreshAccessToken().then((token) => {
      if (cancelled) return;
      if (token) {
        const decoded = decodeAccessToken(token);
        setState((prev) => ({
          ...prev,
          accessToken: token,
          role: decoded?.role ?? null,
          isHydrating: false,
        }));
      } else {
        setState((prev) => ({ ...prev, isHydrating: false }));
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSession = useCallback((accessToken: string, user: AuthUser | null) => {
    const decoded = decodeAccessToken(accessToken);
    if (decoded) tokenStore.set(accessToken, decoded.role);
    setState({ accessToken, role: decoded?.role ?? null, user, isHydrating: false });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore — we clear local state regardless
    }
    tokenStore.clear();
    setState({ accessToken: null, role: null, user: null, isHydrating: false });
    router.push("/");
  }, [router]);

  return <AuthContext.Provider value={{ ...state, setSession, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

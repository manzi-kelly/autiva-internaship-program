import React, { createContext, useContext, useMemo, useState } from "react";
import type { AuthTokens, User } from "../types";

type AuthState = {
  user: User | null;
  tokens: AuthTokens | null;
};

type AuthCtx = AuthState & {
  setAuth: (payload: { user: User; tokens: AuthTokens }) => void;
  clearAuth: () => void;
};

const AuthContext = createContext<AuthCtx | null>(null);

const LS_KEY = "autiva_auth_v1";

function readLS(): AuthState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { user: null, tokens: null };
    return JSON.parse(raw) as AuthState;
  } catch {
    return { user: null, tokens: null };
  }
}

function writeLS(state: AuthState) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => readLS());

  const value = useMemo<AuthCtx>(() => {
    return {
      ...state,
      setAuth: ({ user, tokens }) => {
        const next = { user, tokens };
        setState(next);
        writeLS(next);
      },
      clearAuth: () => {
        const next = { user: null, tokens: null };
        setState(next);
        writeLS(next);
      },
    };
  }, [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
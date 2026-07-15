import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AuthUser, logout } from "../services/api/authService";
import { clearAuthTokens, setAuthFailureHandler, setAuthTokens } from "../services/api/tokenStore";
import { clearSessionStorage, loadSession, saveSession } from "./sessionStorage";

type SessionPayload = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

type AuthContextValue = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  themeMode: "light" | "dark";
  signIn: (payload: SessionPayload) => void;
  signOut: () => void;
  updateUser: (user: AuthUser) => void;
  toggleThemeMode: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type Props = {
  children: ReactNode;
};

export function AuthProvider({ children }: Props) {
  const queryClient = useQueryClient();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const session = await loadSession();

      if (!isMounted) return;

      if (session) {
        setAccessToken(session.accessToken);
        setRefreshToken(session.refreshToken);
        setUser(session.user);
        setAuthTokens({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken
        });
      }

      setIsHydrating(false);
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    function forceSignOut() {
      queryClient.clear();
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      clearAuthTokens();
      void clearSessionStorage();
    }

    setAuthFailureHandler(forceSignOut);
    return () => {
      setAuthFailureHandler(null);
    };
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      refreshToken,
      user,
      isAuthenticated: Boolean(accessToken),
      isHydrating,
      themeMode,
      signIn: (payload) => {
        setAccessToken(payload.accessToken);
        setRefreshToken(payload.refreshToken);
        setUser(payload.user);
        setAuthTokens({
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken
        });
        void saveSession(payload);
      },
      signOut: () => {
        queryClient.clear();
        const tokenToRevoke = refreshToken;
        if (tokenToRevoke) {
          // Best-effort server-side revoke; ignore failures (e.g. older backend without /auth/logout).
          void logout(tokenToRevoke).catch(() => undefined);
        }
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
        clearAuthTokens();
        void clearSessionStorage();
      },
      updateUser: (nextUser) => {
        setUser(nextUser);
        if (accessToken && refreshToken) {
          void saveSession({ accessToken, refreshToken, user: nextUser });
        }
      },
      toggleThemeMode: () => {
        setThemeMode((current) => (current === "light" ? "dark" : "light"));
      },
    }),
    [accessToken, isHydrating, queryClient, refreshToken, themeMode, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

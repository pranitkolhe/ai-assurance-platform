import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "../models/user.model";
import {
  syncAssessmentsFromApi,
  syncAssetsFromApi,
} from "../services/assessmentService";

interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function clearStoredAuth(): void {
  localStorage.removeItem("assure_user");
  localStorage.removeItem("assure_token");
}

// Sync fix (2026-10-27): logout must clear ALL assure_* data, not
// just assessments/assets. Otherwise a previous user's stored
// results, risk decisions and reference assignments leak into the
// next user's session and make old assessments reappear.
function clearAllAssureData(): void {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("assure_")) keys.push(key);
  }
  keys.forEach((key) => localStorage.removeItem(key));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("assure_user");
    return savedUser ? (JSON.parse(savedUser) as User) : null;
  });

  // Validate the stored token on load. Previously the UI trusted
  // assure_user in localStorage even when the token was expired or
  // signed with a different SECRET_KEY, so pages loaded but every
  // API call returned 401. Now an invalid token logs the user out
  // once, instead of spamming 401s from every background sync.
  useEffect(() => {
    const token = localStorage.getItem("assure_token");
    if (!token) {
      if (user) {
        setUser(null);
        clearStoredAuth();
      }
      return;
    }
    fetch("/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (!res.ok) {
        setUser(null);
        clearStoredAuth();
      }
    }).catch(() => {
      // Backend offline: keep the stored user, do not log out on a
      // network error alone. A 401 above is what logs the user out.
    });
    // Only run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data: TokenResponse = await res.json();
        setUser(data.user);
        localStorage.setItem("assure_user", JSON.stringify(data.user));
        localStorage.setItem("assure_token", data.access_token);
        // Sync fix: the new user's data must come from the backend
        // immediately, not from whatever was left in localStorage.
        // A failure here is not a login failure — the pages sync
        // again on mount — so it is swallowed here.
        await Promise.all([
          syncAssessmentsFromApi().catch(() => undefined),
          syncAssetsFromApi().catch(() => undefined),
        ]);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    clearAllAssureData();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

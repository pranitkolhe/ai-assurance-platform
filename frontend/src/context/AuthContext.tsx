import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "../models/user.model";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("assure_user");
    return savedUser ? (JSON.parse(savedUser) as User) : null;
  });

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
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("assure_user");
    localStorage.removeItem("assure_token");
    localStorage.removeItem("assure_assessments");
    localStorage.removeItem("assure_assets");
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

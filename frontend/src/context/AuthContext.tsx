import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { User, UserRole } from "../models/user.model";
import users from "../data/users.json";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("assure_user");

    return savedUser ? (JSON.parse(savedUser) as User) : null;
  });

  const login = (email: string, password: string) => {
    const foundUser = users.find(
      (item) => item.email === email && item.password === password,
    );

    if (!foundUser) {
      return false;
    }

    const authenticatedUser: User = {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      password: foundUser.password,
      role: foundUser.role as UserRole,
      status: foundUser.status as User["status"],
    };

    setUser(authenticatedUser);

    localStorage.setItem("assure_user", JSON.stringify(authenticatedUser));

    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("assure_user");
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

import { createContext, useCallback, useContext, useState } from "react";

const AuthContext = createContext(null);

function withoutToken(user) {
  if (!user) return null;
  const { token: _token, ...safeUser } = user;
  return safeUser;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  const login = useCallback((newToken, nextUser = null) => {
    const safeUser = withoutToken(nextUser);
    localStorage.setItem("token", newToken);
    if (safeUser) {
      localStorage.setItem("user", JSON.stringify(safeUser));
    } else {
      localStorage.removeItem("user");
    }
    setToken(newToken);
    setUser(safeUser);
  }, []);

  const updateUser = useCallback((nextUser, nextToken = null) => {
    const safeUser = withoutToken(nextUser);
    if (!safeUser) return;
    if (nextToken) {
      localStorage.setItem("token", nextToken);
      setToken(nextToken);
    }
    localStorage.setItem("user", JSON.stringify(safeUser));
    setUser(safeUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext value={{ token, user, isAuthenticated: Boolean(token), login, logout, updateUser }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

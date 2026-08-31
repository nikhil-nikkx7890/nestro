"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "@/services/auth.service";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Starts true — on first page load, a valid auth cookie may already be
  // sitting in the browser from an earlier session, but React doesn't know
  // that yet. loading stays true until the /me check below resolves, so
  // consumers (like the admin layout guard) can tell "still checking" apart
  // from "definitely not logged in" and avoid a flash-redirect to /login
  // for a user who actually is logged in.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService
      .me()
      .then((res) => setUser(res.data))
      .catch(() => setUser(null)) // no cookie, or an expired/invalid one — either way, not logged in
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    setUser(res.data);
    return res.data;
  };

  // Register also sets the auth cookie server-side (same as login) and
  // returns the created user, so this mirrors login() exactly rather than
  // requiring a separate login call right after registering.
  const register = async (data) => {
    const res = await authService.register(data);
    setUser(res.data);
    return res.data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Convenience hook — every consumer calls useAuth() instead of
// useContext(AuthContext) directly. The undefined check catches the one
// real mistake this could produce: using useAuth() in a component that
// isn't actually wrapped in <AuthProvider>, with a clear error instead of
// a silent "user is always null."
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

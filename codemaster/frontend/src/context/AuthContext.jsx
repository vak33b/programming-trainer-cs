import { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, logout as apiLogout } from "../api/auth";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("access_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    const fetchMe = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data);
      } catch (e) {
        console.error("failed to fetch /auth/me", e);
        setUser(null);
      }
    };
    fetchMe();
  }, [token]);

  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      localStorage.setItem("access_token", data.access_token);
      setToken(data.access_token);
      return { success: true };
    } catch (error) {
      console.error("login error", error);
      return {
        success: false,
        message:
          error.response?.data?.detail || "Login failed. Check your credentials.",
      };
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    apiLogout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, user, loading, login: handleLogin, logout: handleLogout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

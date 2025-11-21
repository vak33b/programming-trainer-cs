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
    let cancelled = false;
    const fetchMe = async () => {
      try {
        // Небольшая задержка, чтобы убедиться, что токен установлен
        await new Promise(resolve => setTimeout(resolve, 100));
        if (cancelled) return;
        
        // Используем увеличенный таймаут для этого запроса
        const res = await api.get("/auth/me", {
          timeout: 30000, // 30 секунд
        });
        if (!cancelled) {
          setUser(res.data);
        }
      } catch (e) {
        console.error("failed to fetch /auth/me", e);
        if (!cancelled) {
          // Не удаляем пользователя сразу при ошибке таймаута
          // Только если это ошибка авторизации
          if (e.response?.status === 401 || e.response?.status === 403) {
            setUser(null);
            localStorage.removeItem("access_token");
            setToken(null);
          } else if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
            // При таймауте не удаляем токен, просто не устанавливаем пользователя
            console.warn("Timeout fetching user, will retry later");
          }
        }
      }
    };
    fetchMe();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      // Используем увеличенный таймаут для запроса логина
      const data = await apiLogin(email, password);
      
      // Проверяем наличие токена в ответе
      // Ответ может быть в формате { access_token: "...", token_type: "bearer" }
      const token = data?.access_token;
      if (!token || typeof token !== 'string') {
        console.error("Invalid token in response:", data);
        return {
          success: false,
          message: "Неверный ответ от сервера: отсутствует токен",
        };
      }
      
      // Устанавливаем токен в localStorage и state
      localStorage.setItem("access_token", token);
      setToken(token);
      
      // useEffect автоматически загрузит пользователя
      // Не ждем загрузки пользователя, чтобы не блокировать логин
      
      return { success: true };
    } catch (error) {
      console.error("login error", error);
      
      // Проверяем, не является ли это ошибкой таймаута
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return {
          success: false,
          message: "Превышено время ожидания ответа от сервера. Попробуйте еще раз.",
        };
      }
      
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      const errorMessage = 
        error.response?.data?.detail || 
        error.response?.data?.message ||
        error.message || 
        "Ошибка авторизации. Проверьте правильность данных.";
      return {
        success: false,
        message: errorMessage,
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

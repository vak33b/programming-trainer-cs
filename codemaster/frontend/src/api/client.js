import axios from "axios";

export const API_BASE_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 секунд таймаут (увеличено для медленных запросов)
});

api.interceptors.request.use((config) => {
  // Не добавляем токен для запросов авторизации
  if (config.url && !config.url.includes("/auth/login") && !config.url.includes("/auth/register")) {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  
  // Увеличиваем таймаут для запросов авторизации и получения пользователя
  if (config.url && (config.url.includes("/auth/") || config.url.includes("/auth/me"))) {
    config.timeout = 30000; // 30 секунд для авторизации
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Если токен невалидный, удаляем его (но не для запросов логина/регистрации)
    if (error.response?.status === 401 && 
        error.config?.url && 
        !error.config.url.includes("/auth/login") && 
        !error.config.url.includes("/auth/register")) {
      localStorage.removeItem("access_token");
    }
    return Promise.reject(error);
  }
);

export default api;

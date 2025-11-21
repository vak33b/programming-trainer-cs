import api from "./client";

export async function login(email, password) {
  const params = new URLSearchParams();
  params.append("username", email);
  params.append("password", password);

  const response = await api.post("/auth/login", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    timeout: 30000, // 30 секунд для запроса логина
  });
  return response.data;
}

export function logout() {
  localStorage.removeItem("access_token");
}

// НОВОЕ: регистрация
export async function registerUser({ email, password, full_name, is_teacher }) {
  const payload = {
    email,
    password,
    full_name,
    is_teacher,
  };
  const response = await api.post("/auth/register", payload);
  return response.data;
}

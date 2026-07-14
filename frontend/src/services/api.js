import axios from "axios";

// Backend REST API için merkezi axios instance'ı.
// baseURL sonuna /api dahildir; çağrılar "/auth/login" gibi kısa yollarla yapılır.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — localStorage'da JWT varsa her isteğe
// Authorization: Bearer <token> header'ını otomatik ekler.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

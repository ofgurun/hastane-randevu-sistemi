import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../services/api";

// Global kimlik doğrulama durumu.
// persist: token + user + isAuthenticated localStorage'da ("auth-storage") kalıcı.
// Ayrıca token düz "token" anahtarına da yazılır → api.js interceptor'ı bunu okur.
const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Giriş — başarılıysa true, aksi halde false döner (sayfa yönlendirmesi için).
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post("/auth/login", { email, password });
          const { user, token } = res.data.data;
          localStorage.setItem("token", token);
          set({ user, token, isAuthenticated: true, isLoading: false, error: null });
          return true;
        } catch (err) {
          const message = err.response?.data?.message || "Giriş başarısız. Lütfen tekrar deneyin.";
          set({ isLoading: false, error: message, isAuthenticated: false });
          return false;
        }
      },

      // Kayıt — başarılıysa otomatik oturum açar (backend token döner).
      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post("/auth/register", { name, email, password });
          const { user, token } = res.data.data;
          localStorage.setItem("token", token);
          set({ user, token, isAuthenticated: true, isLoading: false, error: null });
          return true;
        } catch (err) {
          const message = err.response?.data?.message || "Kayıt başarısız. Lütfen tekrar deneyin.";
          set({ isLoading: false, error: message, isAuthenticated: false });
          return false;
        }
      },

      // Profil güncellemesi sonrası store'daki kullanıcıyı tazeler (navbar adı vb.).
      updateUser: (patch) =>
        set((state) => ({ user: state.user ? { ...state.user, ...patch } : state.user })),

      // Çıkış — durumu ve token'ı temizler.
      logout: () => {
        localStorage.removeItem("token");
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      // Hata mesajını temizle (sayfalar arası geçişte kullanılır).
      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;

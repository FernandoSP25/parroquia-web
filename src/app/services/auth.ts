
import api from "./api"; // Importamos tu instancia configurada de Axios
import { LoginRequest, LoginResponse } from "../types";

export const authService = {
  // Función para iniciar sesión
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    // Llamamos al endpoint que creaste en Python: POST /auth/login
    const response = await api.post<LoginResponse>("/auth/login", credentials);
    return response.data;
  },

  // Función para cerrar sesión (simplemente borra el token)
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  },
};
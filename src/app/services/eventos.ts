// src/app/services/eventos.ts
import api from "./api";
import { Evento } from "@/app/types";

export const eventoService = {
  // Obtener todos (podemos filtrar por grupo o si son futuros)
  getAll: async (grupoId?: string, soloFuturos: boolean = true): Promise<Evento[]> => {
    const params = new URLSearchParams();
    if (grupoId) params.append("grupo_id", grupoId);
    if (soloFuturos) params.append("solo_futuros", "true");

    const { data } = await api.get<Evento[]>("/eventos/", { params });
    return data;
  },

  // Crear un evento nuevo
  create: async (payload: Partial<Evento>) => {
    const { data } = await api.post("/eventos/", payload);
    return data;
  },

  // Desactivar (Eliminar lógicamente)
  delete: async (id: string) => {
    const { data } = await api.delete(`/eventos/${id}`);
    return data;
  }
};
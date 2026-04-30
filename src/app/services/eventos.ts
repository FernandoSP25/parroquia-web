import api from "./api";
import { Evento } from "@/app/types";

export const eventoService = {
  // Para los eventos próximos (Tablero Principal)
  getProximos: async (grupoId?: string, anioId?: string): Promise<Evento[]> => {
    const params = new URLSearchParams();
    if (grupoId) params.append("grupo_id", grupoId);
    if (anioId) params.append("anio_id", anioId);

    const { data } = await api.get<Evento[]>("/eventos/proximos", { params });
    return data;
  },

  // Para la pantalla de Historial (Cuando seleccionan una Tarjeta)
  getHistorialPorTipo: async (tipoId: number, grupoId?: string, anioId?: string): Promise<Evento[]> => {
    const params = new URLSearchParams();
    params.append("tipo_id", tipoId.toString());
    if (grupoId) params.append("grupo_id", grupoId);
    if (anioId) params.append("anio_id", anioId);

    const { data } = await api.get<Evento[]>("/eventos/historial", { params });
    return data;
  },

  create: async (payload: Partial<Evento>) => {
    const { data } = await api.post("/eventos/", payload);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/eventos/${id}`);
    return data;
  }
};
import api from "./api";
import { MatrizResponse, AsistenciaMasivaPayload } from "@/app/types";
// Definimos el tipo del payload para que TypeScript te ayude

export const asistenciaService = {
  // 1. Obtener la lista de alumnos para un evento (El Checklist)
  getChecklist: async (eventoId: string) => {
    const { data } = await api.get(`/asistencias/evento/${eventoId}/checklist`);
    return data;
  },

  // 2. Guardar toda la asistencia de golpe
  guardarMasiva: async (eventoId: string, payload: AsistenciaMasivaPayload) => {
    const { data } = await api.put(`/asistencias/evento/${eventoId}/masiva`, payload);
    return data;
  },

  getMatrizConfirmantes: async (tipoId: number, grupoId?: string) => {
    const url = grupoId ? `/asistencias/matriz/confirmantes/${tipoId}?grupo_id=${grupoId}` : `/asistencias/matriz/confirmantes/${tipoId}`;
    const { data } = await api.get(url);
    return data;
  },

  getMatrizCatequistas: async (tipoId: number ,grupoId?: string): Promise<MatrizResponse> => {
    const url = grupoId ? `/asistencias/matriz/catequistas/${tipoId}?grupo_id=${grupoId}` : `/asistencias/matriz/confirmantes/${tipoId}`;
    const { data } = await api.get(url);
    return data;
  }
};
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

  getMatrizConfirmantes: async (tipoId: number | string): Promise<MatrizResponse> => {
    const { data } = await api.get<MatrizResponse>(`/asistencias/matriz/confirmantes/${tipoId}`);
    return data;
  },

  getMatrizCatequistas: async (tipoId: number | string): Promise<MatrizResponse> => {
    const { data } = await api.get<MatrizResponse>(`/asistencias/matriz/catequistas/${tipoId}`);
    return data;
  }
};
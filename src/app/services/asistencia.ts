import api from "./api";

// Definimos el tipo del payload para que TypeScript te ayude
export interface AsistenciaUpdate {
  usuario_id: string;
  estado_id: number;
  observaciones: string | null;
}

export interface AsistenciaMasivaPayload {
  asistencias: AsistenciaUpdate[];
}

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
  }
};
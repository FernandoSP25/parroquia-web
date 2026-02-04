import api from "./api"; // Tu instancia de Axios
import { InscripcionData } from "@/app/types"; // Asegúrate de que este tipo exista o defínelo aquí

export interface InscripcionResponse extends InscripcionData {
  id: number;
  estado: string;
  fecha_registro: string;
}

export const inscripcionService = {
  
  // Función para registrar (POST)
  registrar: async (data: InscripcionData): Promise<InscripcionResponse> => {
    // 1. Usamos api.post en lugar de fetch
    // 2. Axios convierte 'data' a JSON automáticamente
    // 3. Tipamos la respuesta con <InscripcionResponse>
    const { data: result } = await api.post<InscripcionResponse>("/inscripciones/", data);
    
    return result;
  },

  // (Opcional) Método para listar (útil para el panel de admin luego)
  getAll: async () => {
    const { data } = await api.get<InscripcionResponse[]>("/inscripciones/");
    return data;
  },

  // (Opcional) Método para cambiar estado (Aprobar/Rechazar)
  updateEstado: async (id: number, estado: string) => {
    const { data } = await api.put<InscripcionResponse>(`/inscripciones/${id}`, { estado });
    return data;
  }
};
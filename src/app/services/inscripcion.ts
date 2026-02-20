import api from "./api"; // Tu instancia de Axios
import { InscripcionData, Inscripcion } from "@/app/types"; // Asegúrate de que este tipo exista o defínelo aquí

export interface InscripcionResponse extends InscripcionData {
  id: number;
  estado: string;
  fecha_registro: string;
}

export const inscripcionService = {
  
  // Función para registrar (POST)
  registrar: async (data: InscripcionData): Promise<InscripcionResponse> => {
    const { data: result } = await api.post<InscripcionResponse>("/inscripciones/", data);
    
    return result;
  },

  getById: async (id: number): Promise<Inscripcion> => {
    const { data } = await api.get<Inscripcion>(`/inscripciones/${id}`);
    return data;
  },

  // (Opcional) Método para listar (útil para el panel de admin luego)
  getAll: async () => {
    const { data } = await api.get<Inscripcion[]>("/inscripciones/");
    return data;
  },

  // (Opcional) Método para cambiar estado (Aprobar/Rechazar)
  updateEstado: async (id: number, estado: string) => {
    const { data } = await api.put<Inscripcion>(`/inscripciones/${id}`, { estado });
    return data;
  }
};
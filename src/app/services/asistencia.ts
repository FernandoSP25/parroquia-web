import api from "./api"; 
import { AsistenciaResponse } from "@/app/types";

export const asistenciaService = {
  registrar: async (codigoLeido: string): Promise<AsistenciaResponse> => {
    const { data } = await api.post<AsistenciaResponse>("/asistencias/qr", { 
      codigo_leido: codigoLeido 
    });
    return data;
  }
};
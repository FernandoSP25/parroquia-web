// src/app/services/qr.ts
import api from "./api";
import { GenerarQrRequest, QrResponse } from "@/app/types";

export const qrService = {
  // Generar o recuperar QR activo
  generar: async (payload: GenerarQrRequest): Promise<QrResponse> => {
    // Asegúrate de que la ruta coincida con el APIRouter de tu FastAPI
    const { data } = await api.post<QrResponse>("/qr/generar", payload);
    return data;
  }
};
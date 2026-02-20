// src/app/services/grupos.ts
import api from "./api"; // Tu instancia de axios configurada
import { TableroData, MoverConfirmanteDTO } from "@/app/types";

export const grupoService = {
  
  // 1. Obtener el tablero completo
  getTablero: async (anioId: string): Promise<TableroData> => {
    const { data } = await api.get<TableroData>(`/grupos/tablero/${anioId}`);
    return data;
  },

  // 2. Mover una tarjeta (Drag & Drop)
  moverConfirmante: async (payload: MoverConfirmanteDTO) => {
    const { data } = await api.patch("/grupos/mover-confirmante", payload);
    return data;
  },

  moverCatequista: async (payload: { catequista_id: string; grupo_id: string | null }) => {
    const { data } = await api.patch("/grupos/mover-catequista", payload);
    return data;
  },

  // (Opcional) Crear grupo si lo necesitas después
  create: async (payload: { nombre: string; anio_id: string }) => {
    const { data } = await api.post("/grupos/", payload);
    return data;
  }
};
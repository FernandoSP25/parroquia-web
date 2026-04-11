import api from "./api";
import { TipoEvento } from "@/app/types"; // Asegúrate de agregar el tipo en types/index.ts

export const tipoEventoService = {
  getAll: async (): Promise<TipoEvento[]> => {
    const { data } = await api.get<TipoEvento[]>("/tipos-evento/");
    return data;
  }
};
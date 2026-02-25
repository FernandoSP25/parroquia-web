// src/app/services/anios.ts
import api from "./api"; // Tu instancia de axios configurada
import { AnioCatequetico } from "@/app/types";

export const anioService = {
// Obtener todos los años (por defecto solo los activos)
getAll: async (soloActivos: boolean = true): Promise<AnioCatequetico[]> => {
    // Axios params maneja automáticamente el stringify de los booleanos
    const { data } = await api.get<AnioCatequetico[]>("/anios/", {
        params: { solo_activos: soloActivos }
    });
    return data;
    },

// Obtener un año específico por ID
getById: async (anioId: string): Promise<AnioCatequetico> => {
    const { data } = await api.get<AnioCatequetico>(`/anios/${anioId}`);
    return data;
    }
};
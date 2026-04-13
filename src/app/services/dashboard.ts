import api from "./api";
import { DashboardResponse,DashboardCatequistaResponse } from "@/app/types";

export const dashboardService = {
  getResumen: async (): Promise<DashboardResponse> => {
    // Apunta a la ruta que creamos en tu router de FastAPI
    const { data } = await api.get<DashboardResponse>("/dashboard/resumen");
    return data;
  },

getCatequistaResumen: async (): Promise<DashboardCatequistaResponse> => {
    const { data } = await api.get<DashboardCatequistaResponse>("/dashboard/catequista/resumen");
    return data;
  }
};
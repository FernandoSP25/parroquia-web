import api from "./api"; 
import { Usuario, CreateConfirmanteDTO, CreateCatequistaDTO, CreateAdminDTO,UpdateUsuarioDTO } from "@/app/types";

export const usuarioService = {
  // Listar usuarios
  getAll: async (): Promise<Usuario[]> => {
    const { data } = await api.get<Usuario[]>("/usuarios");
    return data;
  },

  createAdmin: async (data: CreateAdminDTO) => {
      // El backend espera: nombres, apellidos, dni, fecha, email_personal, celular, password
      const { data: res } = await api.post("/admins/", data);
      return res;
    },

  // ✅ Crear CATEQUISTA (Usa el endpoint nuevo)
  createCatequista: async (data: CreateCatequistaDTO) => {
    // El backend espera: nombres, apellidos, dni, fecha, email_personal, celular, password
    const { data: res } = await api.post("/catequistas/", data);
    return res;
  },

  // ✅ NUEVO: Crear CONFIRMANTE (Adaptado al Backend nuevo)
  createConfirmante: async (data: CreateConfirmanteDTO) => {
    // El backend espera: { nombres, apellidos, dni, fecha_nacimiento, email_personal, celular }
    const { data: res } = await api.post("/confirmantes/", data);
    return res;
  },

  update: async (id: string, data: UpdateUsuarioDTO) => {
    // PUT: Actualiza datos básicos + celular + password
    const { data: res } = await api.put(`/usuarios/${id}`, data);
    return res;
  },

// ✅ DESACTIVAR (Reemplaza al delete físico)
  desactivar: async (id: string) => {
    const { data } = await api.post(`/usuarios/${id}/desactivar`);
    return data;
  },

  // ✅ REACTIVAR
  reactivar: async (id: string) => {
    const { data } = await api.post(`/usuarios/${id}/reactivar`);
    return data;
  }
};
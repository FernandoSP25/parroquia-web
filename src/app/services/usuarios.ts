import api from "./api"; 
import { Usuario, CreateUsuarioDTO } from "@/app/types";

// Tipos adicionales para el Frontend
export interface CreateCatequistaDTO extends CreateUsuarioDTO {
  telefono?: string;
  biografia?: string;
  especialidad?: string;
}

export interface CreateConfirmanteDTO extends CreateUsuarioDTO {
  nombre_padre?: string;
  telefono_padre?: string;
  nombre_madre?: string;
  telefono_madre?: string;
  bautizado?: boolean;
  parroquia_bautismo?: string;
}

export const usuarioService = {
  // Listar usuarios (General)
  getAll: async () => {
    const { data } = await api.get<Usuario[]>("/usuarios");
    return data;
  },

  // Crear ADMIN o usuario base
  createAdmin: async (userData: CreateUsuarioDTO) => {
    // 1. Crear usuario
    const { data: user } = await api.post<Usuario>("/usuarios", userData);
    
    // 2. Buscar ID del rol ADMIN (Esto podrías optimizarlo hardcodeando el ID si no cambia)
    const { data: roles } = await api.get("/roles");
    const adminRol = roles.find((r: any) => r.nombre === "ADMIN");
    
    if (adminRol) {
      await api.post("/roles/asignar", { usuario_id: user.id, rol_id: adminRol.id });
    }
    return user;
  },

  // Crear CATEQUISTA (Usa el endpoint transaccional nuevo)
  createCatequista: async (data: CreateCatequistaDTO) => {
    const { data: res } = await api.post("/catequistas/", data);
    return res;
  },

  // Crear CONFIRMANTE (Usa el endpoint transaccional nuevo)
  createConfirmante: async (data: CreateConfirmanteDTO) => {
    const { data: res } = await api.post("/confirmantes/", data);
    return res;
  },

  update: async (id: string, data: Partial<Usuario>) => {
    const { data: res } = await api.put(`/usuarios/${id}`, data);
    return res;
  },

  delete: async (id: string) => {
    await api.delete(`/usuarios/${id}`);
  }
};
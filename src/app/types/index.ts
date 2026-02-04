// src/types/index.ts

// Lo que enviamos al hacer login
export interface LoginRequest {
  email: string;
  password: string;
}

// La información del usuario que viene dentro de la respuesta
export interface UserInfo {
  email: string;
  nombre: string;
  roles: string[]; // Ej: ["ADMIN", "CATEQUISTA"]
}

// Lo que responde el servidor (Token + Usuario)
export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserInfo;
}

// src/types/index.ts

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  dni: string;
  fecha_nacimiento?: string;
  foto_url?: string;
  activo: boolean;
  // Agregamos esto opcional por si el backend lo devuelve en el futuro
  roles?: string[]; 
}

// Lo que enviamos para CREAR (según tu schema UsuarioCreate)
export interface CreateUsuarioDTO {
  nombre: string;
  email: string;
  dni: string;
  password: string; // Obligatorio al crear
  activo: boolean;
}

// Lo que enviamos para EDITAR (según tu schema UsuarioUpdate)
export interface UpdateUsuarioDTO {
  nombre?: string;
  foto_url?: string;
  activo?: boolean;
}

export interface InscripcionData {
  nombres: string;
  apellidos: string;
  dni: string;
  fecha_nacimiento: string;
  direccion: string;
  email?: string; // Opcional
  celular_joven: string;
  nombre_apoderado: string;
  celular_apoderado: string;
}
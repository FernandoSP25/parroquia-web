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

export interface Usuario {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  email_personal?: string;
  dni: string;
  fecha_nacimiento?: string;
  foto_url?: string;
  activo: boolean;
  roles?: string[];
  created_at?: string;
  celular?: string;
}

// ... mantén tus otros tipos (CreateUsuarioDTO, etc.) igual ...

// Lo que enviamos para CREAR (según tu schema UsuarioCreate)
export interface CreateUsuarioDTO {
  nombre: string;
  email: string;
  dni: string;
  password: string; // Obligatorio al crear
  activo: boolean;
}

export interface UpdateUsuarioDTO {
  nombres?: string;
  apellidos?: string;
  dni?: string;
  email_personal?: string;
  celular?: string;  // El backend lo buscará en update_data y actualizará la tabla telefonos
  password?: string; // Opcional. Si viene, se encripta y guarda.
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

export interface Inscripcion {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  fecha_nacimiento: string;
  edad: number;
  direccion: string;
  email?: string;
  celular_joven: string;
  nombre_apoderado: string;
  celular_apoderado: string;
  estado: "PENDIENTE" | "CONTACTADO" | "APROBADO" | "RECHAZADO";
  fecha_registro: string;
  notas_internas?: string;
}


// DTO ESPECÍFICO PARA CONFIRMANTES (Lo que pide tu Backend)
export interface CreateConfirmanteDTO {
  nombres: string;
  apellidos: string;
  dni: string;
  fecha_nacimiento: string; // Formato YYYY-MM-DD
  email_personal: string;
  celular: string;
}

// --- DTO PARA CATEQUISTA (Manual: pide password) ---
export interface CreateCatequistaDTO {
  nombres: string;
  apellidos: string;
  dni: string;
  fecha_nacimiento: string;
  email_personal: string;
  celular: string;
  password: string; // ✅ Obligatorio para catequistas
}

export interface CreateUsuarioDTO {
  nombres: string;
  apellidos: string;
  email: string;
  dni: string;
  password: string;
  activo: boolean;
}

export interface CreateAdminDTO {
  nombres: string;
  apellidos: string;
  dni: string;
  fecha_nacimiento: string;
  email_personal: string;
  celular: string;
  password: string;
}

export interface CatequistaBadge {
  id: string;
  nombres: string;
  apellidos: string;
  foto_url?: string;
}

export interface ConfirmanteCard {
  id: string;
  tipo: 'CATEQUISTA' | 'CONFIRMANTE';
  nombres: string;
  apellidos: string;
  edad: number;
  foto_url?: string;
}

export interface GrupoColumna {
  id: string;
  nombre: string;
  capacidad_maxima: number;
  total_inscritos: number;
  catequistas: CatequistaBadge[];
  confirmantes: ConfirmanteCard[];
}

export interface TableroData {
  sin_asignar_confirmantes: ConfirmanteCard[];
  sin_asignar_catequistas: CatequistaBadge[];
  grupos: GrupoColumna[];
}

export interface MoverConfirmanteDTO {
  confirmante_id: string;
  grupo_id: string | null; // null significa "Sin Asignar"
}

// Añade esto al final de tu src/app/types/index.ts

export interface Evento {
  id: string;
  nombre: string;
  tipo_id?: number;
  descripcion?: string;
  obligatorio: boolean;
  fecha: string; // "YYYY-MM-DD"
  hora_inicio?: string; // "HH:MM:SS"
  hora_fin?: string;
  ubicacion?: string;
  grupo_id?: string;
  max_asistentes?: number;
  requiere_confirmacion: boolean;
  activo: boolean;
}

export interface GenerarQrRequest {
  evento_id: string;
  rol_generador: 'ADMIN' | 'CATEQUISTA';
}

export interface QrResponse {
  token_completo: string;
  expires_at: string;
}
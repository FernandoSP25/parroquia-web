"use client";

import { useState, useEffect } from "react";
import { 
  Search, Plus, Edit2, Trash2, X, Check, Loader2, 
  Shield, BookOpen, Users, User, Phone, FileText
} from "lucide-react";
import { usuarioService, CreateCatequistaDTO, CreateConfirmanteDTO } from "@/app/services/usuarios";
import { Usuario } from "@/app/types";
import Swal from 'sweetalert2';

const COLORS = {
  primary: "#5A431C",
  dark: "#211814",
  accent: "#C0B1A0",            
  bgLight: "#F9F8F6",
};

// Tipos de roles para la UI
type UserRoleType = 'ADMIN' | 'CATEQUISTA' | 'CONFIRMANTE';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estado del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  
  // Estado del Rol seleccionado en el modal
  const [selectedRole, setSelectedRole] = useState<UserRoleType>('CONFIRMANTE');

  // Formulario Base
  const [baseForm, setBaseForm] = useState({
    nombre: "", email: "", dni: "", password: "", activo: true
  });

  // Datos extra para Catequista
  const [catequistaData, setCatequistaData] = useState({
    telefono: "", biografia: "", especialidad: ""
  });

  // Datos extra para Confirmante
  const [confirmanteData, setConfirmanteData] = useState({
    nombre_padre: "", telefono_padre: "",
    nombre_madre: "", telefono_madre: "",
    bautizado: true, parroquia_bautismo: ""
  });

  // 1. CARGAR USUARIOS
  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const data = await usuarioService.getAll();
      setUsuarios(data);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsuarios(); }, []);

  // 2. MANEJAR APERTURA DE MODAL
  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedRole('CONFIRMANTE'); // Default
    setBaseForm({ nombre: "", email: "", dni: "", password: "", activo: true });
    // Limpiar otros estados si es necesario...
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: Usuario) => {
    setIsEditing(true);
    setSelectedUser(user);
    // En edición simple, solo cargamos datos base
    setBaseForm({
      nombre: user.nombre,
      email: user.email,
      dni: user.dni,
      password: "",
      activo: user.activo
    });
    setIsModalOpen(true);
  };

  // 3. ENVIAR FORMULARIO (LÓGICA PRINCIPAL)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && selectedUser) {
        // --- EDICIÓN (SOLO DATOS BASE) ---
        await usuarioService.update(selectedUser.id, {
          nombre: baseForm.nombre,
          activo: baseForm.activo
        });
        Swal.fire('Actualizado', 'Usuario actualizado.', 'success');
      } else {
        // --- CREACIÓN (TRANSACCIONAL SEGÚN ROL) ---
        if (selectedRole === 'ADMIN') {
            await usuarioService.createAdmin(baseForm);
        } 
        else if (selectedRole === 'CATEQUISTA') {
            const payload: CreateCatequistaDTO = { ...baseForm, ...catequistaData };
            await usuarioService.createCatequista(payload);
        } 
        else if (selectedRole === 'CONFIRMANTE') {
            const payload: CreateConfirmanteDTO = { ...baseForm, ...confirmanteData };
            await usuarioService.createConfirmante(payload);
        }
        Swal.fire('Creado', `${selectedRole} registrado con éxito con todo su perfil.`, 'success');
      }
      
      setIsModalOpen(false);
      fetchUsuarios();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail || 'Hubo un problema al guardar';
      Swal.fire('Error', msg, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Desactivar usuario?',
      text: "El usuario perderá acceso al sistema.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: COLORS.primary,
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, desactivar'
    });

    if (result.isConfirmed) {
      try {
        await usuarioService.delete(id);
        Swal.fire('Desactivado', 'Usuario desactivado correctamente.', 'success');
        fetchUsuarios();
      } catch (error) {
        Swal.fire('Error', 'No se pudo desactivar', 'error');
      }
    }
  };

  // Filtrado
  const filteredUsers = usuarios.filter(u => 
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.dni.includes(searchTerm)
  );

  return (
    <div className="p-8 min-h-screen font-sans" style={{ backgroundColor: COLORS.bgLight }}>
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#211814]">Gestión de Usuarios</h1>
          <p className="text-[#5A431C] opacity-70">Administra catequistas, confirmantes y administradores</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-[#211814] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-[#5A431C] transition-all flex items-center gap-2"
        >
          <Plus size={20} /> Registrar Nuevo
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#EBE5E0] mb-6 flex items-center gap-3">
        <Search className="text-[#C0B1A0]" />
        <input 
          type="text" 
          placeholder="Buscar por nombre o DNI..." 
          className="flex-1 outline-none text-[#211814]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EBE5E0] overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center text-[#5A431C]"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#F9F8F6] border-b border-[#EBE5E0]">
                <tr>
                  <th className="p-5 font-bold text-[#5A431C] text-sm uppercase">Usuario</th>
                  <th className="p-5 font-bold text-[#5A431C] text-sm uppercase">DNI / Email</th>
                  <th className="p-5 font-bold text-[#5A431C] text-sm uppercase text-center">Estado</th>
                  <th className="p-5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE5E0]">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#F9F8F6] transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#EBE5E0] flex items-center justify-center text-[#5A431C] font-bold">
                          {user.nombre.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-[#211814]">{user.nombre}</p>
                          {/* Aquí podrías mostrar badges de roles si tu backend los devuelve en el listado */}
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <p className="text-sm font-medium text-[#211814]">{user.email}</p>
                      <p className="text-xs text-gray-500">DNI: {user.dni}</p>
                    </td>
                    <td className="p-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {user.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="p-5 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenEdit(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(user.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================= */}
      {/* MODAL MAESTRO MULTI-ROL                 */}
      {/* ======================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 animate-in zoom-in duration-200">
            
            {/* Cabecera */}
            <div className="p-6 border-b border-[#EBE5E0] flex justify-between items-center bg-[#F9F8F6]">
              <h3 className="text-xl font-serif font-bold text-[#211814]">
                {isEditing ? "Editar Usuario Base" : "Registrar Nuevo Usuario"}
              </h3>
              <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-400 hover:text-red-500" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* SELECTOR DE ROL (Solo en creación) */}
              {!isEditing && (
                <div className="grid grid-cols-3 gap-3">
                    <button 
                        type="button"
                        onClick={() => setSelectedRole('CONFIRMANTE')}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${selectedRole === 'CONFIRMANTE' ? 'border-[#5A431C] bg-[#5A431C]/5 text-[#5A431C]' : 'border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                    >
                        <Users size={24} />
                        <span className="text-xs font-bold">Confirmante</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => setSelectedRole('CATEQUISTA')}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${selectedRole === 'CATEQUISTA' ? 'border-[#5A431C] bg-[#5A431C]/5 text-[#5A431C]' : 'border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                    >
                        <BookOpen size={24} />
                        <span className="text-xs font-bold">Catequista</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => setSelectedRole('ADMIN')}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${selectedRole === 'ADMIN' ? 'border-[#5A431C] bg-[#5A431C]/5 text-[#5A431C]' : 'border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                    >
                        <Shield size={24} />
                        <span className="text-xs font-bold">Admin</span>
                    </button>
                </div>
              )}

              {/* SECCIÓN 1: DATOS DE CUENTA (Común para todos) */}
              <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-1">Datos de Cuenta</h4>
                  <div>
                    <label className="block text-sm font-bold text-[#5A431C] mb-1">Nombre Completo</label>
                    <input type="text" required className="input-std" 
                        value={baseForm.nombre} onChange={e => setBaseForm({...baseForm, nombre: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-[#5A431C] mb-1">DNI</label>
                        <input type="text" required disabled={isEditing} className="input-std" 
                            value={baseForm.dni} onChange={e => setBaseForm({...baseForm, dni: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-[#5A431C] mb-1">Email</label>
                        <input type="email" required disabled={isEditing} className="input-std" 
                            value={baseForm.email} onChange={e => setBaseForm({...baseForm, email: e.target.value})} />
                    </div>
                  </div>
                  {!isEditing && (
                    <div>
                        <label className="block text-sm font-bold text-[#5A431C] mb-1">Contraseña</label>
                        <input type="password" required className="input-std" 
                            value={baseForm.password} onChange={e => setBaseForm({...baseForm, password: e.target.value})} />
                    </div>
                  )}
              </div>

              {/* SECCIÓN 2: CAMPOS ESPECÍFICOS (Solo en Creación) */}
              {!isEditing && selectedRole === 'CATEQUISTA' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-1">Perfil Catequista</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-[#5A431C] mb-1">Teléfono</label>
                            <input type="text" className="input-std" 
                                value={catequistaData.telefono} onChange={e => setCatequistaData({...catequistaData, telefono: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#5A431C] mb-1">Especialidad</label>
                            <input type="text" placeholder="Ej: Música, Biblia..." className="input-std" 
                                value={catequistaData.especialidad} onChange={e => setCatequistaData({...catequistaData, especialidad: e.target.value})} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#5A431C] mb-1">Biografía Corta</label>
                        <textarea rows={2} className="input-std" 
                            value={catequistaData.biografia} onChange={e => setCatequistaData({...catequistaData, biografia: e.target.value})} />
                      </div>
                  </div>
              )}

              {!isEditing && selectedRole === 'CONFIRMANTE' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-1">Datos Familiares</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <p className="text-xs font-bold text-gray-400 mb-2 uppercase">Información del Padre</p>
                            <input type="text" placeholder="Nombre del Padre" className="input-std mb-2 text-sm" 
                                value={confirmanteData.nombre_padre} onChange={e => setConfirmanteData({...confirmanteData, nombre_padre: e.target.value})} />
                            <input type="text" placeholder="Teléfono Padre" className="input-std text-sm" 
                                value={confirmanteData.telefono_padre} onChange={e => setConfirmanteData({...confirmanteData, telefono_padre: e.target.value})} />
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <p className="text-xs font-bold text-gray-400 mb-2 uppercase">Información de la Madre</p>
                            <input type="text" placeholder="Nombre de la Madre" className="input-std mb-2 text-sm" 
                                value={confirmanteData.nombre_madre} onChange={e => setConfirmanteData({...confirmanteData, nombre_madre: e.target.value})} />
                            <input type="text" placeholder="Teléfono Madre" className="input-std text-sm" 
                                value={confirmanteData.telefono_madre} onChange={e => setConfirmanteData({...confirmanteData, telefono_madre: e.target.value})} />
                        </div>
                      </div>
                      
                    
                  </div>
              )}

              {/* FOOTER */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all" style={{ backgroundColor: COLORS.primary }}>
                  {isEditing ? "Guardar Cambios" : "Crear Usuario Completo"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Estilos locales para inputs */}
      <style jsx>{`
        .input-std {
            width: 100%;
            padding: 0.5rem 1rem;
            border-radius: 0.75rem; /* rounded-xl */
            border: 1px solid #D1D5DB; /* border-gray-300 */
            outline: none;
            transition: all 0.2s;
            color: #211814;
        }
        .input-std:focus {
            border-color: #5A431C;
            box-shadow: 0 0 0 2px rgba(90, 67, 28, 0.2);
        }
        .input-std:disabled {
            background-color: #F3F4F6;
            cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
"use client";

import { useState, useEffect, use } from "react";
import { 
  Search, Plus, Edit2, Trash2, X, Loader2, 
  Shield, BookOpen, Users, User, Phone, Mail, Lock 
} from "lucide-react";
import { usuarioService } from "@/app/services/usuarios";
import { Usuario, CreateConfirmanteDTO, CreateCatequistaDTO, CreateAdminDTO, UpdateUsuarioDTO } from "@/app/types";
import Swal from 'sweetalert2';

const COLORS = {
  primary: "#5A431C", // Marrón Parroquial
  dark: "#211814",
  accent: "#C0B1A0",            
  bgLight: "#F9F8F6",
};

type UserRoleType = 'ADMIN' | 'CATEQUISTA' | 'CONFIRMANTE';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estado del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRoleType>('CONFIRMANTE');

  // --- FORMULARIOS ---
  
  // 1. Formulario LIMPIO para Confirmantes (Solo 6 campos)
  const [confirmanteForm, setConfirmanteForm] = useState<CreateConfirmanteDTO>({
      nombres: "", 
      apellidos: "", 
      dni: "", 
      fecha_nacimiento: "", 
      email_personal: "", 
      celular: ""
  });

  // 2. Formulario Genérico (Admin)
  const [editForm, setEditForm] = useState<UpdateUsuarioDTO>({
      nombres: "", apellidos: "", dni: "", email_personal: "", celular: "", password: ""
  });

  const [catequistaForm, setCatequistaForm] = useState<CreateCatequistaDTO>({
      nombres: "", apellidos: "", dni: "", 
      fecha_nacimiento: "", email_personal: "", celular: "",
      password: "" // <--- Nuevo campo importante
  });

  const [adminForm, setAdminForm] = useState<CreateAdminDTO>({
      nombres: "", apellidos: "", dni: "", 
      fecha_nacimiento: "", email_personal: "", celular: "", password: ""
  });

  // CARGAR USUARIOS
  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const data = await usuarioService.getAll();
      setUsuarios(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsuarios(); }, []);

  // MANEJAR APERTURA DE MODAL
  const handleOpenCreate = () => {
      setIsEditing(false);
      setSelectedRole('CONFIRMANTE');
      setConfirmanteForm({ nombres: "", apellidos: "", dni: "", fecha_nacimiento: "", email_personal: "", celular: "" });
      setCatequistaForm({ nombres: "", apellidos: "", dni: "", fecha_nacimiento: "", email_personal: "", celular: "", password: "" });
      setAdminForm({ nombres: "", apellidos: "", dni: "", fecha_nacimiento: "", email_personal: "", celular: "", password: "" });
      setIsModalOpen(true);
  };

  const handleOpenEdit = (user: Usuario) => {
    setIsEditing(true);
    setSelectedUser(user);
    
    // Precargamos los datos existentes en el formulario de edición
    setEditForm({
      nombres: user.nombres,
      apellidos: user.apellidos,
      dni: user.dni,
      email_personal: user.email_personal || "",
      celular: user.celular || "",
      password: "" // Siempre vacío por seguridad
    });
    
    setIsModalOpen(true);
  };

  // ENVIAR FORMULARIO
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && selectedUser) {
        // --- LÓGICA DE EDICIÓN ---
        // Filtramos campos vacíos para no enviar basura
        const payload: UpdateUsuarioDTO = {
            nombres: editForm.nombres,
            apellidos: editForm.apellidos,
            dni: editForm.dni,
            email_personal: editForm.email_personal,
            celular: editForm.celular,
        };
        // Solo enviamos password si el usuario escribió algo
        if (editForm.password && editForm.password.length > 0) {
            payload.password = editForm.password;
        }

        await usuarioService.update(selectedUser.id, payload);
        Swal.fire('Actualizado', 'Usuario actualizado correctamente', 'success');

      } else {
        // --- LÓGICA DE CREACIÓN ---
        if (selectedRole === 'CONFIRMANTE') {
          await usuarioService.createConfirmante(confirmanteForm);
          Swal.fire('Éxito', `Confirmante creado. Contraseña: DNI`, 'success');
        } 
        else if (selectedRole === 'CATEQUISTA') {
            await usuarioService.createCatequista(catequistaForm); 
            Swal.fire('Éxito', 'Catequista registrado.', 'success');
        }
        else if (selectedRole === 'ADMIN') {
            await usuarioService.createAdmin(adminForm); 
            Swal.fire('Éxito', 'Administrador registrado.', 'success');
        }
      }
      
      setIsModalOpen(false);
      fetchUsuarios();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail || 'Error al procesar la solicitud';
      Swal.fire('Error', String(msg), 'error');
    }
  };

  const handleDelete = async (id: string, activo: boolean) => {
    const accionInfinitivo = activo ? "desactivar" : "activar";
    const accionParticipio = activo ? "desactivado" : "activado";
    
    const result = await Swal.fire({ 
        title: `¿${accionInfinitivo.charAt(0).toUpperCase() + accionInfinitivo.slice(1)} usuario?`, 
        text: activo ? "El usuario perderá acceso al sistema." : "El usuario recuperará el acceso.", 
        icon: 'warning', 
        showCancelButton: true, 
        confirmButtonColor: activo ? '#d33' : COLORS.primary, 
        confirmButtonText: `Sí, ${accionInfinitivo}` 
    });

    if (result.isConfirmed) {
      try { 
          if(activo) {
            await usuarioService.desactivar(id); 
          } else {
            await usuarioService.reactivar(id); 
          }
        
          await fetchUsuarios(); 
          
          Swal.fire('Listo', `Usuario ${accionParticipio} correctamente`, 'success'); 
      } 
      catch (e) { 
          console.error(e);
          Swal.fire('Error', 'No se pudo realizar la acción', 'error'); 
      }
    }
  };


  const filteredUsers = usuarios.filter(u => (u.nombres + " " + u.apellidos).toLowerCase().includes(searchTerm.toLowerCase()) || u.dni.includes(searchTerm));

  const renderRoleBadge = (roles: string[] | undefined) => {
    if (!roles || roles.length === 0) return <span className="text-xs text-gray-400">Sin rol</span>;
    if (roles.includes("ADMIN")) return <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-bold border border-purple-200 flex items-center gap-1 w-fit"><Shield size={10}/> ADMIN</span>;
    if (roles.includes("CATEQUISTA")) return <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200 flex items-center gap-1 w-fit"><BookOpen size={10}/> CATEQUISTA</span>;
    return <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200 flex items-center gap-1 w-fit"><User size={10}/> CONFIRMANTE</span>;
  };

  return (
    <div className="p-2 min-h-screen font-sans" style={{ backgroundColor: COLORS.bgLight }}>
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div><h1 className="text-3xl font-serif font-bold text-[#211814]">Gestión de Usuarios</h1></div>
        <button onClick={handleOpenCreate} className="bg-[#5A431C] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-[#5A431C] transition-all flex items-center gap-2"><Plus size={20} /> Registrar Nuevo</button>
      </div>

      {/* BUSCADOR */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#EBE5E0] mb-6 flex items-center gap-3">
        <Search className="text-[#C0B1A0]" />
        <input aria-label="Buscar usuario" type="text" placeholder="Buscar..." className="flex-1 outline-none text-[#211814]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EBE5E0] overflow-hidden">
        {loading ? (<div className="p-10 flex justify-center text-[#5A431C]"><Loader2 className="animate-spin" /></div>) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F9F8F6] border-b border-[#EBE5E0]">
                <tr>
                  <th className="p-5 font-bold text-[#5A431C] text-xs uppercase tracking-wider">Usuario</th>
                  <th className="p-5 font-bold text-[#5A431C] text-xs uppercase tracking-wider">Contacto</th>
                  <th className="p-5 font-bold text-[#5A431C] text-xs uppercase tracking-wider">Email personal</th>
                  <th className="p-5 font-bold text-[#5A431C] text-xs uppercase tracking-wider text-center">Estado</th>
                  <th className="p-5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE5E0]">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#F9F8F6] transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">{user.nombres.charAt(0)}</div>
                        <div><p className="font-bold text-[#211814]">{user.nombres} {user.apellidos}</p><div className="mt-1">{renderRoleBadge(user.roles)}</div></div>
                      </div>
                    </td>
                    <td className="p-5 text-sm text-[#211814]">{user.email}<br/><span className="text-xs text-[#211814]">{user.dni}</span></td>
                    <td className="p-5 text-sm"><span className={` rounded-full text-xs font-bold ${user.email_personal ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{user.email_personal ? user.email_personal : "Sin Email"}</span></td>
                    <td className="p-5 text-center"><span className={`px-2 py-1 rounded-full text-xs font-bold ${user.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{user.activo ? "Activo" : "Inactivo"}</span></td>
                    <td className="p-5 text-right flex justify-end gap-2">
                        <button aria-label="Editar usuario" onClick={() => handleOpenEdit(user)} className="text-[#5A431C]"><Edit2 size={18} /></button>
                        <button 
                            aria-label={user.activo ? "Desactivar usuario" : "Activar usuario"} 
                            onClick={() => handleDelete(user.id, user.activo)}  
                            className={`p-2 transition-colors rounded-lg ${
                                user.activo 
                                ? "text-red-500 hover:bg-red-50" 
                                : "text-green-600 hover:bg-green-50" 
                            }`}
                        >
                            {user.activo ? <Trash2 size={18} /> : <Shield size={18} />} 
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CON DISEÑO MEJORADO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 animate-in zoom-in duration-200">
            
            <div className="p-6 border-b border-[#EBE5E0] flex justify-between items-center bg-[#F9F8F6]">
              <h3 className="text-xl font-serif font-bold text-[#211814]">{isEditing ? "Editar" : "Registrar"}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {!isEditing && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <button type="button" onClick={() => setSelectedRole('CONFIRMANTE')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedRole === 'CONFIRMANTE' ? 'bg-[#5A431C] text-white border-[#5A431C] shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                        <Users size={20} /><span className="text-xs font-bold">Confirmante</span>
                    </button>
                    <button type="button" onClick={() => setSelectedRole('CATEQUISTA')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedRole === 'CATEQUISTA' ? 'bg-[#5A431C] text-white border-[#5A431C] shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                        <BookOpen size={20} /><span className="text-xs font-bold">Catequista</span>
                    </button>
                    <button type="button" onClick={() => setSelectedRole('ADMIN')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedRole === 'ADMIN' ? 'bg-[#5A431C] text-white border-[#5A431C] shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                        <Shield size={20} /><span className="text-xs font-bold">Admin</span>
                    </button>
                </div>
              )}
              
              {/* SELECTOR DE ROL (Visualmente Mejorado) */}
              {isEditing && (
                  <div className="space-y-4 animate-in fade-in">
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800 text-sm mb-4">
                          Estás editando a <strong>{selectedUser?.nombres} {selectedUser?.apellidos}</strong>.
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div><label className="label-std">Nombres</label><input aria-label="Nombres" type="text" className="input-std" value={editForm.nombres} onChange={e => setEditForm({...editForm, nombres: e.target.value})}/></div>
                          <div><label className="label-std">Apellidos</label><input aria-label="Apellidos" type="text" className="input-std" value={editForm.apellidos} onChange={e => setEditForm({...editForm, apellidos: e.target.value})}/></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div><label className="label-std">DNI</label><input aria-label="DNI" type="text" className="input-std" value={editForm.dni} onChange={e => setEditForm({...editForm, dni: e.target.value})}/></div>
                          <div><label className="label-std">Email Personal</label><input aria-label="Email Personal" type="email" className="input-std" value={editForm.email_personal} onChange={e => setEditForm({...editForm, email_personal: e.target.value})}/></div>
                      </div>
                      <div>
                          <label className="label-std">Actualizar Celular (Opcional)</label>
                          <input aria-label="Actualizar Celular" type="tel" className="input-std" placeholder="999..." maxLength={9} value={editForm.celular} onChange={e => {const val=e.target.value.replace(/[^0-9]/g, ''); if(val.length<=9) setEditForm({...editForm, celular: val})}}/>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-200">
                          <label className="label-std flex items-center gap-1 text-yellow-800"><Lock size={14}/> Nueva Contraseña</label>
                          <input aria-label="Nueva Contraseña" type="text" className="input-std bg-white" placeholder="Dejar en blanco para mantener la actual" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})}/>
                      </div>
                  </div>
              )}

              {/* FORMULARIO EXACTO CONFIRMANTE */}
              {!isEditing && selectedRole === 'CONFIRMANTE' && (
                  <div className="space-y-4">
                      {/* Nombres y Apellidos */}
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="label-std">Nombres</label>
                            <input aria-label="Nombres" type="text" required className="input-std" 
                                value={confirmanteForm.nombres} onChange={e => setConfirmanteForm({...confirmanteForm, nombres: e.target.value})} />
                          </div>
                          <div>
                            <label className="label-std">Apellidos</label>
                            <input  aria-label="Apellidos" type="text" required className="input-std" 
                                value={confirmanteForm.apellidos} onChange={e => setConfirmanteForm({...confirmanteForm, apellidos: e.target.value})} />
                          </div>
                      </div>

                      {/* DNI y Fecha */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-std">DNI</label>
                            <input type="text" required className="input-std font-mono" maxLength={8}
                                value={confirmanteForm.dni} onChange={e => setConfirmanteForm({...confirmanteForm, dni: e.target.value})} />
                        </div>
                        <div>
                            <label className="label-std">Fecha Nacimiento</label>
                            <input aria-label="Fecha Nacimiento"type="date" required className="input-std" 
                                value={confirmanteForm.fecha_nacimiento} onChange={e => setConfirmanteForm({...confirmanteForm, fecha_nacimiento: e.target.value})} />
                        </div>
                      </div>

                      {/* Contacto */}
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="label-std flex items-center gap-1"><Mail size={14}/> Email Personal</label>
                            <input type="email" required className="input-std" placeholder="juan@gmail.com"
                                value={confirmanteForm.email_personal} onChange={e => setConfirmanteForm({...confirmanteForm, email_personal: e.target.value})} />
                          </div>
                          <div>
                            <label className="label-std flex items-center gap-1"><Phone size={14}/> Celular</label>
                            <input 
                                type="tel" 
                                required 
                                className="input-std" 
                                placeholder="999..."
                                maxLength={9} /* Límite visual */
                                value={confirmanteForm.celular} 
                                onChange={(e) => {
                                    // Filtro: Solo permite números (0-9)
                                    const soloNumeros = e.target.value.replace(/[^0-9]/g, '');
                                    
                                    // Solo actualiza si no pasa de 9 dígitos
                                    if (soloNumeros.length <= 9) {
                                        setConfirmanteForm({...confirmanteForm, celular: soloNumeros});
                                    }
                                }} 
                            />
                          </div>
                      </div>
                  </div>
              )}
              {!isEditing && (selectedRole === 'CATEQUISTA' || selectedRole === 'ADMIN') && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      {/* Datos Personales */}
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="label-std">Nombres</label>
                            <input aria-label="Nombres" type="text" required className="input-std" 
                                value={selectedRole === 'ADMIN' ? adminForm.nombres : catequistaForm.nombres} 
                                onChange={e => selectedRole === 'ADMIN' ? setAdminForm({...adminForm, nombres: e.target.value}) : setCatequistaForm({...catequistaForm, nombres: e.target.value})} />
                          </div>
                          <div>
                            <label className="label-std">Apellidos</label>
                            <input aria-label="Apellidos" type="text" required className="input-std" 
                                value={selectedRole === 'ADMIN' ? adminForm.apellidos : catequistaForm.apellidos} 
                                onChange={e => selectedRole === 'ADMIN' ? setAdminForm({...adminForm, apellidos: e.target.value}) : setCatequistaForm({...catequistaForm, apellidos: e.target.value})} />
                          </div>
                      </div>
                      
                      {/* DNI y Fecha */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-std">DNI</label>
                            <input aria-label="DNI" type="text" required className="input-std font-mono" maxLength={8} 
                                value={selectedRole === 'ADMIN' ? adminForm.dni : catequistaForm.dni} 
                                onChange={e => selectedRole === 'ADMIN' ? setAdminForm({...adminForm, dni: e.target.value}) : setCatequistaForm({...catequistaForm, dni: e.target.value})} />
                        </div>
                        <div>
                            <label className="label-std">Fecha Nacimiento</label>
                            <input aria-label="Fecha Nacimiento" type="date" required className="input-std" 
                                value={selectedRole === 'ADMIN' ? adminForm.fecha_nacimiento : catequistaForm.fecha_nacimiento} 
                                onChange={e => selectedRole === 'ADMIN' ? setAdminForm({...adminForm, fecha_nacimiento: e.target.value}) : setCatequistaForm({...catequistaForm, fecha_nacimiento: e.target.value})} />
                        </div>
                      </div>

                      {/* Contacto */}
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="label-std flex items-center gap-1"><Mail size={14}/> Email Personal</label>
                            <input aria-label="Email Personal" type="email" required className="input-std" 
                                value={selectedRole === 'ADMIN' ? adminForm.email_personal : catequistaForm.email_personal} 
                                onChange={e => selectedRole === 'ADMIN' ? setAdminForm({...adminForm, email_personal: e.target.value}) : setCatequistaForm({...catequistaForm, email_personal: e.target.value})} />
                          </div>
                          <div>
                            <label className="label-std flex items-center gap-1"><Phone size={14}/> Celular</label>
                            <input 
                                aria-label="Celular" 
                                type="tel" 
                                required 
                                className="input-std" 
                                maxLength={9} 
                                value={selectedRole === 'ADMIN' ? adminForm.celular : catequistaForm.celular} 
                                onChange={e => { 
                                    const val = e.target.value.replace(/[^0-9]/g, ''); 
                                    if (val.length <= 9) {
                                        if (selectedRole === 'ADMIN') {
                                            setAdminForm({ ...adminForm, celular: val });
                                        } else {
                                            setCatequistaForm({ ...catequistaForm, celular: val });
                                        }
                                    }
                                }} 
                            />
                          </div>
                      </div>

                      {/* PASSWORD MANUAL*/}
                      <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-200">
                          <label className="label-std flex items-center gap-1 text-yellow-800"><Lock size={14}/> Contraseña de Acceso</label>
                          <input type="text" required className="input-std bg-white" placeholder="Crea una contraseña segura..." 
                            value={selectedRole === 'ADMIN' ? adminForm.password : catequistaForm.password} 
                            onChange={e => selectedRole === 'ADMIN' ? setAdminForm({...adminForm, password: e.target.value}) : setCatequistaForm({...catequistaForm, password: e.target.value})} />
                          <p className="text-[10px] text-gray-500 mt-1">El usuario de login se generará automáticamente (nombre.apellido@...)</p>
                      </div>
                  </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancelar</button>
                <button type="submit" className="flex-1 py-3 font-bold text-white rounded-xl shadow-lg hover:shadow-xl transition-all" style={{ backgroundColor: COLORS.primary }}>
                  {isEditing ? "Guardar" : `Crear ${selectedRole}`}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .label-std { 
            display: block; 
            font-size: 0.85rem; 
            font-weight: 700; 
            color: #5A431C; 
            margin-bottom: 0.3rem; 
        }
        .input-std { 
            width: 100%; 
            padding: 0.75rem 1rem; /* Más espacio interno */
            border-radius: 0.75rem; 
            border: 1px solid #D1D5DB; 
            background-color: #F9FAFB; /* FONDO GRIS SUAVE (Corrección Visual) */
            outline: none; 
            transition: all 0.2s; 
            color: #111827; /* Texto Oscuro */
        }
        .input-std:focus { 
            border-color: #5A431C; 
            background-color: #FFFFFF; /* Fondo blanco al enfocar */
            box-shadow: 0 0 0 3px rgba(90, 67, 28, 0.1); 
        }
        .input-std::placeholder {
            color: #9CA3AF;
        }
      `}</style>
    </div>
  );
}
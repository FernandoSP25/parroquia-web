"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Key, 
  Save, 
  Camera,
  BookOpen,
  Loader2
} from "lucide-react";
import Swal from "sweetalert2";
import { usuarioService } from "@/app/services/usuarios";

const COLORS = {
  primary: "#5A431C",
  dark: "#211814",
  accent: "#C0B1A0",
  bgLight: "#F9F8F6",
};

export default function PerfilCatequistaPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados del formulario de datos personales
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
  });

  // Estados del formulario de contraseña
  const [passData, setPassData] = useState({
    actual: "",
    nueva: "",
    confirmar: "",
  });

  // Simulamos la carga de datos (Aquí llamarías a perfilService.getMe())
  // Cargamos los datos reales desde tu API
  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        // Llamamos al endpoint /usuarios/me que acabamos de crear
        const perfilReal = await usuarioService.getMe();
        
        setFormData({
          // Usamos los campos exactos que devuelve tu backend
          nombres: perfilReal.nombres || "",
          apellidos: perfilReal.apellidos || "",
          email: perfilReal.email || "",
          telefono: perfilReal.celular || "", // ¡Adiós al dato simulado!
        });
      } catch (error) {
        console.error("Error cargando mi perfil:", error);
        
        // Un "salvavidas" por si falla la red, usamos lo básico del context
        if (user) {
          setFormData(prev => ({
            ...prev,
            email: user.email || "",
            nombres: user.nombre?.split(" ")[0] || "",
          }));
        }
      }
    };

    if (user) {
      cargarPerfil();
    }
  }, [user]);

  const handleSaveDatos = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 2. Descomenta y usa el servicio real
      await usuarioService.updateMe({
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        celular: formData.telefono // Tu backend espera "celular"
      });
      
      Swal.fire({
        icon: "success",
        title: "¡Datos Actualizados!",
        text: "Tu información personal se guardó correctamente.",
        confirmButtonColor: COLORS.primary,
      });
    } catch (error) {
      Swal.fire("Error", "No se pudieron actualizar los datos.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.nueva !== passData.confirmar) {
      Swal.fire("Atención", "Las contraseñas nuevas no coinciden.", "warning");
      return;
    }
    
    setSaving(true);
    try {
      // 3. Usa el servicio real para la contraseña
      await usuarioService.changePassword(passData.nueva);
      
      Swal.fire({
        icon: "success",
        title: "Contraseña Cambiada",
        text: "Tu contraseña ha sido actualizada por seguridad.",
        confirmButtonColor: COLORS.primary,
      });
      setPassData({ actual: "", nueva: "", confirmar: "" });
    } catch (error) {
      Swal.fire("Error", "Hubo un problema al cambiar la contraseña.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 min-h-screen font-sans" style={{ backgroundColor: COLORS.bgLight }}>
      
      {/* CABECERA */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold tracking-tight" style={{ color: COLORS.dark }}>
          Mi Perfil
        </h1>
        <p className="text-[#5A431C] opacity-70 mt-1">
          Gestiona tu información personal y credenciales de acceso.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">
        
        {/* COLUMNA IZQUIERDA: Tarjeta de Identidad */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2rem] p-6 text-center shadow-sm border border-[#EBE5E0] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-24 bg-[#211814]">
              {/* Decoración curva de fondo */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#C0B1A0] via-transparent to-transparent"></div>
            </div>
            
            <div className="relative mt-8 mb-4 inline-block">
              <div className="w-28 h-28 mx-auto bg-gray-100 rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center relative group cursor-pointer">
                {/* Aquí iría la etiqueta <img src={user.foto} /> si tuvieras foto */}
                <User size={48} className="text-gray-400" />
                
                {/* Overlay para cambiar foto (Visual) */}
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white mb-1" />
                  <span className="text-[10px] text-white font-bold uppercase tracking-wider">Cambiar</span>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-serif font-bold text-[#211814]">
              {user?.nombre || "Cargando..."}
            </h2>
            <span className="inline-block px-3 py-1 bg-[#5A431C]/10 text-[#5A431C] text-xs font-bold uppercase tracking-widest rounded-lg mt-2 mb-6">
              Catequista
            </span>

            <div className="space-y-3 text-left border-t border-gray-100 pt-6">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-[#C0B1A0] shrink-0">
                  <Mail size={16} />
                </div>
                <div className="truncate">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Correo Electrónico</p>
                  <p className="font-medium text-[#211814] truncate">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <BookOpen size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Grupo Asignado</p>
                  <p className="font-bold text-[#211814]">San Pedro</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Formularios de Edición */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Formulario de Datos Personales */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-[#EBE5E0] overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-gray-100">
              <h3 className="text-xl font-serif font-bold text-[#211814] flex items-center gap-2">
                <User className="text-[#5A431C]" size={20} /> Datos Personales
              </h3>
              <p className="text-sm text-gray-500 mt-1">Actualiza tu información de contacto.</p>
            </div>
            
            <form onSubmit={handleSaveDatos} className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nombres</label>
                  <input 
                    type="text" 
                    value={formData.nombres}
                    onChange={(e) => setFormData({...formData, nombres: e.target.value})}
                    className="w-full bg-[#F9F8F6] border border-[#C0B1A0]/40 rounded-xl px-4 py-3 focus:outline-none focus:border-[#5A431C] focus:ring-1 focus:ring-[#5A431C] transition-all font-medium text-[#211814]" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Apellidos</label>
                  <input 
                    type="text" 
                    value={formData.apellidos}
                    onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                    className="w-full bg-[#F9F8F6] border border-[#C0B1A0]/40 rounded-xl px-4 py-3 focus:outline-none focus:border-[#5A431C] focus:ring-1 focus:ring-[#5A431C] transition-all font-medium text-[#211814]" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Teléfono Celular</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone size={16} className="text-gray-400" />
                    </div>
                    <input 
                      type="text" 
                      value={formData.telefono}
                      onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                      className="w-full bg-[#F9F8F6] border border-[#C0B1A0]/40 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-[#5A431C] focus:ring-1 focus:ring-[#5A431C] transition-all font-medium text-[#211814]" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Correo (Solo lectura)</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    disabled
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 font-medium cursor-not-allowed" 
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="bg-[#5A431C] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#4a3616] transition-colors flex items-center gap-2 shadow-md disabled:opacity-70"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>

          {/* Formulario de Seguridad (Contraseña) */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-[#EBE5E0] overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-gray-100">
              <h3 className="text-xl font-serif font-bold text-[#211814] flex items-center gap-2">
                <Shield className="text-[#ca8a04]" size={20} /> Seguridad
              </h3>
              <p className="text-sm text-gray-500 mt-1">Cambia tu contraseña regularmente para mantener tu cuenta segura.</p>
            </div>
            
            <form onSubmit={handleSavePassword} className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contraseña Actual</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Key size={16} className="text-gray-400" />
                    </div>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      value={passData.actual}
                      onChange={(e) => setPassData({...passData, actual: e.target.value})}
                      className="w-full bg-[#F9F8F6] border border-[#C0B1A0]/40 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-[#5A431C] focus:ring-1 focus:ring-[#5A431C] transition-all font-medium text-[#211814]" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nueva Contraseña</label>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={passData.nueva}
                    onChange={(e) => setPassData({...passData, nueva: e.target.value})}
                    className="w-full bg-[#F9F8F6] border border-[#C0B1A0]/40 rounded-xl px-4 py-3 focus:outline-none focus:border-[#5A431C] focus:ring-1 focus:ring-[#5A431C] transition-all font-medium text-[#211814]" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Confirmar Nueva</label>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={passData.confirmar}
                    onChange={(e) => setPassData({...passData, confirmar: e.target.value})}
                    className={`w-full bg-[#F9F8F6] border rounded-xl px-4 py-3 focus:outline-none focus:ring-1 transition-all font-medium text-[#211814]
                      ${passData.confirmar && passData.nueva !== passData.confirmar ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[#C0B1A0]/40 focus:border-[#5A431C] focus:ring-[#5A431C]'}`} 
                  />
                  {passData.confirmar && passData.nueva !== passData.confirmar && (
                    <p className="text-xs text-red-500 font-bold mt-2">Las contraseñas no coinciden</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={saving || (passData.nueva !== passData.confirmar) || !passData.actual || !passData.nueva}
                  className="bg-[#211814] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#5A431C] transition-colors flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Key size={18} />}
                  Actualizar Contraseña
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
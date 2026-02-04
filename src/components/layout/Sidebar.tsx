"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext"; 
import { 
  LayoutDashboard, Users, BookOpen, UserCheck, LogOut, Church, 
  Megaphone, ShieldAlert, CalendarDays, QrCode, FileText, UserCircle, Layers,
  ChevronLeft, ChevronRight // <--- Nuevos iconos para el botón de colapsar
} from "lucide-react";

const COLORS = {
  primary: "#5A431C",
  dark: "#211814",
  accent: "#C0B1A0",
  activeBg: "rgba(192, 177, 160, 0.15)",
};

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  
  // ESTADO PARA SABER SI ESTÁ ABIERTO O CERRADO
  const [isCollapsed, setIsCollapsed] = useState(false);

  const userRole = user?.roles[0] || "GUEST";

  // --- (Tu lógica de menús sigue igual) ---
  const getMenuItems = (role: string) => {
    switch (role) {
      case "ADMIN":
        return [
          { name: "Panel Control", href: "/admin", icon: <LayoutDashboard size={20} /> },
          { name: "Usuarios", href: "/admin/usuarios", icon: <Users size={20} /> },
          { name: "Grupos", href: "/admin/grupos", icon: <Layers size={20} /> },
          { name: "Eventos", href: "/admin/asistencias", icon: <CalendarDays size={20} /> },
          { name: "Anuncios", href: "/admin/anuncios", icon: <Megaphone size={20} /> },
          { name: "Auditoría", href: "/admin/auditoria", icon: <ShieldAlert size={20} /> },
        ];
      case "CATEQUISTA":
        return [
          { name: "Mi Panel", href: "/catequista", icon: <LayoutDashboard size={20} /> },
          { name: "Mi Perfil", href: "/catequista/perfil", icon: <UserCircle size={20} /> },
          { name: "Mis Grupos", href: "/catequista/grupos", icon: <Users size={20} /> },
          { name: "Asistencias", href: "/catequista/asistencia", icon: <QrCode size={20} /> },
          { name: "Notas", href: "/catequista/notas", icon: <FileText size={20} /> },
        ];
      case "CONFIRMANTE":
        return [
          { name: "Mi Progreso", href: "/confirmante", icon: <LayoutDashboard size={20} /> },
          { name: "Mis Datos", href: "/confirmante/perfil", icon: <UserCircle size={20} /> },
          { name: "Historial", href: "/confirmante/asistencias", icon: <CalendarDays size={20} /> },
          { name: "Notas", href: "/confirmante/notas", icon: <BookOpen size={20} /> },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems(userRole);

  return (
    // El ancho cambia dinámicamente: w-20 (cerrado) vs w-64 (abierto)
    <aside 
      className={`min-h-screen flex flex-col text-white transition-all duration-300 shadow-2xl z-50 relative 
                  ${isCollapsed ? "w-20" : "w-64"}`} 
      style={{ backgroundColor: COLORS.dark }}
    >
      
      {/* BOTÓN PARA COLAPSAR (Flotante en el borde) */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-9 w-6 h-6 bg-[#C0B1A0] rounded-full flex items-center justify-center text-[#211814] shadow-md hover:scale-110 transition-transform z-50 border border-[#211814]"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* 1. HEADER */}
      <div className={`h-20 flex items-center px-4 border-b border-[#ffffff10] overflow-hidden ${isCollapsed ? "justify-center" : "gap-3"}`}>
        <div className="min-w-[36px] h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold shadow-md"
             style={{ backgroundColor: COLORS.primary }}>
          <Church size={18} />
        </div>
        
        {/* Ocultamos el texto si está colapsado */}
        <div className={`transition-all duration-300 whitespace-nowrap ${isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100"}`}>
          <h1 className="font-serif font-bold tracking-wide text-sm">San Juan MV</h1>
          <span className="text-[10px] text-[#C0B1A0] uppercase tracking-[0.2em]">Sistema</span>
        </div>
      </div>

      {/* 2. TARJETA DE USUARIO (Versión Mini o Full) */}
      <div className="px-3 py-6">
        <div className={`p-2 rounded-xl border border-[#ffffff10] bg-[#ffffff05] flex items-center transition-all ${isCollapsed ? "justify-center" : "gap-3 px-3"}`}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-inner min-w-[32px]"
               style={{ backgroundColor: COLORS.accent, color: COLORS.dark }}>
            {user?.nombre?.substring(0, 2).toUpperCase() || "US"}
          </div>
          
          <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"}`}>
            <p className="font-bold text-xs truncate w-28">{user?.nombre?.split(" ")[0]}</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block uppercase bg-[#5A431C]">
              {userRole}
            </span>
          </div>
        </div>
      </div>

      {/* 3. NAVEGACIÓN */}
      <nav className="flex-1 px-3 space-y-2 mt-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {!isCollapsed && (
          <p className="px-2 text-[10px] text-[#C0B1A0] uppercase font-bold tracking-widest mb-2 opacity-60 transition-opacity">
            Menú
          </p>
        )}
        
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.name : ""} // Tooltip nativo cuando está cerrado
              className={`flex items-center px-3 py-3 rounded-xl transition-all duration-300 group relative 
                ${isCollapsed ? "justify-center" : "gap-3"}
                ${isActive ? "text-white shadow-lg bg-[rgba(192,177,160,0.15)]" : "text-[#C0B1A0] hover:text-white hover:bg-[#ffffff05]"}
              `}
            >
              <span className={`transition-transform duration-300 ${isActive && !isCollapsed ? "scale-110 text-[#e8dccd]" : "group-hover:scale-110"}`}>
                {item.icon}
              </span>
              
              <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"}`}>
                {item.name}
              </span>

              {/* Indicador activo (borde izquierdo) */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full" 
                     style={{ backgroundColor: COLORS.primary }}></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 4. FOOTER / LOGOUT */}
      <div className="p-3 border-t border-[#ffffff10] mt-auto">
        <button
          onClick={logout}
          className={`w-full flex items-center rounded-xl text-red-300 hover:text-red-100 hover:bg-red-900/20 transition-all py-3
            ${isCollapsed ? "justify-center" : "gap-3 px-3"}
          `}
        >
          <LogOut size={20} />
          <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"}`}>
            Salir
          </span>
        </button>
      </div>
    </aside>
  );
}
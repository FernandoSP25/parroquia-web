"use client";

import { useAuth } from "@/app/context/AuthContext"; 
import { 
  Users, 
  BookOpen, 
  UserCheck, 
  CalendarDays, 
  TrendingUp, 
  Activity, 
  Clock, 
  PlusCircle, 
  Megaphone,
  ShieldAlert 
} from "lucide-react";
import Link from "next/link";

// --- COLORES TIERRA SANTA ---
const COLORS = {
  primary: "#5A431C",
  dark: "#211814",
  accent: "#C0B1A0",
  bgLight: "#F9F8F6",
  success: "#166534", 
  warning: "#ca8a04", 
};

export default function AdminDashboard() {
  // Usamos el contexto para evitar errores de hidratación y renderizado
  const { user } = useAuth(); 

  return (
    <div className="p-8 min-h-screen font-sans" style={{ backgroundColor: COLORS.bgLight }}>
      
      {/* 1. CABECERA DE BIENVENIDA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight" style={{ color: COLORS.dark }}>
            Panel General
          </h1>
          <p className="text-[#5A431C] opacity-70 mt-1 flex items-center gap-2">
            ¡Bendecido día, <strong>{user?.nombre?.split(" ")[0] || "Administrador"}</strong>!
          </p>
        </div>
        
        {/* Botón de Acción Rápida Principal */}
        <Link href="/admin/anuncios" 
              className="bg-[#211814] text-white px-5 py-3 rounded-xl font-medium shadow-lg hover:bg-[#5A431C] transition-colors flex items-center gap-2">
          <Megaphone size={18} />
          <span>Publicar Anuncio</span>
        </Link>
      </div>

      {/* 2. KPIs (INDICADORES CLAVE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          title="Total Confirmantes" 
          value="142" 
          trend="+12 este mes"
          icon={<UserCheck size={24} />} 
          color="bg-green-100 text-green-800"
        />
        <StatCard 
          title="Catequistas Activos" 
          value="18" 
          trend="Plantilla completa"
          icon={<BookOpen size={24} />} 
          color="bg-amber-100 text-amber-800" 
        />
        <StatCard 
          title="Grupos Formados" 
          value="8" 
          trend="Año 2026"
          icon={<Users size={24} />} 
          color="bg-blue-100 text-blue-800" 
        />
        <StatCard 
          title="Próximo Evento" 
          value="Misa Dom." 
          trend="En 2 días"
          icon={<CalendarDays size={24} />} 
          color="bg-purple-100 text-purple-800" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 3. COLUMNA IZQUIERDA: Accesos y Alertas */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* ACCESOS RÁPIDOS */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#EBE5E0]">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
              <TrendingUp size={20} className="text-[#5A431C]" />
              Gestión Rápida
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <QuickAction 
                title="Registrar Nuevo Usuario" 
                desc="Crear Admin, Catequista o Alumno"
                href="/admin/usuarios"
                icon={<PlusCircle />}
              />
              <QuickAction 
                title="Programar Evento" 
                desc="Crear Misa o Clase y generar QR"
                href="/admin/asistencias"
                icon={<CalendarDays />}
              />
            </div>
          </div>

          {/* ESTADO DEL SISTEMA (ALERTAS) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#EBE5E0]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: COLORS.dark }}>
                <Activity size={20} className="text-[#5A431C]" />
                Alertas del Sistema
              </h3>
            </div>
            
            <div className="space-y-4">
              {/* Alerta 1 */}
              <div className="flex items-center gap-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="bg-amber-100 p-2 rounded-lg text-amber-700">
                  <Users size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#211814]">Confirmantes Sin Grupo</p>
                  <p className="text-xs text-gray-500">Hay 5 nuevos inscritos pendientes de asignación.</p>
                </div>
                <Link href="/admin/grupos" className="text-xs font-bold text-amber-700 hover:underline">
                  Asignar →
                </Link>
              </div>

              {/* Alerta 2 */}
              <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
                  <Megaphone size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#211814]">Anuncios Vencidos</p>
                  <p className="text-xs text-gray-500">2 anuncios se ocultarán automáticamente mañana.</p>
                </div>
                <Link href="/admin/anuncios" className="text-xs font-bold text-blue-700 hover:underline">
                  Revisar →
                </Link>
              </div>

              {/* Alerta 3 */}
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="bg-gray-200 p-2 rounded-lg text-gray-600">
                  <ShieldAlert size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#211814]">Integridad de Datos</p>
                  <p className="text-xs text-gray-500">Sistema funcionando correctamente. Backup: Hoy.</p>
                </div>
                <Link href="/admin/auditoria" className="text-xs font-bold text-gray-600 hover:underline">
                  Ver Log →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 4. COLUMNA DERECHA: Agenda */}
        <div className="bg-[#211814] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden h-fit">
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#5A431C] rounded-full blur-3xl opacity-20 -translate-y-10 translate-x-10"></div>
          
          <h3 className="text-lg font-serif font-bold mb-6 flex items-center gap-2 relative z-10">
            <Clock size={20} className="text-[#C0B1A0]" />
            Agenda Parroquial
          </h3>

          <div className="space-y-6 relative z-10">
            <EventCard 
              day="29" month="ENE" 
              title="Misa Dominical" 
              time="09:00 AM - Templo"
              status="Obligatorio"
            />
            <EventCard 
              day="30" month="ENE" 
              title="Reunión Catequistas" 
              time="06:00 PM - Salón 2"
              status="Interno"
            />
            <EventCard 
              day="02" month="FEB" 
              title="Inicio de Clases" 
              time="04:00 PM - General"
              status="Importante"
            />
          </div>

          <button className="w-full mt-8 py-3 rounded-xl border border-[#ffffff20] text-[#C0B1A0] text-sm hover:bg-[#ffffff05] transition-colors">
            Ver Calendario Completo
          </button>
        </div>

      </div>
    </div>
  );
}

// --- SUB-COMPONENTES ---

function StatCard({ title, value, trend, icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#EBE5E0] transition-transform hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wide opacity-50 bg-gray-100 px-2 py-1 rounded-md">
          {trend}
        </span>
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
        <h4 className="text-3xl font-bold text-[#211814]">{value}</h4>
      </div>
    </div>
  );
}

function QuickAction({ title, desc, href, icon }: any) {
  return (
    <Link href={href} className="flex items-start gap-4 p-4 rounded-xl border border-dashed border-gray-300 hover:border-[#5A431C] hover:bg-[#5A431C]/5 transition-all group">
      <div className="p-2 rounded-lg bg-gray-100 text-gray-500 group-hover:bg-[#5A431C] group-hover:text-white transition-colors">
        {icon}
      </div>
      <div>
        <h5 className="font-bold text-[#211814] text-sm group-hover:text-[#5A431C] transition-colors">{title}</h5>
        <p className="text-xs text-gray-400 mt-1">{desc}</p>
      </div>
    </Link>
  );
}

function EventCard({ day, month, title, time, status }: any) {
  return (
    <div className="flex gap-4 items-center">
      <div className="bg-[#ffffff10] rounded-xl p-3 text-center min-w-[60px]">
        <span className="block text-xs text-[#C0B1A0] font-bold uppercase">{month}</span>
        <span className="block text-xl font-bold text-white">{day}</span>
      </div>
      <div>
        <h5 className="font-bold text-white text-sm">{title}</h5>
        <p className="text-xs text-[#C0B1A0] mt-1 mb-1">{time}</p>
        <span className="text-[10px] bg-[#5A431C] px-2 py-0.5 rounded text-[#EBE5E0]">
          {status}
        </span>
      </div>
    </div>
  );
}
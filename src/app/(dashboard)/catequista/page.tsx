"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext"; 
import { dashboardService } from "@/app/services/dashboard";
import { 
  Users, 
  TrendingUp, 
  CalendarDays, 
  Clock, 
  AlertOctagon,
  ClipboardList,
  GraduationCap,
  BellRing,
  Loader2
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
  danger: "#dc2626"
};

export default function CatequistaDashboard() {
  const { user } = useAuth(); 
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const resumen = await dashboardService.getCatequistaResumen();
        setData(resumen);
      } catch (error) {
        console.error("Error cargando dashboard catequista:", error);
        // Fallback seguro si el servidor no responde
        setData({
          kpis: {
            grupo_nombre: "Mi Grupo",
            total_jovenes: 0,
            asistencia_promedio: 0,
            jovenes_en_riesgo: 0
          },
          proximos_eventos: []
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const formatEventDate = (fechaStr: string) => {
    const fecha = new Date(`${fechaStr}T12:00:00`); 
    const day = fecha.toLocaleDateString('es-ES', { day: '2-digit' });
    const month = fecha.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase().replace('.', '');
    return { day, month };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: COLORS.bgLight, color: COLORS.primary }}>
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="font-serif font-bold animate-pulse">Cargando tu grupo...</p>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen font-sans" style={{ backgroundColor: COLORS.bgLight }}>
      
      {/* 1. CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight" style={{ color: COLORS.dark }}>
            Grupo {data.kpis.grupo_nombre}
          </h1>
          <p className="text-[#5A431C] opacity-70 mt-1 flex items-center gap-2">
            ¡Bendecido día, <strong>{user?.nombre?.split(" ")[0] || "Catequista"}</strong>!
          </p>
        </div>
        
        {/* Botón de Acción Rápida Principal para Catequista */}
        <Link href="/catequista/asistencias" 
              className="bg-[#211814] text-white px-6 py-3.5 rounded-xl font-bold shadow-lg hover:bg-[#5A431C] transition-colors flex items-center gap-2">
          <ClipboardList size={20} />
          <span>Tomar Asistencia</span>
        </Link>
      </div>

      {/* 2. KPIs (MÉTRICAS DEL GRUPO) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          title="Mis Jóvenes" 
          value={data.kpis.total_jovenes.toString()} 
          trend="Inscritos"
          icon={<Users size={24} />} 
          color="bg-blue-50 text-blue-700"
        />
        <StatCard 
          title="Asistencia del Grupo" 
          value={`${data.kpis.asistencia_promedio}%`} 
          trend="Promedio global"
          icon={<TrendingUp size={24} />} 
          color="bg-emerald-50 text-emerald-700" 
        />
        
        {/* Tarjeta de Riesgo: Cambia a rojo si hay jóvenes en riesgo */}
        <StatCard 
          title="Jóvenes en Riesgo" 
          value={data.kpis.jovenes_en_riesgo.toString()} 
          trend={data.kpis.jovenes_en_riesgo > 0 ? "Requieren atención" : "¡Excelente!"}
          icon={<AlertOctagon size={24} />} 
          color={data.kpis.jovenes_en_riesgo > 0 ? "bg-red-50 text-red-600 border-red-200" : "bg-gray-100 text-gray-500"} 
          isAlert={data.kpis.jovenes_en_riesgo > 0}
        />

        {/* Tarjeta dinámica del próximo evento */}
        <StatCard 
          title="Próxima Sesión" 
          value={data.proximos_eventos.length > 0 ? formatEventDate(data.proximos_eventos[0].fecha).day : "--"} 
          trend={data.proximos_eventos.length > 0 ? data.proximos_eventos[0].tipo_nombre : "Sin programar"}
          icon={<CalendarDays size={24} />} 
          color="bg-[#F9F8F6] text-[#5A431C] border-[#C0B1A0]/40" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 3. COLUMNA IZQUIERDA: Herramientas del Catequista */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#EBE5E0]">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
              <TrendingUp size={20} className="text-[#5A431C]" />
              Mis Herramientas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <QuickAction 
                title="Registro de Notas" 
                desc="Calificar exámenes y tareas"
                href="/catequista/notas"
                icon={<GraduationCap />}
              />
              <QuickAction 
                title="Historial de Asistencia" 
                desc="Revisar faltas de mi grupo"
                href="/catequista/asistencias/historial"
                icon={<ClipboardList />}
              />
            </div>
          </div>

          {/* ALERTAS DEL GRUPO */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#EBE5E0]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: COLORS.dark }}>
                <BellRing size={20} className="text-[#ca8a04]" />
                Atención Requerida
              </h3>
            </div>
            
            <div className="space-y-4">
              {data.kpis.jovenes_en_riesgo > 0 ? (
                <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="bg-red-100 p-2 rounded-lg text-red-600">
                    <AlertOctagon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-900">Alumnos con múltiples faltas</p>
                    <p className="text-xs text-red-700 mt-0.5">Tienes {data.kpis.jovenes_en_riesgo} jóvenes con 3 o más inasistencias acumuladas. Es necesario contactar a sus apoderados.</p>
                  </div>
                  <Link href="/catequista/alumnos" className="text-xs font-bold text-white bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shrink-0">
                    Ver Lista
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6 text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-sm font-bold">¡Tu grupo va excelente!</p>
                  <p className="text-xs mt-1">Ningún alumno presenta riesgo por inasistencias.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. COLUMNA DERECHA: Próximas Sesiones */}
        <div className="bg-[#211814] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden h-fit">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#5A431C] rounded-full blur-3xl opacity-20 -translate-y-10 translate-x-10"></div>
          
          <h3 className="text-lg font-serif font-bold mb-6 flex items-center gap-2 relative z-10">
            <Clock size={20} className="text-[#C0B1A0]" />
            Mis Próximas Sesiones
          </h3>

          <div className="space-y-6 relative z-10">
            {data.proximos_eventos.length === 0 ? (
              <div className="text-center py-6 text-[#C0B1A0] border border-[#ffffff10] rounded-xl bg-[#ffffff05]">
                <p className="text-sm font-medium">No tienes sesiones programadas.</p>
              </div>
            ) : (
              data.proximos_eventos.map((evento: any) => {
                const { day, month } = formatEventDate(evento.fecha);
                const timeStr = evento.hora_inicio ? evento.hora_inicio.substring(0, 5) : '';
                
                return (
                  <EventCard 
                    key={evento.id}
                    day={day} 
                    month={month} 
                    title={evento.nombre} 
                    time={timeStr ? `${timeStr} hrs` : "Hora por definir"}
                    status={`${evento.icono} ${evento.tipo_nombre}`}
                  />
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// --- SUB-COMPONENTES ---

function StatCard({ title, value, trend, icon, color, isAlert = false }: any) {
  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border transition-transform hover:-translate-y-1 ${isAlert ? 'border-red-200 ring-2 ring-red-50' : 'border-[#EBE5E0]'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wide opacity-60 bg-gray-100 px-2 py-1 rounded-md text-gray-600">
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
      <div className="p-2 rounded-lg bg-gray-100 text-gray-500 group-hover:bg-[#5A431C] group-hover:text-white transition-colors shrink-0">
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
      <div className="bg-[#ffffff10] rounded-xl p-3 text-center min-w-[60px] shrink-0 border border-[#ffffff10]">
        <span className="block text-[10px] text-[#C0B1A0] font-bold uppercase tracking-widest">{month}</span>
        <span className="block text-2xl font-bold text-white mt-0.5">{day}</span>
      </div>
      <div className="overflow-hidden">
        <h5 className="font-bold text-white text-sm truncate" title={title}>{title}</h5>
        <p className="text-xs text-[#C0B1A0] mt-1 mb-1.5 truncate">{time}</p>
        <span className="text-[10px] bg-[#5A431C] px-2 py-0.5 rounded-md font-bold text-[#EBE5E0]">
          {status}
        </span>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState, useMemo } from 'react';
import { eventoService } from '@/app/services/eventos'; // Asegúrate de tener este servicio
import { asistenciaService } from '@/app/services/asistencia';
import { Evento, TipoEvento ,Grupo} from '@/app/types';
import { tipoEventoService } from '@/app/services/tipoEvento'; // Asegúrate de que la ruta sea correcta
import {Calendar,Clock,MapPin,Plus,Loader2,X,Users,CheckCircle,AlertCircle,ClipboardList,Save} from 'lucide-react';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale/es';
import { useAuth } from '@/app/context/AuthContext';
import Swal from 'sweetalert2';
import { useRef  } from 'react';
import { ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { grupoService } from '@/app/services/grupos';


registerLocale('es', es);

// --- INTERFAZ PARA EL CHECKLIST ---
interface AlumnoChecklist {
  confirmante_id: string;
  usuario_id: string;
  nombres: string;
  apellidos: string;
  grupo_nombre: string;
  estado_id: number;
  observaciones: string | null;
}

type EstadoAsistencia = {
  id: number;
  nombre: string;
  icono: string;
  tone: {
    text: string;
    bg: string;
    border: string;
    hover: string;
  };
};

// Solo estos 4 IDs son estados de asistencia válidos para el checklist (backend).
const OPCIONES_ESTADO_ASISTENCIA: EstadoAsistencia[] = [
  { id: 1, nombre: 'Asistió', icono: '✅', tone: { text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', hover: 'hover:bg-green-100' } },
  { id: 2, nombre: 'Tardanza', icono: '⚠️', tone: { text: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', hover: 'hover:bg-yellow-100' } },
  { id: 3, nombre: 'Falta', icono: '❌', tone: { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', hover: 'hover:bg-red-100' } },
  { id: 4, nombre: 'Falta justificada', icono: '📝', tone: { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', hover: 'hover:bg-blue-100' } },
];

const getEstadoVisual = (estadoId: number): EstadoAsistencia => {
  const known = OPCIONES_ESTADO_ASISTENCIA.find((estado) => estado.id === estadoId);
  if (known) return known;

  return {
    id: estadoId,
    nombre: `Estado ${estadoId}`,
    icono: '❔',
    tone: {
      text: 'text-[#5A431C]',
      bg: 'bg-[#F9F3EA]',
      border: 'border-[#C0B1A0]',
      hover: 'hover:bg-[#EFE5D8]',
    },
  };
};

const EstadoDropdown = ({ 
  estadoId, 
  onChange 
}: { 
  estadoId: number; 
  onChange: (id: number) => void; 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cierra el menú si haces clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const actual = getEstadoVisual(estadoId);

  return (
    <div className={`relative inline-block text-left min-w-[10.5rem] sm:min-w-[11.5rem] ${isOpen ? 'z-[60]' : 'z-10'}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between gap-2 px-3.5 py-2 text-[13px] font-medium leading-snug rounded-[11px]
          border border-[#E0D6CB] bg-white/95 text-[#211814]
          shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_1px_2px_rgba(33,24,20,0.06)]
          transition-all duration-200 hover:bg-[#FDFCFA] hover:border-[#CBBBA8] active:scale-[0.99]
          ${isOpen ? 'ring-[1.5px] ring-[#5A431C]/30 border-[#C0B1A0]' : ''}`}
      >
        <span className="flex min-w-0 items-center gap-2 truncate tabular-nums">
          <span className="shrink-0 text-base leading-none">{actual.icono}</span>
          <span className="truncate">{actual.nombre}</span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-[#9A8875] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-[999] mt-2 w-[13.5rem] overflow-hidden rounded-2xl border border-black/[0.06] bg-[#FDFCFB]/98 py-1.5 shadow-[0_24px_64px_-12px_rgba(33,24,20,0.22),0_0_1px_rgba(33,24,20,0.12)] backdrop-blur-xl ring-1 ring-white/70"
        >
          {OPCIONES_ESTADO_ASISTENCIA.map((est) => (
            <button
              key={est.id}
              role="menuitem"
              type="button"
              onClick={() => {
                onChange(est.id);
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-medium tracking-tight transition-colors
                ${estadoId === est.id ? 'bg-[#5A431C]/8 text-[#5A431C]' : 'text-[#211814] hover:bg-black/[0.04]'}`}
            >
              <span className="text-base leading-none">{est.icono}</span>
              {est.nombre}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- FUNCIÓN PARA BLOQUEAR EVENTOS PASADOS ---
const isEventoFinalizado = (fechaStr: string, horaFinStr?: string) => {
  const ahora = new Date();
  // Si el evento no tiene hora_fin, asumimos que termina a las 23:59 de ese mismo día
  const horaReal = horaFinStr ? horaFinStr : '23:59:00';
  const fechaEvento = new Date(`${fechaStr}T${horaReal}`);
  
  return ahora > fechaEvento; // Devuelve TRUE si ya pasó la hora
};

export default function EventosPage() {
  const router = useRouter();
  const { user } = useAuth();
  const ROL_ACTUAL = user?.roles?.[0] || 'ADMIN';

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroVista, setFiltroVista] = useState<'PROXIMOS' | 'PASADOS'>('PROXIMOS');

  // MODAL CREAR EVENTO
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null);
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");

  
// --- NUEVOS ESTADOS PARA EL FORMULARIO ---
const [dirigidoA, setDirigidoA] = useState<'CONFIRMANTES' | 'CATEQUISTAS'>('CONFIRMANTES');
const [alcance, setAlcance] = useState<'TODOS' | 'GRUPO'>('TODOS');
const [grupoId, setGrupoId] = useState("");
const [ubicacion, setUbicacion] = useState(""); 

const [tiposEvento, setTiposEvento] = useState<TipoEvento[]>([]);
const [loadingTipos, setLoadingTipos] = useState(true);

// 👇 ESTADOS ACTIVADOS PARA LOS GRUPOS
const [grupos, setGrupos] = useState<Grupo[]>([]);
const [loadingGrupos, setLoadingGrupos] = useState(true);

// 👇 EFECTO MEJORADO: Carga Tipos y Grupos en paralelo
useEffect(() => {
  const loadData = async () => {
    try {
      setLoadingTipos(true);
      setLoadingGrupos(true);
      
      const [tiposData, gruposData] = await Promise.all([
        tipoEventoService.getAll(),
        grupoService.getAllActivos()
      ]);
      
      setTiposEvento(tiposData);
      setGrupos(gruposData);
    } catch (error) {
      console.error("Error al cargar los datos del formulario:", error);
    } finally {
      setLoadingTipos(false);
      setLoadingGrupos(false);
    }
  };
  loadData();
}, []);

  // --- NUEVOS ESTADOS PARA EL CHECKLIST MANUAL ---
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(null);
  const [alumnosChecklist, setAlumnosChecklist] = useState<AlumnoChecklist[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [guardandoAsistencia, setGuardandoAsistencia] = useState(false);

  const tzoffset = (new Date()).getTimezoneOffset() * 60000;
  const today = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
  
  // ========== LÓGICA DE VALIDACIÓN EN TIEMPO REAL ==========
  const ahora = new Date();
  const esHoy = fechaSeleccionada &&
    fechaSeleccionada.getDate() === ahora.getDate() &&
    fechaSeleccionada.getMonth() === ahora.getMonth() &&
    fechaSeleccionada.getFullYear() === ahora.getFullYear();

  const minHoraInicio = esHoy 
    ? `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}` 
    : undefined;

  const errorPasado = esHoy && horaInicio && minHoraInicio && horaInicio < minHoraInicio;
  const errorTiempo = horaInicio && horaFin && horaFin <= horaInicio;


  const fetchEventos = async () => {
    try {
      setLoading(true);
      const data = await eventoService.getProximos();
      setEventos(data);
    } catch (error) {
      console.error("Error cargando eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filtroVista === 'PROXIMOS') {
      fetchEventos();
    }
  }, [filtroVista]);

  const toTipoSlug = (nombre: string) =>
    nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

  const handleGoToAsistenciasTipo = (tipoNombre: string) => {
    // Navegamos por nombre (slug legible) en vez de numero
    const tipoSlug = toTipoSlug(tipoNombre);
    router.push(`/admin/eventos/asistencias/${tipoSlug}`);
  };

  const resumenProximos = useMemo(() => {
    const obligatorios = eventos.filter((evento) => evento.obligatorio).length;
    const hoy = eventos.filter((evento) => evento.fecha === today).length;

    return {
      total: eventos.length,
      obligatorios,
      hoy,
    };
  }, [eventos, today]);

  const cerrarModal = () => {
    setIsModalOpen(false);
    setFechaSeleccionada(null);
    setHoraInicio("");
    setHoraFin("");
    setUbicacion("");
  };

  const handleCrearEvento = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fechaSeleccionada || errorTiempo || errorPasado) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const year = fechaSeleccionada.getFullYear();
    const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
    const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
    const fechaBackend = `${year}-${month}-${day}`;

    const payload = {
      nombre: formData.get("nombre") as string,
      tipo_id: Number(formData.get("tipo_id")),
      fecha: fechaBackend,
      hora_inicio: horaInicio || undefined,
      hora_fin: horaFin || undefined,
      ubicacion: formData.get("ubicacion") as string,
      descripcion: (formData.get("descripcion") as string) || undefined,
      obligatorio: formData.get("obligatorio") === "on",
      requiere_confirmacion: false,
      dirigido_a: dirigidoA,
      grupo_id: alcance === 'GRUPO' && grupoId !== "" ? grupoId : undefined,
    };

    try {
      await eventoService.create(payload);
      cerrarModal();
      fetchEventos();
      Swal.fire('Éxito', 'Evento creado correctamente', 'success');
    } catch (error) {
      Swal.fire('Error', 'Error al crear evento.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFecha = (fechaStr: string) => {
    const fecha = new Date(`${fechaStr}T12:00:00`);
    const dia = fecha.toLocaleDateString('es-ES', { day: '2-digit' });
    const mes = fecha.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
    const diaSemana = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
    return { dia, mes, diaSemana };
  };

  const formatHora = (horaStr?: string) => {
    if (!horaStr) return '';
    const [horas, minutos] = horaStr.split(':');
    const h = parseInt(horas, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hora12 = h % 12 || 12;
    return `${hora12}:${minutos} ${ampm}`;
  };

  const handleEliminarEvento = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Cancelar evento?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#C0B1A0',
      confirmButtonText: 'Sí, cancelar evento',
      cancelButtonText: 'No'
    });

    if (result.isConfirmed) {
      try {
        await eventoService.delete(id);
        fetchEventos();
        Swal.fire('Cancelado', 'El evento ha sido eliminado.', 'success');
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar el evento', 'error');
      }
    }
  };

  // =====================================================================
  // NUEVAS FUNCIONES PARA EL CHECKLIST MANUAL
  // =====================================================================
  
  const handleAbrirChecklist = async (evento: Evento) => {
    setEventoSeleccionado(evento);
    setIsChecklistOpen(true);
    setLoadingChecklist(true);
    
    try {
      // Llamamos al backend para traer a los alumnos de este evento
      const data = await asistenciaService.getChecklist(evento.id);
      setAlumnosChecklist(data);
    } catch (error) {
      console.error("Error cargando checklist:", error);
      Swal.fire('Error', 'No se pudo cargar la lista de asistencia', 'error');
      setIsChecklistOpen(false);
    } finally {
      setLoadingChecklist(false);
    }
  };

  const handleChangeEstado = (usuarioId: string, nuevoEstadoId: number) => {
    setAlumnosChecklist(prev => 
      prev.map(alumno => 
        alumno.usuario_id === usuarioId 
          ? { ...alumno, estado_id: nuevoEstadoId } 
          : alumno
      )
    );
  };

  const handleGuardarAsistencia = async () => {
    if (!eventoSeleccionado) return;
    setGuardandoAsistencia(true);

    try {
      const payload = {
        asistencias: alumnosChecklist.map(a => ({
          usuario_id: a.usuario_id,
          estado_id: a.estado_id,
          observaciones: a.observaciones
        }))
      };

      await asistenciaService.guardarMasiva(eventoSeleccionado.id, payload);
      
      Swal.fire({
        icon: 'success',
        title: '¡Asistencia Guardada!',
        showConfirmButton: false,
        timer: 1500
      });
      setIsChecklistOpen(false);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Hubo un problema al guardar la asistencia', 'error');
    } finally {
      setGuardandoAsistencia(false);
    }
  };

  // =====================================================================

  const opcionesHoraInicio = useMemo(() => {
    const opciones = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 5) {
        const horaStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        if (!minHoraInicio || horaStr >= minHoraInicio) opciones.push(horaStr);
      }
    }
    return opciones;
  }, [minHoraInicio]);

  const opcionesHoraFin = useMemo(() => {
    const opciones = [];
    const minParaFin = horaInicio ? horaInicio : minHoraInicio;
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 5) {
        const horaStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        if (!minParaFin || horaStr > minParaFin) opciones.push(horaStr);
      }
    }
    return opciones;
  }, [horaInicio, minHoraInicio]);


  

  return (
    <> 
    <div className="absolute inset-4 md:inset-8 flex flex-col rounded-3xl shadow-sm border border-white/60 bg-[#F9F8F6]/70 backdrop-blur-xl overflow-hidden ring-1 ring-[#E8E2DA]/50 font-sans text-[#211814]">
      
      <header className="flex shrink-0 flex-col gap-4 border-b border-[#E8E2DA]/50 bg-white/40 px-5 sm:px-8 py-5 sm:py-6 lg:flex-row lg:items-center lg:justify-between z-30">
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-[28px] font-semibold text-[#211814] tracking-tight leading-tight">Control de Asistencia</h1>
          <p className="text-[13px] font-medium text-[#8B7355]/80 mt-1.5">Gestiona eventos y asistencias con una experiencia clara y moderna</p>
        </div>
        <div className="flex w-full md:w-auto items-center gap-4">
          <div className="bg-white/50 backdrop-blur-md p-1.5 rounded-2xl flex border border-white/80 flex-1 md:flex-none shadow-sm ring-1 ring-black/[0.03]">
            <button onClick={() => setFiltroVista('PROXIMOS')} className={`flex-1 md:px-7 px-5 py-2.5 text-[13px] font-semibold tracking-wide rounded-[14px] transition-all duration-300 ${filtroVista === 'PROXIMOS' ? 'bg-white text-[#5A431C] shadow-sm ring-1 ring-black/[0.04]' : 'text-[#8B7355] hover:text-[#5A431C] hover:bg-white/40'}`}>Próximos</button>
            <button onClick={() => setFiltroVista('PASADOS')} className={`flex-1 md:px-7 px-5 py-2.5 text-[13px] font-semibold tracking-wide rounded-[14px] transition-all duration-300 ${filtroVista === 'PASADOS' ? 'bg-white text-[#5A431C] shadow-sm ring-1 ring-black/[0.04]' : 'text-[#8B7355] hover:text-[#5A431C] hover:bg-white/40'}`}>Historial</button>
          </div>
          {ROL_ACTUAL === 'ADMIN' && (
            <button onClick={() => setIsModalOpen(true)} className="bg-[#5A431C] hover:bg-[#4a3616] text-white px-5 sm:px-6 py-3 rounded-[14px] flex items-center justify-center gap-2.5 text-[13px] font-semibold tracking-wide transition-all active:scale-95 shadow-sm ring-1 ring-inset ring-black/10 shrink-0">
              <Plus size={18} strokeWidth={2.5} /> <span className="hidden sm:inline">Nuevo Evento</span>
            </button>
          )}
        </div>
      </header>

      {/* LISTA DE EVENTOS */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-transparent">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-8 sm:py-10">

        {filtroVista === 'PASADOS' ? (
          <div className="space-y-6">
            <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 sm:p-8 shadow-sm ring-1 ring-black/5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#211814]">Historial por categoría</h2>
                  <p className="text-sm font-medium text-[#8B7355]/80 mt-1">Selecciona una categoría para revisar las asistencias pasadas.</p>
                </div>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 text-[#5A431C] text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md">
                  <Calendar size={14} />
                  Vista Inteligente
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {loadingTipos && Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`skeleton-tipo-${index}`}
                    className="h-36 rounded-[1.5rem] border border-white/60 bg-white/40 backdrop-blur-md animate-pulse shadow-sm"
                  />
                ))}

                {!loadingTipos && tiposEvento.map((tipo) => (
                  <button
                    key={tipo.id}
                    onClick={() => handleGoToAsistenciasTipo(tipo.nombre)}
                    className="group flex flex-col items-center justify-center p-6 sm:p-8 rounded-[1.5rem] border border-white/80 bg-white/60 backdrop-blur-md shadow-sm transition-all duration-300 hover:bg-white/90 hover:scale-[1.02] hover:shadow-md hover:border-white ring-1 ring-black/[0.03]"
                  >
                    <span className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-110 drop-shadow-sm">{tipo.icono || '📌'}</span>
                    <span className="font-semibold text-center text-[15px] text-[#211814]">{tipo.nombre}</span>
                  </button>
                ))}
                {!loadingTipos && tiposEvento.length === 0 && (
                  <div className="md:col-span-3 bg-white/40 backdrop-blur-md border border-dashed border-black/10 rounded-[1.5rem] p-10 text-center">
                    <p className="text-[#8B7355] font-medium text-[15px]">No hay tipos de evento disponibles para mostrar.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#5A431C]">
            <Loader2 className="animate-spin mb-4 opacity-80" size={44} strokeWidth={1.5} />
            <p className="text-[15px] font-medium tracking-tight animate-pulse text-[#8B7355]">Sincronizando agenda...</p>
          </div>
        ) : eventos.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-xl border border-white/60 ring-1 ring-black/5 rounded-[2rem] p-10 sm:p-20 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-24 h-24 bg-white/80 text-[#9A8875] rounded-full flex items-center justify-center mb-6 shadow-sm ring-1 ring-black/5"><Calendar size={44} strokeWidth={1.5} /></div>
            <h3 className="text-[22px] font-semibold tracking-tight text-[#211814] mb-2">Agenda despejada</h3>
            <p className="text-[15px] font-medium text-[#8B7355]/80 max-w-sm">No tienes próximos eventos programados por el momento.</p>
          </div>
        ) : (
          <div className="grid xl:grid-cols-2 gap-5 sm:gap-6">
            {eventos.map((evento) => {
              const { dia, mes, diaSemana } = formatFecha(evento.fecha);
              
              // 👇 1. Evaluamos si esta tarjeta específica ya caducó
              const eventoTerminado = isEventoFinalizado(evento.fecha, evento.hora_fin);

              return (
                <div key={evento.id} className={`bg-white/70 backdrop-blur-xl rounded-[1.75rem] sm:rounded-[2rem] border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] ring-1 ring-black/[0.03] transition-all duration-300 flex overflow-hidden group relative ${eventoTerminado ? 'opacity-70 grayscale-[0.2]' : ''}`}>
                  
                  {evento.obligatorio && <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-amber-500/80 z-10 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>}

                  <div className="bg-black/[0.02] w-28 sm:w-32 flex flex-col items-center justify-center p-4 sm:p-5 border-r border-black/[0.04] shrink-0 backdrop-blur-sm">
                    <span className="text-[11px] font-bold text-[#8B7355] uppercase tracking-[0.2em] mb-1.5">{mes}</span>
                    <span className="text-[40px] leading-none font-semibold tracking-tighter text-[#211814]">{dia}</span>
                    <span className="text-[10px] font-semibold text-[#9A8875] uppercase tracking-[0.15em] mt-2.5">{diaSemana}</span>
                  </div>
                  
                  <div className="p-5 sm:p-7 flex-1 flex flex-col justify-between relative bg-white/40">
                    
                    {/* 👇 2. Solo mostramos el botón de Eliminar si NO ha terminado */}
                    {!eventoTerminado && (
                      <button 
                        onClick={() => handleEliminarEvento(evento.id)} 
                        className="absolute top-5 right-5 text-black/20 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50/80 backdrop-blur-md"
                        title="Eliminar evento"
                      >
                        <X size={18} strokeWidth={2.5} />
                      </button>
                    )}

                    <div className="pr-8 sm:pr-10">
                      <h3 className="text-[19px] sm:text-[21px] font-semibold tracking-tight leading-[1.2] text-[#211814] group-hover:text-[#5A431C] transition-colors line-clamp-2">{evento.nombre}</h3>
                      <div className="text-[13px] sm:text-[14px] font-medium text-[#8B7355]/90 mt-3.5 space-y-2">
                        {evento.hora_inicio && (<div className="flex items-center gap-2.5"><Clock size={16} className="text-[#C0B1A0] shrink-0" />{formatHora(evento.hora_inicio)} {evento.hora_fin ? `- ${formatHora(evento.hora_fin)}` : ''}</div>)}
                        {evento.ubicacion && (<div className="flex items-center gap-2.5"><MapPin size={16} className="text-[#C0B1A0] shrink-0" /><span className="truncate">{evento.ubicacion}</span></div>)}
                      </div>
                    </div>

                    <div className="mt-5 sm:mt-6 pt-5 border-t border-black/[0.04] flex flex-wrap sm:flex-nowrap gap-3 sm:gap-4 justify-start items-center">
                    <div className="flex -space-x-2.5 opacity-80 shrink-0">
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-black/5 flex items-center justify-center text-black/40 backdrop-blur-md shadow-sm"><Users size={14} strokeWidth={2.5}/></div>
                    </div>
                    
                    <button 
                      onClick={() => handleAbrirChecklist(evento)} 
                      className={`w-full sm:w-auto justify-center px-5 py-2.5 rounded-[14px] text-[12px] font-semibold tracking-wide flex items-center gap-2 transition-all shadow-sm ring-1 ring-inset shrink-0
                        ${eventoTerminado ? 'bg-black/5 text-[#5A431C] ring-black/10 hover:bg-black/10' : 'bg-white text-[#5A431C] ring-black/5 hover:bg-[#FDFCFB] hover:shadow-md'}`}
                    >
                      <ClipboardList size={16} strokeWidth={2} className="shrink-0 opacity-80" /> 
                      <span className="truncate">{eventoTerminado ? 'Ver Registro' : 'Tomar Asistencia'}</span>
                    </button>
                  </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
      </div>


      {isChecklistOpen && eventoSeleccionado && (() => {
        const modalTerminado = isEventoFinalizado(eventoSeleccionado.fecha, eventoSeleccionado.hora_fin);

        return (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-6 bg-[#211814]/28 backdrop-blur-md">
            <div
              className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-t-[1.25rem] bg-[#FDFCFA] shadow-[0_32px_100px_-20px_rgba(33,24,20,0.35),inset_0_1px_0_rgba(255,255,255,0.75)] animate-in fade-in zoom-in-95 duration-200 sm:rounded-[22px] sm:ring-1 sm:ring-black/[0.06] max-h-[min(94vh,calc(100dvh-env(safe-area-inset-bottom)-1rem))]"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />

              <header className="shrink-0 px-5 pt-5 pb-4 sm:px-7 sm:pt-6 sm:pb-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {modalTerminado ? (
                        <span className="inline-flex items-center rounded-full border border-[#C0B1A0]/50 bg-[#F3EEE7] px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-[#5A431C]">
                          Solo lectura
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-[#C0B1A0]/40 bg-white/80 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-[#8B7355]">
                          Tomar asistencia
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-[1.35rem] font-semibold leading-tight tracking-tight text-[#211814] sm:text-[1.6rem]">
                      {eventoSeleccionado.nombre}
                    </h3>
                    <p className="text-[13px] leading-relaxed text-[#8B7355]">
                      {formatFecha(eventoSeleccionado.fecha).diaSemana},{' '}
                      {formatFecha(eventoSeleccionado.fecha).dia}{' '}
                      {formatFecha(eventoSeleccionado.fecha).mes}. Lista de confirmantes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChecklistOpen(false)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/[0.04] text-[#6B5847] transition hover:bg-black/[0.07] active:scale-95"
                    aria-label={modalTerminado ? 'Cerrar' : 'Cancelar'}
                  >
                    <X size={18} strokeWidth={2} />
                  </button>
                </div>
              </header>

              <div className="mx-5 h-px bg-[#211814]/10 sm:mx-7" />

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-7 sm:py-5">
                {loadingChecklist ? (
                   <div className="flex flex-col items-center justify-center py-16 text-[#5A431C]">
                     <Loader2 className="mb-3 animate-spin opacity-70" size={32} strokeWidth={2} />
                     <p className="text-sm font-medium text-[#8B7355]">Cargando confirmantes...</p>
                   </div>
                ) : alumnosChecklist.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#C0B1A0]/55 bg-[#FFFCFA] px-6 py-12 text-center">
                    <p className="text-sm font-medium text-[#211814]">No hay confirmantes en este evento</p>
                    <p className="mt-1 text-[13px] text-[#8B7355]">Cuando exista una lista asignada, aparecerá aquí.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-[14px] border border-[#E6DED4] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(33,24,20,0.05)]">
                    <table className="w-full border-collapse text-left text-[13px] sm:text-[14px]">
                      <thead className="sticky top-0 z-10 bg-[#FAFAF9]/92 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8B7355] backdrop-blur-md">
                      <tr>
                        <th
                          scope="col"
                          className="w-10 min-w-[2.5rem] whitespace-nowrap border-b border-[#EEEBE6] px-2 py-3 text-center font-semibold tabular-nums text-[#5A431C] sm:w-11"
                          title="Número de fila"
                        >
                          #
                        </th>
                        <th className="border-b border-[#EEEBE6] px-3 py-3 sm:px-4">Nombre</th>
                        <th className="border-b border-[#EEEBE6] px-3 py-3 text-[#8B7355] sm:px-4">Grupo</th>
                        <th className="border-b border-[#EEEBE6] px-3 py-3 text-right sm:px-4">Estado</th>
                      </tr>
                      </thead>
                      <tbody>
                      {alumnosChecklist.map((alumno, rowIndex) => (
                        <tr key={alumno.usuario_id} className="transition-colors hover:bg-[#FBF9F7]">
                          <td className="border-b border-[#F4F1ED] px-2 py-3 text-center align-middle tabular-nums text-[13px] font-semibold text-[#5A431C] sm:py-3.5">
                            {rowIndex + 1}
                          </td>
                          <td className="border-b border-[#F4F1ED] px-3 py-3 align-middle font-medium text-[#211814] sm:px-4 sm:py-3.5">
                            {alumno.nombres} {alumno.apellidos}
                          </td>
                          <td className="border-b border-[#F4F1ED] px-3 py-3 align-middle text-[13px] text-[#8B7355] sm:px-4 sm:py-3.5">
                             {alumno.grupo_nombre}
                          </td>
                          <td className="border-b border-[#F4F1ED] px-3 py-3 align-middle text-right sm:px-4 sm:py-3.5">
                            {modalTerminado ? (
                              <div
                                className={`inline-flex max-w-full items-center gap-2 rounded-[10px] border px-2.5 py-1.5 text-[12px] font-medium leading-snug shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]
                                ${getEstadoVisual(alumno.estado_id).tone.bg}
                                ${getEstadoVisual(alumno.estado_id).tone.text}
                                ${getEstadoVisual(alumno.estado_id).tone.border}`}
                              >
                                <span>{getEstadoVisual(alumno.estado_id).icono}</span>
                                <span>{getEstadoVisual(alumno.estado_id).nombre}</span>
                              </div>
                            ) : (
                              <div className="flex justify-end">
                              <EstadoDropdown 
                                estadoId={alumno.estado_id} 
                                onChange={(nuevoId) => handleChangeEstado(alumno.usuario_id, nuevoId)} 
                              />
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <footer className="shrink-0 border-t border-[#211814]/10 bg-[#FAFAFA]/92 px-5 py-4 backdrop-blur-md sm:px-7 sm:py-4">
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <p className="text-center text-[12px] text-[#9A8875] sm:text-left tabular-nums">
                    {!loadingChecklist && alumnosChecklist.length > 0
                      ? `${alumnosChecklist.length} confirmante${alumnosChecklist.length === 1 ? '' : 's'}`
                      : '\u00A0'}
                  </p>
                  <div className="flex items-center justify-stretch gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setIsChecklistOpen(false)}
                      className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl px-4 text-[14px] font-semibold text-[#5A431C] transition hover:bg-black/[0.04] active:scale-[0.99] sm:flex-initial sm:min-h-0 sm:rounded-[11px] sm:px-5 sm:py-2.5"
                    >
                      {modalTerminado ? 'Cerrar' : 'Cancelar'}
                    </button>

                    {!modalTerminado && (
                      <button 
                        type="button"
                        onClick={handleGuardarAsistencia} 
                        disabled={guardandoAsistencia || loadingChecklist || alumnosChecklist.length === 0}
                        className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#5A431C] px-5 text-[14px] font-semibold text-white shadow-[inset_0_-1px_0_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:bg-[#4a3616] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45 sm:flex-initial sm:min-h-0 sm:rounded-[11px] sm:px-6 sm:py-2.5"
                      >
                        {guardandoAsistencia ? <Loader2 size={18} className="animate-spin opacity-95" strokeWidth={2} /> : <Save size={18} strokeWidth={2} />}
                        Guardar asistencia
                      </button>
                    )}
                  </div>
                </div>
              </footer>
            </div>
          </div>
        );
      })()}

      {/* ================= MODAL CREAR EVENTO (SIN CAMBIOS, se mantiene igual) ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
           {/* ... el mismo modal de Crear Evento que ya tenías ... */}
           {/* Asegúrate de mantener la estructura del modal de crear aquí, es idéntica a tu código original */}
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmitting && cerrarModal()}></div>

          <div className="relative bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh] md:max-h-[85vh]">
            
            <div className="px-6 py-5 border-b border-[#C0B1A0]/20 bg-[#F9F8F6] flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                 <div className="bg-[#5A431C] text-white p-2.5 rounded-xl shadow-sm"><Calendar size={20} /></div>
                 <h2 className="font-serif font-bold text-2xl text-[#211814]">Nuevo Evento</h2>
              </div>
              <button type="button" onClick={cerrarModal} className="p-2 rounded-full hover:bg-black/5 text-gray-400 transition-colors"><X size={24} /></button>
            </div>

            <form id="form-crear-evento" onSubmit={handleCrearEvento} className="p-6 sm:p-8 space-y-7 overflow-y-auto bg-white">
              
              {/* PASO 1: PÚBLICO OBJETIVO (Segmented Control iOS) */}
              <div>
                <label className="block text-[11px] font-bold text-[#8B7355] uppercase tracking-wider mb-2.5">1. ¿Para quién es el evento?</label>
                <div className="flex bg-[#F4F2EE] p-1 rounded-xl border border-[#E8E2DA] shadow-inner">
                  <button type="button" onClick={() => setDirigidoA('CONFIRMANTES')} className={`flex-1 py-2.5 text-[13px] font-semibold rounded-lg transition-all duration-300 ${dirigidoA === 'CONFIRMANTES' ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-[#5A431C]' : 'text-[#9A8875] hover:text-[#5A431C]'}`}>
                    Confirmantes
                  </button>
                  <button type="button" onClick={() => setDirigidoA('CATEQUISTAS')} className={`flex-1 py-2.5 text-[13px] font-semibold rounded-lg transition-all duration-300 ${dirigidoA === 'CATEQUISTAS' ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-[#5A431C]' : 'text-[#9A8875] hover:text-[#5A431C]'}`}>
                    Catequistas
                  </button>
                </div>
              </div>

              {/* PASO 2: ALCANCE (General vs Grupo) */}
              <div className="bg-[#FAF8F6] p-4 rounded-[1.25rem] border border-[#E8E2DA]/60 space-y-4">
                <label className="block text-[11px] font-bold text-[#8B7355] uppercase tracking-wider">2. Alcance del Evento</label>
                <div className="flex bg-[#EBE5E0]/50 p-1 rounded-xl border border-[#E8E2DA] shadow-inner">
                  <button type="button" onClick={() => { setAlcance('TODOS'); setGrupoId(""); }} className={`flex-1 py-2 text-[12px] font-semibold rounded-lg transition-all duration-300 ${alcance === 'TODOS' ? 'bg-white shadow-sm text-[#5A431C]' : 'text-[#9A8875] hover:text-[#5A431C]'}`}>
                    Todos (General)
                  </button>
                  <button type="button" onClick={() => setAlcance('GRUPO')} className={`flex-1 py-2 text-[12px] font-semibold rounded-lg transition-all duration-300 ${alcance === 'GRUPO' ? 'bg-white shadow-sm text-[#5A431C]' : 'text-[#9A8875] hover:text-[#5A431C]'}`}>
                    Grupo Específico
                  </button>
                </div>

         
                {/* Aparece solo si selecciona "Grupo Específico" */}
                {alcance === 'GRUPO' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300 mt-4">
                    <div className="relative group">
                      <select 
                        required 
                        value={grupoId}
                        onChange={(e) => setGrupoId(e.target.value)}
                        disabled={loadingGrupos}
                        className="appearance-none w-full h-[46px] bg-white border border-[#E8E2DA] rounded-[12px] pl-4 pr-10 text-[14px] font-medium text-[#211814] focus:bg-white focus:border-[#5A431C] focus:ring-2 focus:ring-[#5A431C]/15 transition-all shadow-sm outline-none cursor-pointer disabled:opacity-50"
                      >
                        <option value="" disabled hidden>
                          {loadingGrupos ? "Cargando grupos..." : `Seleccione el grupo de ${dirigidoA.toLowerCase()}...`}
                        </option>
                        
                        {/* 👇 RENDERIZADO DINÁMICO DESDE TU BACKEND */}
                        {!loadingGrupos && grupos.map((grupo) => (
                          <option key={grupo.id} value={grupo.id}>
                            {grupo.nombre}
                          </option>
                        ))}

                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#A89F91] group-focus-within:text-[#5A431C] transition-colors">
                        {loadingGrupos ? <Loader2 size={16} className="animate-spin" /> : <ChevronDown size={16} strokeWidth={2.5} />}
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* PASO 3: DETALLES BÁSICOS */}
              <div className="space-y-5 pt-2">
                <label className="block text-[11px] font-bold text-[#8B7355] uppercase tracking-wider border-b border-[#E8E2DA] pb-2">3. Detalles del Evento</label>
                
                {/* FILA 1: Nombre (2/3) y Tipo (1/3) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* CAMPO NOMBRE */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">Nombre <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      name="nombre" 
                      placeholder="Ej. Retiro de Pascua" 
                      className="w-full h-[46px] bg-[#F4F2EE] border border-[#E8E2DA] rounded-[12px] px-4 text-[14px] font-medium text-[#211814] focus:bg-white focus:border-[#5A431C] focus:ring-2 focus:ring-[#5A431C]/15 transition-all shadow-sm outline-none placeholder:text-[#A89F91]" 
                    />
                  </div>

                  {/* CAMPO TIPO */}
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">Tipo <span className="text-red-500">*</span></label>
                    <div className="relative group">
                      <select 
                        required 
                        name="tipo_id" 
                        className="appearance-none w-full h-[46px] bg-[#F4F2EE] border border-[#E8E2DA] rounded-[12px] pl-4 pr-10 text-[14px] font-medium text-[#211814] focus:bg-white focus:border-[#5A431C] focus:ring-2 focus:ring-[#5A431C]/15 transition-all shadow-sm outline-none cursor-pointer"
                      >
                        <option value="" disabled hidden>Seleccione...</option>
                        {tiposEvento.map(tipo => (<option key={tipo.id} value={tipo.id}>{tipo.icono} {tipo.nombre}</option>))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#A89F91] group-focus-within:text-[#5A431C] transition-colors">
                        <ChevronDown size={16} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* FILA 2: Fecha, Inicio y Fin (1/3 cada uno) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* CAMPO FECHA */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 text-center">Fecha <span className="text-red-500">*</span></label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A89F91] group-focus-within:text-[#5A431C] transition-colors z-10">
                        <Calendar size={16} strokeWidth={2.5} />
                      </div>
                      <DatePicker 
                        selected={fechaSeleccionada} 
                        onChange={(date: Date | null) => setFechaSeleccionada(date)} 
                        dateFormat="dd/MM/yyyy" 
                        locale="es" 
                        minDate={new Date()} 
                        placeholderText="Seleccionar" 
                        className="w-full h-[46px] bg-[#F4F2EE] border border-[#E8E2DA] rounded-[12px] px-10 text-center text-[14px] font-medium text-[#211814] focus:bg-white focus:border-[#5A431C] focus:ring-2 focus:ring-[#5A431C]/15 transition-all shadow-sm outline-none cursor-pointer placeholder:font-medium placeholder:text-[#A89F91]" 
                        wrapperClassName="w-full" 
                        popperClassName="apple-datepicker-popper"
                      />
                    </div>
                  </div>

                  {/* CAMPO HORA INICIO */}
                  <div className="relative">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 text-center">Hora Inicio</label>
                    <div className="relative group">
                      <select 
                        name="hora_inicio" 
                        value={horaInicio} 
                        onChange={(e) => { setHoraInicio(e.target.value); setHoraFin(""); }} 
                        disabled={!fechaSeleccionada} 
                        className={`appearance-none w-full h-[46px] bg-[#F4F2EE] border border-[#E8E2DA] rounded-[12px] px-8 text-center text-[14px] font-medium focus:bg-white focus:border-[#5A431C] focus:ring-2 focus:ring-[#5A431C]/15 transition-all cursor-pointer shadow-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed ${horaInicio ? 'text-[#211814]' : 'text-[#A89F91]'} ${errorPasado ? '!border-red-500 !bg-red-50 text-red-600' : ''}`}
                      >
                        <option value="" disabled hidden>-- : --</option>
                        {opcionesHoraInicio.map((hora) => (<option key={hora} value={hora}>{hora}</option>))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#A89F91] group-focus-within:text-[#5A431C] transition-colors">
                        <ChevronDown size={16} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>

                  {/* CAMPO HORA FIN */}
                  <div className="relative">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 text-center">Hora Fin</label>
                    <div className="relative group">
                      <select 
                        name="hora_fin" 
                        value={horaFin} 
                        onChange={(e) => setHoraFin(e.target.value)} 
                        disabled={!horaInicio} 
                        className={`appearance-none w-full h-[46px] bg-[#F4F2EE] border border-[#E8E2DA] rounded-[12px] px-8 text-center text-[14px] font-medium focus:bg-white focus:border-[#5A431C] focus:ring-2 focus:ring-[#5A431C]/15 transition-all cursor-pointer shadow-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed ${horaFin ? 'text-[#211814]' : 'text-[#A89F91]'} ${errorTiempo ? '!border-red-500 !bg-red-50 text-red-600' : ''}`}
                      >
                        <option value="" disabled hidden>-- : --</option>
                        {opcionesHoraFin.map((hora) => (<option key={hora} value={hora}>{hora}</option>))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#A89F91] group-focus-within:text-[#5A431C] transition-colors">
                        <ChevronDown size={16} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                </div>

                {(errorPasado || errorTiempo) && (
                  <div className="bg-red-50/80 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-[12px] font-semibold animate-in fade-in duration-200">
                    <AlertCircle size={16} />
                    {errorPasado ? "La hora de inicio seleccionada ya pasó." : "La hora de término debe ser posterior a la de inicio."}
                  </div>
                )}

                {/* FILA 3: Ubicación (Ancho completo 100%) */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">Ubicación <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A89F91] group-focus-within:text-[#5A431C] transition-colors">
                      <MapPin size={16} strokeWidth={2.5} />
                    </div>
                    <input 
                      required 
                      name="ubicacion" 
                      value={ubicacion} 
                      onChange={(e) => setUbicacion(e.target.value)} 
                      placeholder="Ej. Templo Parroquial o Salón 3" 
                      className="w-full h-[46px] bg-[#F4F2EE] border border-[#E8E2DA] rounded-[12px] pl-10 pr-4 text-[14px] font-medium text-[#211814] focus:bg-white focus:border-[#5A431C] focus:ring-2 focus:ring-[#5A431C]/15 transition-all shadow-sm outline-none placeholder:text-[#A89F91]" 
                    />
                  </div>
                </div>

                {/* FILA 4: Descripción */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">Descripción (Opcional)</label>
                  <textarea 
                    name="descripcion" 
                    rows={2} 
                    placeholder="Notas o detalles importantes..." 
                    className="w-full bg-[#F4F2EE] border border-[#E8E2DA] rounded-[12px] px-4 py-3 text-[14px] font-medium text-[#211814] focus:bg-white focus:border-[#5A431C] focus:ring-2 focus:ring-[#5A431C]/15 transition-all shadow-sm outline-none placeholder:text-[#A89F91] resize-none"
                  ></textarea>
                </div>

                {/* FILA 5: Asistencia Obligatoria */}
                <div className="flex items-center justify-between p-4 bg-[#F9F8F6] rounded-[12px] border border-[#E8E2DA]">
                  <div>
                    <p className="text-[13px] font-semibold text-[#211814]">Asistencia Obligatoria</p>
                    <p className="text-[11px] text-[#8B7355]">Afecta el porcentaje final del usuario</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="obligatorio" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5A431C]"></div>
                  </label>
                </div>

              </div>
            </form>

            <div className="p-5 sm:px-8 border-t border-gray-100 bg-white flex gap-4 shrink-0">
              <button type="button" onClick={cerrarModal} className="w-1/3 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                Cancelar
              </button>
              <button form="form-crear-evento" type="submit" disabled={isSubmitting || !!errorTiempo || !!errorPasado || !fechaSeleccionada} className="w-2/3 bg-[#5A431C] text-white py-3 rounded-xl font-bold hover:bg-[#4a3616] transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-[#5A431C]/30 disabled:shadow-none">
                {isSubmitting ? <><Loader2 size={18} className="animate-spin"/> Guardando</> : "Guardar Evento"}
              </button>
            </div>

          </div>
        </div>
      )}

    </>
  );
}
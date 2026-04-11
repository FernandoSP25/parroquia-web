'use client';

import { useEffect, useState, useMemo } from 'react';
import { eventoService } from '@/app/services/eventos'; // Asegúrate de tener este servicio
import { asistenciaService } from '@/app/services/asistencia';
import { Evento, TipoEvento } from '@/app/types';
import { tipoEventoService } from '@/app/services/tipoEvento'; // Asegúrate de que la ruta sea correcta
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Loader2,
  X,
  Users,
  CheckCircle,
  AlertCircle,
  ClipboardList,
  Save
} from 'lucide-react';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale/es';
import { useAuth } from '@/app/context/AuthContext';
import Swal from 'sweetalert2';
import { useJsApiLoader, GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import { useRef  } from 'react';
import { ChevronDown } from 'lucide-react';

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

  // AQUÍ ESTÁ LA ACTUALIZACIÓN: Los 4 estados exactos (A, T, F, FJ)
  const estados = [
    { id: 1, label: 'Asistió (A)', icon: '✅', textColor: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200', hoverColor: 'hover:bg-green-100' },
    { id: 2, label: 'Tarde (T)', icon: '⚠️', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', hoverColor: 'hover:bg-yellow-100' },
    { id: 3, label: 'Faltó (F)', icon: '❌', textColor: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200', hoverColor: 'hover:bg-red-100' },
    { id: 4, label: 'Falta Just. (FJ)', icon: '📝', textColor: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', hoverColor: 'hover:bg-blue-100' },
  ];

  // Si por algún motivo el ID no existe, cae por defecto en "Faltó"
  const actual = estados.find(e => e.id === estadoId) || estados[2];

  return (
    <div className={`relative inline-block text-left w-36 ${isOpen ? 'z-50' : 'z-10'}`} ref={dropdownRef}>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-3 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-xl border transition-all duration-200 shadow-sm
          ${actual.bgColor} ${actual.textColor} ${actual.borderColor} hover:opacity-80`}
      >
        <span className="flex items-center gap-1.5 whitespace-nowrap">{actual.icon} {actual.label}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Menú Desplegable */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-40 bg-white rounded-xl shadow-xl border border-[#C0B1A0]/30 z-[999] overflow-hidden py-1 animate-fade-in-up">
          {estados.map((est) => (
            <button
              key={est.id}
              type="button"
              onClick={() => {
                onChange(est.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase transition-colors
                ${estadoId === est.id ? 'bg-gray-50' : 'bg-white'} 
                ${est.hoverColor} ${est.textColor}`}
            >
              {est.icon} {est.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function EventosPage() {
  const { user } = useAuth();
  const ROL_ACTUAL = user?.roles?.[0] || 'ADMIN';

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroVista, setFiltroVista] = useState<'PROXIMOS' | 'PASADOS'>('PROXIMOS');

  // MAPAS
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [coordenadas, setCoordenadas] = useState<{lat: number | null, lng: number | null}>({ lat: null, lng: null });
  const centerDefault = { lat: -8.0561209 , lng: -79.0517475 };
  const [ubicacion, setUbicacion] = useState("");

  // MODAL CREAR EVENTO
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null);
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");

  const [tiposEvento, setTiposEvento] = useState<TipoEvento[]>([]);

  useEffect(() => {
    const loadTipos = async () => {
      const data = await tipoEventoService.getAll();
      setTiposEvento(data);
    };
    loadTipos();
  }, []);

  // --- NUEVOS ESTADOS PARA EL CHECKLIST MANUAL ---
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(null);
  const [alumnosChecklist, setAlumnosChecklist] = useState<AlumnoChecklist[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [guardandoAsistencia, setGuardandoAsistencia] = useState(false);

  const tzoffset = (new Date()).getTimezoneOffset() * 60000;
  const today = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
  
  const [libraries] = useState(['places']);
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries as any,
  });

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

  // ========== FUNCIONES MAPAS Y EVENTOS ==========
  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      setCoordenadas({ lat, lng });

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          setUbicacion(results[0].formatted_address);
        }
      });
    }
  };

  const onLoad = (autoC: google.maps.places.Autocomplete) => setAutocomplete(autoC);
  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        setCoordenadas({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
        setUbicacion(place.name || place.formatted_address || "");
      }
    }
  };

  const fetchEventos = async () => {
    try {
      setLoading(true);
      const data = await eventoService.getAll(undefined, true);
      const filtrados = filtroVista === 'PROXIMOS'
        ? data.filter(e => e.fecha >= today)
        : data.filter(e => e.fecha < today);
      setEventos(filtrados);
    } catch (error) {
      console.error("Error cargando eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventos();
  }, [filtroVista]);

  const cerrarModal = () => {
    setIsModalOpen(false);
    setFechaSeleccionada(null);
    setHoraInicio("");
    setHoraFin("");
    setCoordenadas({ lat: null, lng: null });
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
      latitud: coordenadas.lat, 
      longitud: coordenadas.lng, 
      descripcion: (formData.get("descripcion") as string) || undefined,
      obligatorio: formData.get("obligatorio") === "on",
      requiere_confirmacion: false
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
    <div className="min-h-screen bg-[#F9F8F6] pb-20 relative font-sans text-[#211814]">
      {/* HEADER */}
      <div className="bg-white border-b border-[#C0B1A0]/30 px-6 py-6 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#211814]">Control de Asistencia</h1>
            <p className="text-sm text-gray-500 mt-1">Gestiona eventos y la asistencia de tus grupos</p>
          </div>
          <div className="flex w-full md:w-auto items-center gap-4">
            <div className="bg-[#F9F8F6] p-1.5 rounded-xl flex border border-[#C0B1A0]/30 flex-1 md:flex-none">
              <button onClick={() => setFiltroVista('PROXIMOS')} className={`flex-1 md:px-6 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${filtroVista === 'PROXIMOS' ? 'bg-white text-[#5A431C] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Próximos</button>
              <button onClick={() => setFiltroVista('PASADOS')} className={`flex-1 md:px-6 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${filtroVista === 'PASADOS' ? 'bg-white text-[#5A431C] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Historial</button>
            </div>
            {ROL_ACTUAL === 'ADMIN' && (
              <button onClick={() => setIsModalOpen(true)} className="bg-[#5A431C] hover:bg-[#4a3616] text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold tracking-wide transition-transform active:scale-95 shadow-md shrink-0">
                <Plus size={18} /> <span className="hidden sm:inline">Nuevo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LISTA DE EVENTOS */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#5A431C]">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="font-serif font-bold animate-pulse">Sincronizando agenda...</p>
          </div>
        ) : eventos.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-[#C0B1A0]/50 rounded-[2rem] p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-20 h-20 bg-[#F9F8F6] text-[#C0B1A0] rounded-full flex items-center justify-center mb-4"><Calendar size={40} /></div>
            <h3 className="text-2xl font-serif font-bold text-[#211814] mb-2">Agenda limpia</h3>
            <p className="text-gray-500 max-w-sm">No hay eventos programados en esta categoría.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {eventos.map((evento) => {
              const { dia, mes, diaSemana } = formatFecha(evento.fecha);
              return (
                <div key={evento.id} className="bg-white rounded-[2rem] border border-[#C0B1A0]/30 shadow-sm hover:shadow-lg transition-all duration-300 flex overflow-hidden group relative">
                  
                  {/* Borde indicador si es obligatorio */}
                  {evento.obligatorio && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#ca8a04] z-10"></div>}

                  <div className="bg-[#F9F8F6] w-28 flex flex-col items-center justify-center p-4 border-r border-[#C0B1A0]/20 shrink-0">
                    <span className="text-xs font-bold text-[#5A431C] uppercase tracking-widest mb-1">{mes}</span>
                    <span className="text-4xl font-serif font-bold text-[#211814]">{dia}</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide mt-2">{diaSemana}</span>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between relative">
                    <button 
                      onClick={() => handleEliminarEvento(evento.id)} 
                      className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition-colors p-1.5 rounded-full hover:bg-red-50"
                      title="Eliminar evento"
                    >
                      <X size={18} />
                    </button>
                    <div className="pr-6">
                      <h3 className="font-serif font-bold text-xl leading-tight group-hover:text-[#5A431C] transition-colors line-clamp-2">{evento.nombre}</h3>
                      <div className="text-sm text-gray-500 mt-3 space-y-1.5 font-medium">
                        {evento.hora_inicio && (<div className="flex items-center gap-2"><Clock size={16} className="text-[#C0B1A0]" />{formatHora(evento.hora_inicio)} {evento.hora_fin ? `- ${formatHora(evento.hora_fin)}` : ''}</div>)}
                        {evento.ubicacion && (<div className="flex items-center gap-2"><MapPin size={16} className="text-[#C0B1A0]" /><span className="truncate">{evento.ubicacion}</span></div>)}
                      </div>
                    </div>
                    <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
                       <div className="flex -space-x-2 opacity-70">
                         {/* Iconos de usuarios simulados */}
                         <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-gray-500"><Users size={14}/></div>
                       </div>
                       
                       {/* BOTÓN ACTUALIZADO PARA ABRIR CHECKLIST */}
                      <button onClick={() => handleAbrirChecklist(evento)} className="bg-[#5A431C] hover:bg-[#4a3616] text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-md">
                        <ClipboardList size={16} /> Tomar Asistencia
                      </button>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= MODAL CHECKLIST MANUAL ================= */}
      {isChecklistOpen && eventoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#F9F8F6]">
              <div>
                <h3 className="font-serif font-bold text-2xl text-[#211814]">{eventoSeleccionado.nombre}</h3>
                <p className="text-sm text-gray-500 font-medium mt-1">Lista de Confirmantes • {formatFecha(eventoSeleccionado.fecha).dia} de {formatFecha(eventoSeleccionado.fecha).mes}</p>
              </div>
              <button onClick={() => setIsChecklistOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-0 pb-32 min-h-[250px]">
              {loadingChecklist ? (
                 <div className="flex flex-col items-center justify-center py-20 text-[#5A431C]">
                   <Loader2 className="animate-spin mb-4" size={40} />
                   <p className="font-bold">Cargando jovenes...</p>
                 </div>
              ) : alumnosChecklist.length === 0 ? (
                <div className="p-10 text-center text-gray-500">No hay jovenes asignados para este evento.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-white sticky top-0 shadow-sm z-10 text-xs uppercase font-bold text-gray-400">
                    <tr>
                      <th className="px-6 py-4">Alumno</th>
                      <th className="px-6 py-4">Grupo</th>
                      <th className="px-6 py-4 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {alumnosChecklist.map((alumno) => (
                      <tr key={alumno.usuario_id} className="hover:bg-[#F9F8F6] transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#211814]">{alumno.nombres} {alumno.apellidos}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-medium">
                           {alumno.grupo_nombre}
                        </td>
                        <td className="px-6 py-4 text-right ">
                          <EstadoDropdown 
                            estadoId={alumno.estado_id} 
                            onChange={(nuevoId) => handleChangeEstado(alumno.usuario_id, nuevoId)} 
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3">
              <button onClick={() => setIsChecklistOpen(false)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                Cancelar
              </button>
              <button 
                onClick={handleGuardarAsistencia} 
                disabled={guardandoAsistencia || loadingChecklist || alumnosChecklist.length === 0}
                className="bg-[#5A431C] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#4a3616] flex items-center gap-2 disabled:opacity-50 transition-colors shadow-md"
              >
                {guardandoAsistencia ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Guardar Asistencia
              </button>
            </div>

          </div>
        </div>
      )}

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

            <form id="form-crear-evento" onSubmit={handleCrearEvento} className="p-6 sm:p-8 space-y-6 overflow-y-auto">

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nombre del Evento <span className="text-red-500">*</span></label>
                <input required name="nombre" placeholder="Ej. Santa Misa de Apertura" className="w-full bg-[#F9F8F6] border border-[#C0B1A0]/40 rounded-xl px-4 py-3 focus:outline-none focus:border-[#5A431C] focus:ring-1 focus:ring-[#5A431C] transition-all font-medium text-[#211814]" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tipo de Evento <span className="text-red-500">*</span></label>
                <select 
                  required 
                  name="tipo_id" 
                  className="w-full bg-[#F9F8F6] border border-[#C0B1A0]/40 rounded-xl px-4 py-3 focus:outline-none focus:border-[#5A431C] font-medium text-[#211814]"
                >
                  <option value="">Seleccione un tipo...</option>
                  {tiposEvento.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.icono} {tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Fecha <span className="text-red-500">*</span></label>
                  <DatePicker
                    selected={fechaSeleccionada}
                    onChange={(date: Date | null) => setFechaSeleccionada(date)}
                    dateFormat="dd/MM/yyyy"
                    locale="es"
                    minDate={new Date()}
                    placeholderText="dd/mm/aaaa"
                    className="w-full bg-[#F9F8F6] border border-[#C0B1A0]/40 rounded-xl px-4 py-3 focus:outline-none focus:border-[#5A431C] focus:ring-1 focus:ring-[#5A431C] transition-all font-medium text-[#211814]"
                    wrapperClassName="w-full"
                  />
                </div>
                <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Hora Inicio</label>
                <select 
                  name="hora_inicio" 
                  value={horaInicio}
                  onChange={(e) => {
                    setHoraInicio(e.target.value);
                    setHoraFin(""); // Limpiamos la hora fin si cambian el inicio
                  }}
                  disabled={!fechaSeleccionada} // Bloqueado hasta que elijan fecha
                  className={`w-full bg-[#F9F8F6] border ${errorPasado ? 'border-red-500 text-red-600 focus:ring-red-500' : 'border-[#C0B1A0]/40 focus:border-[#5A431C] focus:ring-[#5A431C]'} rounded-xl px-4 py-3 focus:outline-none focus:ring-1 transition-all font-medium disabled:opacity-50`} 
                >
                  <option value="">Seleccione...</option>
                  {opcionesHoraInicio.map((hora) => (
                    <option key={hora} value={hora}>{hora}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Hora Fin</label>
                <select 
                  name="hora_fin" 
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  disabled={!horaInicio} // UX Premium: Bloqueado hasta que elijan inicio
                  className={`w-full bg-[#F9F8F6] border ${errorTiempo ? 'border-red-500 text-red-600 focus:ring-red-500' : 'border-[#C0B1A0]/40 focus:border-[#5A431C] focus:ring-[#5A431C]'} rounded-xl px-4 py-3 focus:outline-none focus:ring-1 transition-all font-medium disabled:opacity-50`} 
                >
                  <option value="">Seleccione...</option>
                  {opcionesHoraFin.map((hora) => (
                    <option key={hora} value={hora}>{hora}</option>
                  ))}
                </select>
              </div>
              </div>

              {(errorPasado || errorTiempo) && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold animate-fade-in">
                  <AlertCircle size={18} />
                  {errorPasado ? "La hora de inicio seleccionada ya pasó." : "La hora de término debe ser posterior a la de inicio."}
                </div>
              )}

              <div className="bg-[#F9F8F6] p-5 rounded-2xl border border-[#C0B1A0]/30 space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lugar / Dirección <span className="text-red-500">*</span></label>
                    {isLoaded ? (
                      <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged} options={{ componentRestrictions: { country: "pe" } }}>
                        <input 
                          required 
                          type="text" 
                          name="ubicacion" 
                          value={ubicacion}
                          onChange={(e) => setUbicacion(e.target.value)}
                          placeholder="Ej. Templo Parroquial o Casa de Retiro" 
                          className="w-full bg-white border border-[#C0B1A0]/40 rounded-xl px-4 py-3 focus:outline-none focus:border-[#5A431C] transition-all font-medium text-[#211814] shadow-sm" 
                        />
                      </Autocomplete>
                    ) : (
                      <input 
                        required 
                        type="text" 
                        name="ubicacion" 
                        placeholder="Cargando buscador..." 
                        className="w-full bg-white border border-[#C0B1A0]/40 rounded-xl px-4 py-3 focus:outline-none focus:border-[#5A431C] transition-all font-medium text-[#211814] shadow-sm" 
                      />
                    )}
                  </div>
                
                <div>
                  <label className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ubicación Exacta (GPS)</span>
                    <span className="text-[10px] text-gray-400 font-medium">Clic en el mapa para fijar</span>
                  </label>
                  
                  {isLoaded ? (
                    <div className="w-full h-48 rounded-xl overflow-hidden border border-[#C0B1A0]/40 shadow-sm relative">
                      <GoogleMap 
                            mapContainerStyle={{ width: '100%', height: '100%' }} 
                            center={(coordenadas.lat !== null && coordenadas.lng !== null) 
                              ? { lat: coordenadas.lat, lng: coordenadas.lng } 
                              : centerDefault
                            } 
                            zoom={15} 
                            onClick={handleMapClick} 
                            options={{ disableDefaultUI: true, zoomControl: true, streetViewControl: false }}
                          >
                            {coordenadas.lat !== null && coordenadas.lng !== null && (
                              <Marker 
                                position={{ lat: coordenadas.lat, lng: coordenadas.lng }} 
                                animation={google.maps.Animation.DROP} 
                              />
                            )}
                          </GoogleMap>
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-white rounded-xl flex flex-col items-center justify-center border border-gray-200"><Loader2 className="animate-spin text-[#C0B1A0] mb-2" size={24} /><span className="text-xs text-gray-500">Cargando mapa...</span></div>
                  )}

                  {coordenadas.lat ? (
                    <p className="text-[10.5px] text-[#166534] font-bold mt-2 flex items-center gap-1.5 bg-[#166534]/10 p-2 rounded-lg"><CheckCircle size={14} /> Marcador GPS guardado correctamente.</p>
                  ) : (
                    <p className="text-[10.5px] text-[#ca8a04] font-bold mt-2 flex items-center gap-1.5 bg-[#ca8a04]/10 p-2 rounded-lg"><MapPin size={14} /> Se requiere fijar un marcador para validar asistencia.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Descripción (Opcional)</label>
                <textarea name="descripcion" rows={2} placeholder="Agrega notas o detalles importantes..." className="w-full bg-[#F9F8F6] border border-[#C0B1A0]/40 rounded-xl px-4 py-3 focus:outline-none focus:border-[#5A431C] transition-all font-medium text-[#211814] resize-none"></textarea>
              </div>

              <div className="flex items-center gap-3 p-4 bg-[#ca8a04]/5 border border-[#ca8a04]/20 rounded-xl hover:bg-[#ca8a04]/10 transition-colors">
                <input type="checkbox" name="obligatorio" id="obligatorio" className="w-5 h-5 text-[#5A431C] rounded border-[#C0B1A0] focus:ring-[#5A431C] cursor-pointer" />
                <label htmlFor="obligatorio" className="text-sm font-bold text-[#ca8a04] cursor-pointer select-none flex-1">
                  Marcar este evento como de asistencia obligatoria
                </label>
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
    </div>
  );
}
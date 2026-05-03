'use client';

import { useEffect, useState, useRef } from 'react';
import { eventoService } from '@/app/services/eventos'; 
import { asistenciaService } from '@/app/services/asistencia';
import { Evento } from '@/app/types';
import {
  Calendar,
  Clock,
  MapPin,
  Loader2,
  X,
  Users,
  ClipboardList,
  Save,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import Swal from 'sweetalert2';

// --- INTERFAZ PARA EL CHECKLIST ---
interface AlumnoChecklist {
  confirmante_id: string;
  usuario_id: string;
  nombres: string;
  apellidos: string;
  grupo_nombre: string; // El backend lo puede seguir mandando, pero ya no lo mostraremos
  estado_id: number;
  observaciones: string | null;
}

// --- COMPONENTE DROPDOWN DE ESTADOS ---
const EstadoDropdown = ({ 
  estadoId, 
  onChange 
}: { 
  estadoId: number; 
  onChange: (id: number) => void; 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const estados = [
    { id: 1, label: 'Asistió (A)', icon: '✅', textColor: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200', hoverColor: 'hover:bg-green-100' },
    { id: 2, label: 'Tarde (T)', icon: '⚠️', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', hoverColor: 'hover:bg-yellow-100' },
    { id: 3, label: 'Faltó (F)', icon: '❌', textColor: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200', hoverColor: 'hover:bg-red-100' },
    { id: 4, label: 'Falta Just. (FJ)', icon: '📝', textColor: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', hoverColor: 'hover:bg-blue-100' },
  ];

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

// --- FUNCIÓN PARA BLOQUEAR EVENTOS PASADOS ---
const isEventoFinalizado = (fechaStr: string, horaFinStr?: string) => {
  const ahora = new Date();
  const horaReal = horaFinStr ? horaFinStr : '23:59:00';
  const fechaEvento = new Date(`${fechaStr}T${horaReal}`);
  return ahora > fechaEvento; 
};

export default function AsistenciaCatequistaPage() {
  const { user } = useAuth();
  
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroVista, setFiltroVista] = useState<'PROXIMOS' | 'PASADOS'>('PROXIMOS');

  // ESTADOS DEL CHECKLIST
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(null);
  const [alumnosChecklist, setAlumnosChecklist] = useState<AlumnoChecklist[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [guardandoAsistencia, setGuardandoAsistencia] = useState(false);

  const fetchEventos = async () => {
    try {
      setLoading(true);
      // Trae los eventos programados
      const data = await eventoService.getProximos();
      
      const filtrados = data.filter(e => {
        const terminado = isEventoFinalizado(e.fecha, e.hora_fin);
        return filtroVista === 'PROXIMOS' ? !terminado : terminado;
      });
      
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

  // --- ABRIR LISTA DE ASISTENCIA ---
  const handleAbrirChecklist = async (evento: Evento) => {
    setEventoSeleccionado(evento);
    setIsChecklistOpen(true);
    setLoadingChecklist(true);
    
    try {
      // ⚠️ IMPORTANTE: Este endpoint en el backend debe detectar el ID del catequista logueado
      // y devolver SOLO los alumnos de su grupo.
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

  return (
    <div className="min-h-screen bg-[#F9F8F6] pb-20 relative font-sans text-[#211814]">
      {/* HEADER CATEQUISTA */}
      <div className="bg-white border-b border-[#C0B1A0]/30 px-6 py-6 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#211814]">Asistencia de mi Grupo</h1>
            <p className="text-sm text-gray-500 mt-1">Registra la participación de tus jóvenes en las sesiones</p>
          </div>
          <div className="flex w-full md:w-auto items-center gap-4">
            <div className="bg-[#F9F8F6] p-1.5 rounded-xl flex border border-[#C0B1A0]/30 flex-1 md:flex-none">
              <button onClick={() => setFiltroVista('PROXIMOS')} className={`flex-1 md:px-6 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${filtroVista === 'PROXIMOS' ? 'bg-white text-[#5A431C] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Pendientes</button>
              <button onClick={() => setFiltroVista('PASADOS')} className={`flex-1 md:px-6 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${filtroVista === 'PASADOS' ? 'bg-white text-[#5A431C] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Historial</button>
            </div>
          </div>
        </div>
      </div>

      {/* LISTA DE EVENTOS */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#5A431C]">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="font-serif font-bold animate-pulse">Cargando eventos...</p>
          </div>
        ) : eventos.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-[#C0B1A0]/50 rounded-[2rem] p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-20 h-20 bg-[#F9F8F6] text-[#C0B1A0] rounded-full flex items-center justify-center mb-4"><Calendar size={40} /></div>
            <h3 className="text-2xl font-serif font-bold text-[#211814] mb-2">No hay sesiones</h3>
            <p className="text-gray-500 max-w-sm">No tienes eventos programados en esta categoría.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {eventos.map((evento) => {
              const { dia, mes, diaSemana } = formatFecha(evento.fecha);
              const eventoTerminado = isEventoFinalizado(evento.fecha, evento.hora_fin);

              return (
                <div key={evento.id} className={`bg-white rounded-[2rem] border shadow-sm hover:shadow-lg transition-all duration-300 flex overflow-hidden group relative ${eventoTerminado ? 'border-gray-200 opacity-80' : 'border-[#C0B1A0]/30'}`}>
                  
                  {evento.obligatorio && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#ca8a04] z-10"></div>}

                  <div className="bg-[#F9F8F6] w-28 flex flex-col items-center justify-center p-4 border-r border-gray-200 shrink-0">
                    <span className="text-xs font-bold text-[#5A431C] uppercase tracking-widest mb-1">{mes}</span>
                    <span className="text-4xl font-serif font-bold text-[#211814]">{dia}</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide mt-2">{diaSemana}</span>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col justify-between relative">
                    
                    <div className="pr-6">
                      <h3 className="font-serif font-bold text-xl leading-tight group-hover:text-[#5A431C] transition-colors line-clamp-2">{evento.nombre}</h3>
                      <div className="text-sm text-gray-500 mt-3 space-y-1.5 font-medium">
                        {evento.hora_inicio && (<div className="flex items-center gap-2"><Clock size={16} className="text-[#C0B1A0]" />{formatHora(evento.hora_inicio)} {evento.hora_fin ? `- ${formatHora(evento.hora_fin)}` : ''}</div>)}
                        {evento.ubicacion && (<div className="flex items-center gap-2"><MapPin size={16} className="text-[#C0B1A0]" /><span className="truncate">{evento.ubicacion}</span></div>)}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap sm:flex-nowrap gap-4 justify-start items-center">
                    <div className="flex -space-x-2 opacity-70 shrink-0">
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-gray-500"><Users size={14}/></div>
                    </div>
                    
                    <button 
                      onClick={() => handleAbrirChecklist(evento)} 
                      className={`w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shrink-0
                        ${eventoTerminado ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-[#5A431C] hover:bg-[#4a3616] text-white'}`}
                    >
                      <ClipboardList size={16} className="shrink-0" /> 
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

      {/* ================= MODAL CHECKLIST MANUAL (SIN COLUMNA GRUPO) ================= */}
      {isChecklistOpen && eventoSeleccionado && (() => {
        const modalTerminado = isEventoFinalizado(eventoSeleccionado.fecha, eventoSeleccionado.hora_fin);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#F9F8F6]">
                <div>
                  <h3 className="font-serif font-bold text-2xl text-[#211814]">{eventoSeleccionado.nombre}</h3>
                  <p className="text-sm text-gray-500 font-medium mt-1">Lista de mi grupo • {formatFecha(eventoSeleccionado.fecha).dia} de {formatFecha(eventoSeleccionado.fecha).mes}</p>
                </div>
                <button onClick={() => setIsChecklistOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-0 pb-32 min-h-[250px]">
                {loadingChecklist ? (
                   <div className="flex flex-col items-center justify-center py-20 text-[#5A431C]">
                     <Loader2 className="animate-spin mb-4" size={40} />
                     <p className="font-bold">Cargando a tus jóvenes...</p>
                   </div>
                ) : alumnosChecklist.length === 0 ? (
                  <div className="p-10 text-center text-gray-500">No hay jóvenes asignados a tu grupo para este evento.</div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white sticky top-0 shadow-sm z-10 text-xs uppercase font-bold text-gray-400">
                      <tr>
                        <th className="px-6 py-4">Joven Confirmante</th>
                        {/* 🚫 Se eliminó la cabecera de "Grupo" */}
                        <th className="px-6 py-4 text-right">Asistencia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {alumnosChecklist.map((alumno, index) => (
                        <tr key={alumno.usuario_id} className="hover:bg-[#F9F8F6] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {/* Opcional: Un numerito para que el catequista se guíe en su lista */}
                              <span className="text-xs text-gray-400 font-bold w-4">{index + 1}.</span>
                              <div className="font-bold text-[#211814]">{alumno.nombres} {alumno.apellidos}</div>
                            </div>
                          </td>
                          {/* 🚫 Se eliminó el <td> del Grupo */}
                          <td className="px-6 py-4 text-right">
                            
                            {modalTerminado ? (
                               <div className={`inline-block text-[11px] sm:text-xs font-bold uppercase px-3 py-2 rounded-xl border
                                  ${alumno.estado_id === 1 ? 'bg-green-50 text-green-700 border-green-200' : 
                                    alumno.estado_id === 2 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                                    alumno.estado_id === 4 ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                    'bg-red-50 text-red-700 border-red-200'}`}
                               >
                                 {alumno.estado_id === 1 ? '✅ Asistió' : alumno.estado_id === 2 ? '⚠️ Tarde' : alumno.estado_id === 4 ? '📝 Falta Just.' : '❌ Faltó'}
                               </div>
                            ) : (
                              <EstadoDropdown 
                                estadoId={alumno.estado_id} 
                                onChange={(nuevoId) => handleChangeEstado(alumno.usuario_id, nuevoId)} 
                              />
                            )}

                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3">
                <button onClick={() => setIsChecklistOpen(false)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                  {modalTerminado ? 'Cerrar' : 'Cancelar'}
                </button>
                
                {!modalTerminado && (
                  <button 
                    onClick={handleGuardarAsistencia} 
                    disabled={guardandoAsistencia || loadingChecklist || alumnosChecklist.length === 0}
                    className="bg-[#5A431C] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#4a3616] flex items-center gap-2 disabled:opacity-50 transition-colors shadow-md"
                  >
                    {guardandoAsistencia ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Guardar Asistencia
                  </button>
                )}
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
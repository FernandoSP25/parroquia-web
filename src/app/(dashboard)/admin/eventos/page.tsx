'use client';

import { useEffect, useState } from 'react';
import { eventoService } from '@/app/services/eventos';
import { Evento } from '@/app/types';
import { Calendar, Clock, MapPin, Plus, Loader2, X } from 'lucide-react'; // Añadí la X para cerrar el modal

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ESTADOS DEL MODAL
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEventos = async () => {
    try {
      setLoading(true);
      const data = await eventoService.getAll(undefined, true); 
      setEventos(data);
    } catch (error) {
      console.error("Error cargando eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventos();
  }, []);

  // --- MANEJADOR DEL FORMULARIO ---
  const handleCrearEvento = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Construimos el payload tal como lo pide el Backend
    const payload = {
      nombre: formData.get("nombre") as string,
      fecha: formData.get("fecha") as string,
      hora_inicio: (formData.get("hora_inicio") as string) || undefined,
      hora_fin: (formData.get("hora_fin") as string) || undefined,
      ubicacion: (formData.get("ubicacion") as string) || undefined,
      descripcion: (formData.get("descripcion") as string) || undefined,
      obligatorio: formData.get("obligatorio") === "on", // Los checkbox devuelven "on" si están marcados
      requiere_confirmacion: false
    };

    try {
      await eventoService.create(payload);
      setIsModalOpen(false); // Cerramos el modal
      fetchEventos(); // Recargamos la lista para ver el nuevo evento
    } catch (error) {
      console.error("Error al crear:", error);
      alert("Hubo un error al crear el evento. Revisa la consola.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Funciones de formateo (Se mantienen igual)
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
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-[#F9F8F6] font-sans pb-20 relative">
      
      {/* HEADER MINIMALISTA */}
      <div className="bg-white border-b border-[#C0B1A0]/30 px-8 py-8 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#211814]">Agenda Parroquial</h1>
            <p className="text-sm text-gray-500 mt-1">Programación de actividades y catequesis.</p>
          </div>
          
          {/* BOTÓN CON ACCIÓN */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#5A431C] hover:bg-[#4a3616] text-white px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all shadow-md flex items-center gap-2 active:scale-95"
          >
            <Plus size={18} /> Nuevo Evento
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#5A431C]">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="font-serif">Cargando agenda...</p>
          </div>
        ) : eventos.length === 0 ? (
          <div className="bg-white border border-dashed border-[#C0B1A0] rounded-3xl p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-[#F9F8F6] text-[#C0B1A0] rounded-full flex items-center justify-center mb-4">
              <Calendar size={32} />
            </div>
            <h3 className="text-xl font-bold text-[#211814] mb-2">No hay eventos próximos</h3>
            <p className="text-gray-500 max-w-sm">No se ha programado ninguna actividad futura. Haz clic en "Nuevo Evento" para empezar.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {eventos.map((evento) => {
              const { dia, mes, diaSemana } = formatFecha(evento.fecha);
              return (
                <div key={evento.id} className="bg-white rounded-2xl border border-[#C0B1A0]/20 shadow-sm hover:shadow-md transition-shadow flex overflow-hidden group">
                  <div className="bg-[#F9F8F6] w-28 flex flex-col items-center justify-center border-r border-[#C0B1A0]/20 p-4 shrink-0">
                    <span className="text-xs font-bold text-[#5A431C] uppercase tracking-wider mb-1">{mes}</span>
                    <span className="text-4xl font-serif font-bold text-[#211814] leading-none">{dia}</span>
                    <span className="text-[10px] text-gray-500 capitalize mt-2 truncate w-full text-center">{diaSemana}</span>
                  </div>
                  <div className="p-5 md:p-6 flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h3 className="text-lg md:text-xl font-bold text-[#211814] group-hover:text-[#5A431C] transition-colors leading-tight">
                        {evento.nombre}
                      </h3>
                      {evento.obligatorio && (
                        <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest shrink-0">
                          Obligatorio
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-sm text-gray-600">
                      {evento.hora_inicio && (
                        <div className="flex items-center gap-1.5">
                          <Clock size={16} className="text-[#C0B1A0]" />
                          <span>{formatHora(evento.hora_inicio)} {evento.hora_fin ? `- ${formatHora(evento.hora_fin)}` : ''}</span>
                        </div>
                      )}
                      {evento.ubicacion && (
                        <div className="flex items-center gap-1.5">
                          <MapPin size={16} className="text-[#C0B1A0]" />
                          <span className="truncate max-w-[200px] md:max-w-xs">{evento.ubicacion}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= MODAL CREAR EVENTO ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop con Blur */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          ></div>

          {/* Caja del Modal */}
          <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in-up">
            
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-[#F9F8F6]">
              <h2 className="font-serif font-bold text-xl text-[#211814]">Nuevo Evento</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-black/5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleCrearEvento} className="p-6">
              <div className="space-y-4">
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Nombre del Evento *</label>
                  <input required name="nombre" type="text" placeholder="Ej: Misa de Domingo" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#C0B1A0] focus:ring-1 focus:ring-[#C0B1A0] transition-all bg-[#F9F8F6] focus:bg-white" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Fecha *</label>
                    <input 
                      required 
                      name="fecha" 
                      type="date" 
                      min={today} /* 👈 EL TRUCO ESTÁ AQUÍ */
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#C0B1A0] focus:ring-1 focus:ring-[#C0B1A0] transition-all bg-[#F9F8F6] focus:bg-white text-gray-700" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Ubicación</label>
                    <input name="ubicacion" type="text" placeholder="Ej: Templo Principal" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#C0B1A0] focus:ring-1 focus:ring-[#C0B1A0] transition-all bg-[#F9F8F6] focus:bg-white" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Hora Inicio</label>
                    <input name="hora_inicio" type="time" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#C0B1A0] focus:ring-1 focus:ring-[#C0B1A0] transition-all bg-[#F9F8F6] focus:bg-white text-gray-700" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Hora Fin</label>
                    <input name="hora_fin" type="time" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#C0B1A0] focus:ring-1 focus:ring-[#C0B1A0] transition-all bg-[#F9F8F6] focus:bg-white text-gray-700" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Descripción</label>
                  <textarea name="descripcion" rows={2} placeholder="Detalles extra del evento..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#C0B1A0] focus:ring-1 focus:ring-[#C0B1A0] transition-all bg-[#F9F8F6] focus:bg-white resize-none"></textarea>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" name="obligatorio" id="obligatorio" className="w-4 h-4 text-[#5A431C] rounded border-gray-300 focus:ring-[#C0B1A0] cursor-pointer" />
                  <label htmlFor="obligatorio" className="text-sm text-gray-700 font-medium cursor-pointer select-none">
                    La asistencia a este evento es obligatoria
                  </label>
                </div>

              </div>

              {/* Botones del Modal */}
              <div className="mt-8 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#5A431C] text-white font-bold hover:bg-[#4a3616] transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Guardando</> : 'Crear Evento'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
'use client';

import { useEffect, useState, useMemo } from 'react';
import { eventoService } from '@/app/services/eventos';
import { Evento } from '@/app/types';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Loader2,
  X,
  QrCode,
  Users,
  MoreVertical,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import QRCode from "react-qr-code";
import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale/es';
import { qrService } from '@/app/services/qr';
import { useAuth } from '@/app/context/AuthContext';

registerLocale('es', es);

export default function EventosPage() {

  const { user } = useAuth();
  const ROL_ACTUAL = user?.roles?.[0] || 'ADMIN';

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroVista, setFiltroVista] = useState<'PROXIMOS' | 'PASADOS'>('PROXIMOS');

  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [coordenadas, setCoordenadas] = useState<{lat: number | null, lng: number | null}>({ lat: null, lng: null });

  const centerDefault = { lat: -8.0561209 , lng: -79.0517475 };

  // MODAL CREAR
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NUEVOS ESTADOS: Control en tiempo real de las horas
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null);
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");

  // MODAL QR
  const [eventoSeleccionadoQR, setEventoSeleccionadoQR] = useState<Evento | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const today = new Date().toISOString().split('T')[0];
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  // ========== LÓGICA DE VALIDACIÓN EN TIEMPO REAL ==========
  const ahora = new Date();
  const esHoy = fechaSeleccionada &&
    fechaSeleccionada.getDate() === ahora.getDate() &&
    fechaSeleccionada.getMonth() === ahora.getMonth() &&
    fechaSeleccionada.getFullYear() === ahora.getFullYear();

  // Calcula la hora actual en formato HH:mm si la fecha es hoy
  const minHoraInicio = esHoy 
    ? `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}` 
    : undefined;

  // Errores dinámicos que bloquean la UI inmediatamente
  const errorPasado = esHoy && horaInicio && minHoraInicio && horaInicio < minHoraInicio;
  const errorTiempo = horaInicio && horaFin && horaFin <= horaInicio;
  // =========================================================

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      setCoordenadas({ lat: event.latLng.lat(), lng: event.latLng.lng() });
    }
  };

  const onLoad = (autoC: google.maps.places.Autocomplete) => setAutocomplete(autoC);
  
  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        setCoordenadas({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        });
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

  // Función para cerrar y limpiar el modal
  const cerrarModal = () => {
    setIsModalOpen(false);
    setFechaSeleccionada(null);
    setHoraInicio("");
    setHoraFin("");
  };

  const handleCrearEvento = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Si los errores visuales están activos, evitamos que un hacker envíe el form
    if (!fechaSeleccionada || errorTiempo || errorPasado) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const year = fechaSeleccionada.getFullYear();
    const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
    const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
    const fechaBackend = `${year}-${month}-${day}`;

    const payload = {
      nombre: formData.get("nombre") as string,
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
    } catch (error) {
      alert("Error al crear evento.");
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

  const handleAbrirQR = async (evento: Evento) => {
    setEventoSeleccionadoQR(evento);
    setQrToken(null); // Limpiamos la UI para mostrar el estado "Generando..."
    
    try {
      // Llamada limpia y tipada a nuestra capa de servicios
      const response = await qrService.generar({
        evento_id: evento.id,
        rol_generador: ROL_ACTUAL as 'ADMIN' | 'CATEQUISTA'
      });
      
      // Seteamos el string real que dibujará el QR (ej: "SJMV-1234-abcd...")
      setQrToken(response.token_completo);
      
    } catch (error) {
      console.error("Error al generar el QR:", error);
      alert("Hubo un problema de conexión al generar el acceso QR.");
      setEventoSeleccionadoQR(null); // Cerramos el modal si falla
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] pb-20 relative font-sans text-[#211814]">
      {/* ... HEADER Y CONTENIDO SE MANTIENEN EXACTAMENTE IGUAL ... */}
      <div className="bg-white border-b border-[#C0B1A0]/30 px-6 py-6 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#211814]">Control de Asistencia</h1>
            <p className="text-sm text-gray-500 mt-1">Gestiona eventos y genera accesos QR</p>
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
                <div key={evento.id} className="bg-white rounded-[2rem] border border-[#C0B1A0]/30 shadow-sm hover:shadow-lg transition-all duration-300 flex overflow-hidden group">
                  <div className="bg-[#F9F8F6] w-28 flex flex-col items-center justify-center p-4 border-r border-[#C0B1A0]/20 shrink-0">
                    <span className="text-xs font-bold text-[#5A431C] uppercase tracking-widest mb-1">{mes}</span>
                    <span className="text-4xl font-serif font-bold text-[#211814]">{dia}</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide mt-2">{diaSemana}</span>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between relative">
                    <button className="absolute top-4 right-4 text-gray-400 hover:text-[#5A431C] transition-colors p-1.5 rounded-full hover:bg-[#F9F8F6]"><MoreVertical size={18} /></button>
                    <div className="pr-6">
                      <div className="flex items-center gap-2 mb-1">
                        {evento.obligatorio && (<span className="bg-[#ca8a04]/10 text-[#ca8a04] border border-[#ca8a04]/20 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Obligatorio</span>)}
                      </div>
                      <h3 className="font-serif font-bold text-xl leading-tight group-hover:text-[#5A431C] transition-colors line-clamp-2">{evento.nombre}</h3>
                      <div className="text-sm text-gray-500 mt-3 space-y-1.5 font-medium">
                        {evento.hora_inicio && (<div className="flex items-center gap-2"><Clock size={16} className="text-[#C0B1A0]" />{formatHora(evento.hora_inicio)} {evento.hora_fin ? `- ${formatHora(evento.hora_fin)}` : ''}</div>)}
                        {evento.ubicacion && (<div className="flex items-center gap-2"><MapPin size={16} className="text-[#C0B1A0]" /><span className="truncate">{evento.ubicacion}</span></div>)}
                      </div>
                    </div>
                    <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
                       <div className="flex -space-x-2 opacity-70 group-hover:opacity-100 transition-opacity">
                         <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200"></div>
                         <div className="w-8 h-8 rounded-full border-2 border-white bg-[#C0B1A0]"></div>
                         <div className="w-8 h-8 rounded-full border-2 border-white bg-[#F9F8F6] flex items-center justify-center text-[10px] font-bold text-[#5A431C]">+</div>
                       </div>
                      <button onClick={() => handleAbrirQR(evento)} className="bg-[#F9F8F6] border border-[#C0B1A0]/30 hover:bg-[#5A431C] hover:text-white hover:border-[#5A431C] text-[#5A431C] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all">
                        <QrCode size={16} /> Ver QR
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= MODAL QR ================= */}
      {eventoSeleccionadoQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEventoSeleccionadoQR(null)}></div>
          <div className="relative bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden animate-bounce-in flex flex-col border border-white/20">
            <div className="bg-[#5A431C] p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <button onClick={() => setEventoSeleccionadoQR(null)} className="absolute top-5 right-5 text-white/50 hover:text-white transition-colors"><X size={24} /></button>
              <div className="bg-white/10 border border-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white backdrop-blur-md"><QrCode size={32} /></div>
              <h2 className="font-serif font-bold text-white text-2xl leading-tight mb-2">{eventoSeleccionadoQR.nombre}</h2>
              <p className="text-[#C0B1A0] text-sm font-medium flex items-center justify-center gap-1.5"><Calendar size={14} /> {formatFecha(eventoSeleccionadoQR.fecha).dia} de {formatFecha(eventoSeleccionadoQR.fecha).mes}</p>
            </div>
            <div className="p-8 flex flex-col items-center bg-[#F9F8F6] relative">
              <div className="absolute -top-4 bg-white px-5 py-2 rounded-full border border-[#C0B1A0]/30 text-xs font-bold text-[#5A431C] uppercase tracking-widest flex items-center gap-2 shadow-sm">
                <Users size={16} />{ROL_ACTUAL === 'ADMIN' ? 'Catequistas' : 'Confirmantes'}
              </div>
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-[#C0B1A0]/30 w-56 h-56 flex items-center justify-center mt-4">
                 {!qrToken ? (
                  <div className="flex flex-col items-center justify-center text-[#C0B1A0]"><Loader2 size={32} className="animate-spin mb-3" /><span className="text-xs font-bold uppercase tracking-widest">Generando...</span></div>
                ) : (
                  <div className="w-full h-full animate-fade-in"><QRCode value={`${eventoSeleccionadoQR.id}-${qrToken}`} size={256} style={{ height: "auto", maxWidth: "100%", width: "100%" }} viewBox={`0 0 256 256`} fgColor="#211814" /></div>
                )}
              </div>
              <p className="text-center text-gray-500 text-xs mt-6 leading-relaxed max-w-[250px] font-medium">
                {ROL_ACTUAL === 'ADMIN' ? "Pide a tus catequistas que escaneen este código para registrar su asistencia." : "Muestra este código a tus confirmantes para registrar su llegada."}
              </p>
            </div>
            <div className="p-5 bg-white border-t border-[#C0B1A0]/20">
               <button className="w-full py-3.5 rounded-2xl bg-[#F9F8F6] text-[#5A431C] font-bold text-sm hover:bg-[#EBE5E0] transition-colors border border-[#C0B1A0]/30 flex items-center justify-center gap-2">
                 <CheckCircle size={18} /> Ver Lista de Asistencia
               </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL CREAR EVENTO ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
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
                  <input 
                    type="time" 
                    name="hora_inicio" 
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    min={minHoraInicio} // Propiedad nativa HTML para bloquear dropdown
                    className={`w-full bg-[#F9F8F6] border ${errorPasado ? 'border-red-500 text-red-600 focus:ring-red-500' : 'border-[#C0B1A0]/40 focus:border-[#5A431C] focus:ring-[#5A431C]'} rounded-xl px-4 py-3 focus:outline-none focus:ring-1 transition-all font-medium`} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Hora Fin</label>
                  <input 
                    type="time" 
                    name="hora_fin" 
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    min={horaInicio || minHoraInicio} // El dropdown bloquea horas anteriores al inicio
                    className={`w-full bg-[#F9F8F6] border ${errorTiempo ? 'border-red-500 text-red-600 focus:ring-red-500' : 'border-[#C0B1A0]/40 focus:border-[#5A431C] focus:ring-[#5A431C]'} rounded-xl px-4 py-3 focus:outline-none focus:ring-1 transition-all font-medium`} 
                  />
                </div>
              </div>

              {/* MENSAJE DE ERROR VISUAL (Aparece si intentan forzar la hora manual) */}
              {(errorPasado || errorTiempo) && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold animate-fade-in">
                  <AlertCircle size={18} />
                  {errorPasado ? "La hora de inicio seleccionada ya pasó." : "La hora de término debe ser posterior a la de inicio."}
                </div>
              )}

              <div className="bg-[#F9F8F6] p-5 rounded-2xl border border-[#C0B1A0]/30 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lugar / Dirección <span className="text-red-500">*</span></label>
                  <input required type="text" name="ubicacion" placeholder="Ej. Templo Parroquial o Casa de Retiro" className="w-full bg-white border border-[#C0B1A0]/40 rounded-xl px-4 py-3 focus:outline-none focus:border-[#5A431C] transition-all font-medium text-[#211814] shadow-sm" />
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
                            {/* Solo dibujamos el marcador si tenemos coordenadas numéricas válidas */}
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
              
              {/* MAGIA AQUÍ: El botón se bloquea solo si hay error de tiempo o fecha vacía */}
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
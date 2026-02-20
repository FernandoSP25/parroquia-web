"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Eye, Edit, X, Save, CheckCircle, AlertCircle, Clock } from "lucide-react";

// 1. IMPORTAMOS EL SERVICIO Y LOS TIPOS
import { inscripcionService } from "@/app/services/inscripcion";
import { Inscripcion } from "@/app/types";

// --- TEMA DE COLORES (Para referencia) ---
// Primary: #5A431C (Marrón Tierra)
// Dark:    #211814 (Casi Negro)
// Accent:  #C0B1A0 (Beige/Arena)
// Bg:      #F9F8F6 (Crema)

export default function InscripcionesPage() {
  const [data, setData] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  
  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInscripcion, setSelectedInscripcion] = useState<Inscripcion | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  // Update
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [nuevasNotas, setNuevasNotas] = useState("");

  useEffect(() => {
    fetchInscripciones();
  }, []);

  const fetchInscripciones = async () => {
    try {
      setLoading(true);
      const resultado = await inscripcionService.getAll();
      setData(resultado);
    } catch (error) {
      console.error("Error cargando inscripciones:", error);
      alert("No se pudieron cargar las inscripciones. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedInscripcion) return;
    try {
      await inscripcionService.updateEstado(selectedInscripcion.id, nuevoEstado);       
      alert("¡Guardado correctamente!");
      setModalOpen(false);
      fetchInscripciones();
    } catch (error) {
      console.error("Error actualizando:", error);
      alert("Hubo un error al guardar los cambios.");
    }
  };

  const openModal = (inscripcion: Inscripcion, mode: 'view' | 'edit') => {
    setSelectedInscripcion(inscripcion);
    setNuevoEstado(inscripcion.estado);
    setNuevasNotas(inscripcion.notas_internas || "");
    setEditMode(mode === 'edit');
    setModalOpen(true);
  };

  // --- BADGES PERSONALIZADOS CON TUS COLORES ---
  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "PENDIENTE": 
        return (
          <span className="px-3 py-1 rounded-full bg-[#ca8a04]/10 text-[#ca8a04] border border-[#ca8a04]/20 text-xs font-bold flex items-center gap-1.5 w-fit">
            <Clock size={14}/> Pendiente
          </span>
        );
      case "CONTACTADO": 
        return (
          <span className="px-3 py-1 rounded-full bg-[#5A431C]/10 text-[#5A431C] border border-[#5A431C]/20 text-xs font-bold flex items-center gap-1.5 w-fit">
            <Eye size={14}/> En Revisión
          </span>
        );
      case "APROBADO": 
        return (
          <span className="px-3 py-1 rounded-full bg-[#166534]/10 text-[#166534] border border-[#166534]/20 text-xs font-bold flex items-center gap-1.5 w-fit">
            <CheckCircle size={14}/> Aprobado
          </span>
        );
      case "RECHAZADO": 
        return (
          <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-bold flex items-center gap-1.5 w-fit">
            <AlertCircle size={14}/> Rechazado
          </span>
        );
      default: 
        return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs">{estado}</span>;
    }
  };

  const filteredData = data.filter((item) => {
    const cumpleTexto = 
      item.nombres.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      item.apellidos.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      item.dni.includes(filtroTexto);
    const cumpleEstado = filtroEstado === "TODOS" || item.estado === filtroEstado;
    return cumpleTexto && cumpleEstado;
  });

  return (
    // FONDO COLOR CREMA (#F9F8F6)
    <div className="p-6 bg-[#F9F8F6] min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* ENCABEZADO */}
        <div className="mb-8 border-l-4 border-[#5A431C] pl-4">
          {/* TÍTULO COLOR TIERRA (#5A431C) */}
          <h1 className="text-3xl font-bold text-[#5A431C]">Bandeja de Inscripciones</h1>
          {/* SUBTÍTULO COLOR ACENTO OSCURO */}
          <p className="text-[#8C7A6B]">Gestiona las solicitudes de Confirmación 2026</p>
        </div>

        {/* BARRA DE HERRAMIENTAS */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#C0B1A0]/30 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-3 text-[#C0B1A0]" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o DNI..." 
              // FOCUS RING COLOR TIERRA
              className="w-full pl-10 pr-4 py-2 border border-[#C0B1A0]/50 text-[#5A431C] rounded-lg focus:ring-2 focus:ring-[#5A431C] focus:border-transparent outline-none transition-all placeholder-[#C0B1A0]"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#F9F8F6] rounded-lg border border-[#C0B1A0]/30">
                <Filter size={18} className="text-[#5A431C]" />
                <select 
                  aria-label="Estados"
                  className="appearance-none bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-transparent text-[#5A431C] font-medium text-sm cursor-pointer pr-4"
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                >
                  <option value="TODOS">Todos los estados</option>
                  <option value="PENDIENTE">Pendientes</option>
                  <option value="CONTACTADO">En Revisión</option>
                  <option value="APROBADO">Aprobados</option>
                  <option value="RECHAZADO" >Rechazados</option>
                </select>
            </div>
          </div>
        </div>

        {/* TABLA */}
        <div className="bg-white rounded-xl shadow-sm border border-[#C0B1A0]/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              {/* HEADER TABLA: FONDO TIERRA MUY SUAVE */}
              <thead className="text-xs uppercase bg-[#5A431C]/5 text-[#5A431C] font-bold">
                <tr>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Nombre Completo</th>
                  <th className="px-6 py-4">Sacramento</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Edad</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C0B1A0]/20">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-10 text-[#C0B1A0]">Cargando datos...</td></tr>
                ) : filteredData.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-[#C0B1A0]">No hay inscripciones encontradas.</td></tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="bg-white hover:bg-[#F9F8F6] transition duration-150">
                      <td className="px-6 py-4 font-medium text-[#8C7A6B]">
                        {new Date(item.fecha_registro).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#211814] text-base">{item.nombres} {item.apellidos}</div>
                        <div className="text-xs text-[#C0B1A0] font-medium mt-0.5">DNI: {item.dni}</div>
                      </td>
                      <td className="px-6 py-4 text-[#5A431C] font-medium">
                        Confirmación
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(item.estado)}
                      </td>
                      <td className="px-6 py-4 text-[#211814]">
                        {item.edad} años
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                            {/* BOTONES DE ACCIÓN: SUAVES */}
                            <button 
                              onClick={() => openModal(item, 'view')}
                              className="p-2 text-[#5A431C] hover:bg-[#5A431C]/10 rounded-lg transition" 
                              title="Ver Detalle"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              onClick={() => openModal(item, 'edit')}
                              className="p-2 text-[#166534] hover:bg-[#166534]/10 rounded-lg transition" 
                              title="Gestionar / Editar"
                            >
                              <Edit size={18} />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL */}
        {modalOpen && selectedInscripcion && (
          <div className="fixed inset-0 bg-[#211814]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[#C0B1A0]/30">
              
              {/* Header Modal */}
              <div className="flex justify-between items-center p-6 border-b border-[#C0B1A0]/30 bg-[#F9F8F6] rounded-t-xl">
                <div>
                    <h2 className="text-xl font-bold text-[#5A431C]">
                    {editMode ? "Gestionar Inscripción" : "Detalle de Inscripción"}
                    </h2>
                    <p className="text-xs text-[#8C7A6B] mt-1">ID Inscripción: #{selectedInscripcion.id}</p>
                </div>
                <button aria-label="cerrar" onClick={() => setModalOpen(false)} className="text-[#C0B1A0] hover:text-red-500 transition">
                  <X size={24} />
                </button>
              </div>

              {/* Contenido */}
              <div className="p-6 space-y-8">
                
                {/* Sección 1 */}
                <div>
                  <h3 className="text-xs font-bold text-[#C0B1A0] tracking-wider uppercase mb-4 border-b border-[#C0B1A0]/30 pb-2">
                    Datos del Postulante
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <InfoCard label="Nombre Completo" value={`${selectedInscripcion.nombres} ${selectedInscripcion.apellidos}`} />
                    <InfoCard label="DNI" value={selectedInscripcion.dni} />
                    <InfoCard label="Edad" value={`${selectedInscripcion.edad} años`} />
                    <InfoCard label="Celular" value={selectedInscripcion.celular_joven} />
                    <div className="md:col-span-2">
                        <InfoCard label="Dirección" value={selectedInscripcion.direccion} />
                    </div>
                  </div>
                </div>

                {/* Sección 2 */}
                <div>
                  <h3 className="text-xs font-bold text-[#C0B1A0] tracking-wider uppercase mb-4 border-b border-[#C0B1A0]/30 pb-2">
                    Datos del Apoderado
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <InfoCard label="Nombre Apoderado" value={selectedInscripcion.nombre_apoderado} />
                    <InfoCard label="Celular Apoderado" value={selectedInscripcion.celular_apoderado} />
                  </div>
                </div>

                {/* Sección 3: Gestión */}
                <div className={`rounded-xl p-5 border transition-all ${editMode ? "bg-[#5A431C]/5 border-[#5A431C]/20" : "bg-gray-50 border-transparent"}`}>
                  <h3 className="text-sm font-bold text-[#5A431C] mb-4 flex items-center gap-2">
                    <Edit size={16} /> Zona de Gestión
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#5A431C] mb-1.5 uppercase">Estado Actual</label>
                      <select     
                        aria-label="Estado"
                        disabled={!editMode}
                        value={nuevoEstado}
                        onChange={(e) => setNuevoEstado(e.target.value)}
                        className="w-full p-2.5 border border-[#C0B1A0]/50 rounded-lg bg-white text-[#211814] focus:ring-2 focus:ring-[#5A431C] outline-none disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <option value="PENDIENTE">PENDIENTE (Sin revisar)</option>
                        <option value="CONTACTADO">CONTACTADO (En revisión)</option>
                        <option value="APROBADO">APROBADO (Aceptado)</option>
                        <option value="RECHAZADO">RECHAZADO (No apto)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-[#5A431C] mb-1.5 uppercase">Notas Internas</label>
                      <textarea 
                        disabled={!editMode}
                        value={nuevasNotas}
                        onChange={(e) => setNuevasNotas(e.target.value)}
                        placeholder="Escribe observaciones privadas..."
                        className="w-full p-3 border border-[#C0B1A0]/50 rounded-lg h-24 bg-white text-[#211814] focus:ring-2 focus:ring-[#5A431C] outline-none disabled:bg-gray-100 disabled:text-gray-400 resize-none"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-6 border-t border-[#C0B1A0]/30 bg-[#F9F8F6] rounded-b-xl flex justify-end gap-3">
                <button 
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 text-[#5A431C] font-medium hover:bg-[#5A431C]/10 rounded-lg transition"
                >
                  Cerrar
                </button>
                {editMode && (
                  <button 
                    onClick={handleUpdate}
                    className="px-5 py-2.5 bg-[#5A431C] text-white font-medium rounded-lg hover:bg-[#3E2D12] shadow-lg shadow-[#5A431C]/20 transition flex items-center gap-2"
                  >
                    <Save size={18} /> Guardar Cambios
                  </button>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente auxiliar para mostrar datos limpios
function InfoCard({ label, value }: { label: string, value: string }) {
    return (
        <div className="bg-white p-3 rounded-lg border border-[#C0B1A0]/20 shadow-sm">
            <span className="block text-[#C0B1A0] text-[10px] font-bold uppercase tracking-wide mb-1">{label}</span>
            <span className="font-semibold text-[#211814] text-base block truncate" title={value}>{value}</span>
        </div>
    )
}
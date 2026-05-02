'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, X, Clock, Loader2, Users, BookMarked, FileText, Filter } from 'lucide-react';
// 👇 Importamos tu nuevo servicio de asistencias
import { asistenciaService } from '@/app/services/asistencia';

// --- TIPOS EXACTOS DEL BACKEND ---
export type EstadoCelda = 'PRESENTE' | 'FALTA' | 'TARDANZA' | 'FALTA_JUSTIFICADA';

export interface EventoMatriz {
  id: string;
  fecha: string;
  nombre: string;
}

export interface PersonaMatriz {
  id: string;
  nombres: string;
  apellidos: string;
  etiqueta: string | null;
}

export interface RegistroAsistenciaMatriz {
  personaId: string;
  eventoId: string;
  estado: EstadoCelda;
}

type ListaModo = 'confirmantes' | 'catequistas';

const TIPOS_EVENTO = [
  { id: 1, codigo: 'MISA', nombre: 'Santa Misa', icono: '⛪', color: '#8B4513' },
  { id: 2, codigo: 'CLASE', nombre: 'Clase de Catequesis', icono: '📚', color: '#4A90E2' },
  { id: 3, codigo: 'ROSARIO', nombre: 'Rezo del Santo Rosario', icono: '📿', color: '#9B59B6' },
  { id: 4, codigo: 'EXAMEN', nombre: 'Evaluación', icono: '📝', color: '#E74C3C' },
  { id: 5, codigo: 'RETIRO', nombre: 'Retiro Espiritual', icono: '🙏', color: '#27AE60' },
  { id: 6, codigo: 'CONFESION', nombre: 'Confesión Grupal', icono: '✝️', color: '#F39C12' },
  { id: 7, codigo: 'SERVICIO', nombre: 'Servicio Comunitario', icono: '🤝', color: '#16A085' },
  { id: 8, codigo: 'OTRO', nombre: 'Otro', icono: '📌', color: '#95A5A6' },
];

const toSlug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');

// Estilos de los grupos
const GROUP_PALETTE: { [key: string]: { bg: string; text: string; border: string } } = {
  'San Martin de Porres': { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600/50' },
  'San Pedro': { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600/50' },
  'San Juan María Vianney': { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600/50' },
  'San Carlos Acutis': { bg: 'bg-violet-500', text: 'text-white', border: 'border-violet-600/50' },
};
const DEFAULT_GROUP_STYLE = { bg: 'bg-[#F3F1ED]', text: 'text-[#5A431C]', border: 'border-[#E8E2DA]' };

const getGroupStyle = (etiqueta?: string | null) => {
  if (!etiqueta) return DEFAULT_GROUP_STYLE;
  return GROUP_PALETTE[etiqueta] || DEFAULT_GROUP_STYLE;
};

// Componente del Filtro
const GrupoFilterDropdown = ({
  personas,
  grupoFiltro,
  setGrupoFiltro,
}: {
  personas: PersonaMatriz[];
  grupoFiltro: string;
  setGrupoFiltro: (g: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const grupos = useMemo(
    () => ['todos', ...Array.from(new Set(personas.map((p) => p.etiqueta).filter(Boolean) as string[]))],
    [personas]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 rounded-lg transition-colors ${
          isOpen || grupoFiltro !== 'todos' ? 'bg-[#5A431C]/10 text-[#5A431C]' : 'text-[#9A8875] hover:bg-black/5'
        }`}
        title="Filtrar por grupo"
      >
        <Filter size={16} strokeWidth={2.5} />
      </button>
      {isOpen && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 flex items-center gap-1 rounded-xl bg-white/95 backdrop-blur-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] ring-1 ring-black/5 z-50 p-1.5 origin-left animate-in fade-in zoom-in-95 duration-200">
          {grupos.map((grupo) => (
            <button
              key={grupo}
              onClick={() => {
                setGrupoFiltro(grupo);
                setIsOpen(false);
              }}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] sm:text-xs font-bold transition-all ${
                grupoFiltro === grupo
                  ? 'bg-[#5A431C] text-white shadow-sm'
                  : 'text-[#8B7355] hover:bg-[#5A431C]/10 hover:text-[#5A431C]'
              }`}
            >
              {grupo === 'todos' ? 'Todos' : grupo}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function MatrizAsistenciaPage() {
  const params = useParams();
  const router = useRouter();
  const tipoSlug = params.tipoId as string;
  const tipoActual = TIPOS_EVENTO.find((tipo) => toSlug(tipo.nombre) === tipoSlug);

  const [listaModo, setListaModo] = useState<ListaModo>('confirmantes');
  const [loading, setLoading] = useState(true);

  // 👇 Estados reales conectados al backend
  const [eventos, setEventos] = useState<EventoMatriz[]>([]);
  const [personas, setPersonas] = useState<PersonaMatriz[]>([]);
  const [asistencias, setAsistencias] = useState<RegistroAsistenciaMatriz[]>([]);

  // 👇 LÓGICA DE CONEXIÓN CON LA API
  const cargarDatosLista = useCallback(async () => {
    if (!tipoActual) return;
    
    setLoading(true);
    try {
      let data;
      // Llamamos a un endpoint u otro según el switch estilo Apple
      if (listaModo === 'confirmantes') {
        data = await asistenciaService.getMatrizConfirmantes(tipoActual.id);
      } else {
        data = await asistenciaService.getMatrizCatequistas(tipoActual.id);
      }

      // Llenamos la tabla con la data real
      setEventos(data.eventos || []);
      setPersonas(data.personas || []);
      setAsistencias(data.asistencias || []);
      
    } catch (error) {
      console.error('Error al cargar la matriz de asistencias:', error);
      // Limpiamos la tabla si hay error
      setEventos([]);
      setPersonas([]);
      setAsistencias([]);
    } finally {
      setLoading(false);
    }
  }, [listaModo, tipoActual]);

  useEffect(() => {
    if (tipoSlug) void cargarDatosLista();
  }, [tipoSlug, cargarDatosLista]);

  const [grupoFiltro, setGrupoFiltro] = useState<string>('todos');
  const personasFiltradas = personas.filter((persona) => {
    return grupoFiltro === 'todos' || persona.etiqueta === grupoFiltro;
  });

  const obtenerEstado = (personaId: string, eventoId: string) => {
    const registro = asistencias.find((a) => a.personaId === personaId && a.eventoId === eventoId);
    if (!registro) return <span className="text-[#CAC2B6] font-medium tabular-nums">—</span>;

    switch (registro.estado) {
      case 'PRESENTE':
        return (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-600 ring-1 ring-inset ring-green-600/20 shadow-sm">
            <Check size={16} strokeWidth={2.5} />
          </div>
        );
      case 'FALTA':
        return (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-inset ring-red-600/20 shadow-sm">
            <X size={16} strokeWidth={2.5} />
          </div>
        );
      case 'TARDANZA':
        return (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-orange-600 ring-1 ring-inset ring-orange-600/20 shadow-sm">
            <Clock size={16} strokeWidth={2.5} />
          </div>
        );
      case 'FALTA_JUSTIFICADA':
        return (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-600/20 shadow-sm">
            <FileText size={15} strokeWidth={2.5} />
          </div>
        );
      default:
        return <span className="text-[#CAC2B6]">—</span>;
    }
  };

  const nombreColumnaLista = listaModo === 'confirmantes' ? 'Confirmante' : 'Catequista';

  if (loading) {
      return (
          <div className="flex h-[70vh] flex-col items-center justify-center bg-gradient-to-b from-[#FCFAF7] via-[#F9F8F6] to-[#F6F2EC] text-[#5A431C]">
            <Loader2 className="mb-3 animate-spin opacity-80" size={36} strokeWidth={2} />
            <p className="text-sm font-medium text-[#8B7355]">Sincronizando registros...</p>
          </div>
      );
  }

  return ( 
    <div className="absolute inset-4 md:inset-8 flex flex-col rounded-3xl shadow-sm border border-white/60 bg-[#F9F8F6]/70 backdrop-blur-xl overflow-hidden ring-1 ring-[#E8E2DA]/50">
      {/* HEADER */}
      <header className="flex shrink-0 flex-col gap-5 border-b border-[#E8E2DA]/50 bg-white/40 p-5 sm:px-8 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full border border-[#E8E2DA]/80 bg-white/70 backdrop-blur-md shadow-sm transition-all hover:scale-105 active:scale-95 hover:bg-white hover:shadow-md text-[#5A431C]"
            aria-label="Volver atrás"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="min-w-0 flex flex-col justify-center">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#8B7355]/80">
              Registro de Asistencia
            </p>
            <h1 className="mt-0.5 text-2xl font-semibold leading-tight tracking-tight text-[#211814] sm:text-3xl">
              {tipoActual?.nombre || 'General'}
            </h1>
          </div>
        </div>

        <div
          className="shrink-0 self-start rounded-xl border border-white/50 bg-[#F3F1ED]/50 backdrop-blur-md p-1 shadow-inner sm:inline-flex lg:self-center"
          role="tablist"
          aria-label="Tipo de persona en la tabla"
        >
          <button
            type="button"
            role="tab"
            aria-selected={listaModo === 'confirmantes'}
            onClick={() => setListaModo('confirmantes')}
            className={`flex min-h-[36px] flex-1 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold tracking-tight transition-all sm:py-1.5 ${
              listaModo === 'confirmantes'
                ? 'bg-white/90 text-[#5A431C] shadow-sm ring-1 ring-black/5'
                : 'text-[#8B7355] hover:text-[#5A431C] hover:bg-white/40'
            }`}
          >
            <Users size={17} strokeWidth={2.5} className="shrink-0 opacity-90" />
            Confirmantes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={listaModo === 'catequistas'}
            onClick={() => setListaModo('catequistas')}
            className={`flex min-h-[36px] flex-1 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold tracking-tight transition-all sm:py-1.5 ${
              listaModo === 'catequistas'
                ? 'bg-white/90 text-[#5A431C] shadow-sm ring-1 ring-black/5'
                : 'text-[#8B7355] hover:text-[#5A431C] hover:bg-white/40'
            }`}
          >
            <BookMarked size={17} strokeWidth={2.5} className="shrink-0 opacity-90" />
            Catequistas
          </button>
        </div>
      </header>

      {/* CONTENEDOR DE LA TABLA MATRIZ */}
      <div className="min-h-0 flex-1 flex flex-col bg-white/40">
          <div className="custom-scrollbar flex-1 overflow-auto bg-transparent">
          <table className="w-full border-collapse table-auto text-left text-sm">
              <thead className="sticky top-0 z-[40] bg-white/80 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-[#8B7355] shadow-[0_1px_0_rgba(232,226,218,0.5)]">
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-[45] w-12 min-w-[3rem] whitespace-nowrap border-r border-[#E8E2DA]/30 bg-white/80 backdrop-blur-md px-3 py-3.5 text-center align-middle tabular-nums text-[#C0B1A0]"
                >
                  #
                </th>
                  <th className="sticky left-12 z-[42] w-[1%] whitespace-nowrap border-r border-[#E8E2DA]/50 bg-white/80 backdrop-blur-md px-4 py-3.5 align-middle shadow-[1px_0_0_rgba(232,226,218,0.5)]">
                  <div className="flex items-center justify-between gap-2">
                      <span>{nombreColumnaLista}</span>
                      <GrupoFilterDropdown personas={personas} grupoFiltro={grupoFiltro} setGrupoFiltro={setGrupoFiltro} />
                  </div>
                </th>

                {/* Eventos desde BD */}
                {eventos.map((evento) => (
                  <th
                    key={evento.id}
                    className="min-w-[100px] cursor-default whitespace-nowrap border-l border-[#E8E2DA]/30 bg-white/80 backdrop-blur-md px-3 py-3 text-center align-middle"
                  >
                      <div className="text-[13px] font-bold text-[#211814]">{evento.fecha}</div>
                      <div className="mt-0.5 truncate text-[10px] font-semibold text-[#9A8875]" title={evento.nombre}>
                      {evento.nombre}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

              <tbody className="divide-y divide-[#E8E2DA]/40">
                {personasFiltradas.map((persona, rowIndex) => {
                  const groupStyle = getGroupStyle(persona.etiqueta);
                  return (
                    <tr key={persona.id} className="group transition-colors hover:bg-white/60">
                      
                      {/* Índice Fijo */}
                      <td className="sticky left-0 z-[25] w-12 min-w-[3rem] whitespace-nowrap border-r border-[#E8E2DA]/30 bg-transparent px-3 py-3.5 text-center align-middle tabular-nums text-xs font-semibold text-[#8B7355] transition-colors group-hover:bg-transparent backdrop-blur-sm">
                        {rowIndex + 1}
                      </td>
                      
                      {/* Persona Fija */}
                      <td className="sticky left-12 z-[20] w-[1%] max-w-none whitespace-nowrap border-r border-[#E8E2DA]/50 bg-transparent px-4 py-3.5 align-middle shadow-[1px_0_0_rgba(232,226,218,0.3)] transition-colors group-hover:bg-transparent backdrop-blur-sm">
                        <div className="flex min-w-0 items-center gap-3.5">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold leading-none shadow-sm ${groupStyle.bg} ${groupStyle.text} ${groupStyle.border}`}>
                            {persona.nombres?.charAt(0) || ''}
                            {persona.apellidos?.charAt(0) || ''}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-semibold leading-tight text-[#211814] text-[13px] sm:text-[14px]" title={`${persona.nombres} ${persona.apellidos}`}>
                              {persona.apellidos}, {persona.nombres}
                            </div>
                            <div className="truncate text-[11px] font-medium leading-tight text-[#9A8875] mt-0.5">
                              {persona.etiqueta || 'Sin grupo asignado'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Asistencias Intersección */}
                      {eventos.map((evento) => (
                        <td
                          key={`${persona.id}-${evento.id}`}
                          className="border-l border-[#E8E2DA]/30 px-3 py-3.5 text-center align-middle backdrop-blur-sm"
                        >
                          {obtenerEstado(persona.id, evento.id)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                
                {/* Empty State */}
                {personasFiltradas.length === 0 && (
                  <tr>
                    <td
                      colSpan={eventos.length + 2}
                      className="py-16 text-center text-[13px] font-medium text-[#8B7355]"
                    >
                      {personas.length === 0 
                        ? 'No hay registros para mostrar.' 
                        : 'No hay filas para los filtros aplicados.'}
                    </td>
                  </tr>
                )}
              </tbody>
          </table>
          </div>
          
          {/* FOOTER LEYENDA */}
          <div className="flex shrink-0 flex-col gap-3 border-t border-[#E8E2DA]/50 bg-white/60 backdrop-blur-md px-5 py-4 text-[12px] font-medium tabular-nums text-[#8B7355] sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <span className="font-semibold text-[#5A431C]">
                Total {listaModo === 'confirmantes' ? 'Confirmantes' : 'Catequistas'}: <span className="text-[#8B7355] ml-1">{personasFiltradas.length}</span>
              </span>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-sm" /> <span className="text-gray-600">Presente</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-sm" /> <span className="text-gray-600">Falta</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shadow-sm" /> <span className="text-gray-600">Tardanza</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-sm" /> <span className="text-gray-600">F. Justif.</span>
                </div>
              </div>
          </div>
      </div>
    </div>
  );
}
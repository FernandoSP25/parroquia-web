'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, X, Clock, Loader2, Users, BookMarked } from 'lucide-react';
import { usuarioService } from '@/app/services/usuarios';
import type { Usuario } from '@/app/types';

type EstadoCelda = 'PRESENTE' | 'FALTA' | 'TARDANZA';

interface PersonaMatriz {
  id: string;
  nombres: string;
  apellidos: string;
  etiqueta?: string | null;
}

interface RegistroAsistenciaMatriz {
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

/** Mock hasta conectar matriz × eventos × asistencias con el backend por tipo */
const MOCK_EVENTOS = [
  { id: 'ev-1', fecha: '05/05', nombre: 'Sesión A' },
  { id: 'ev-2', fecha: '12/05', nombre: 'Sesión B' },
  { id: 'ev-3', fecha: '19/05', nombre: 'Sesión C' },
];

const MOCK_CONFIRMANTES: PersonaMatriz[] = [
  { id: 'mock-cf-1', nombres: 'Josee Paris', apellidos: 'Uriarte', etiqueta: 'Grupo Alfa' },
  { id: 'mock-cf-2', nombres: 'Dayana', apellidos: 'Liñan', etiqueta: 'Grupo Alfa' },
  { id: 'mock-cf-3', nombres: 'Fabricio', apellidos: 'Jauregui', etiqueta: 'Grupo Beta' },
];

const MOCK_ASISTENCIAS_CONFIRMANTES: RegistroAsistenciaMatriz[] = [
  { personaId: 'mock-cf-1', eventoId: 'ev-1', estado: 'PRESENTE' },
  { personaId: 'mock-cf-1', eventoId: 'ev-2', estado: 'FALTA' },
  { personaId: 'mock-cf-2', eventoId: 'ev-1', estado: 'TARDANZA' },
];

const MOCK_CATEQUISTAS_FALLBACK: PersonaMatriz[] = [
  { id: 'mock-ct-1', nombres: 'Laura', apellidos: 'Mendoza Vega', etiqueta: 'Equipos de Catequesis' },
  { id: 'mock-ct-2', nombres: 'Ricardo', apellidos: 'Salazar', etiqueta: 'Equipos de Catequesis' },
  { id: 'mock-ct-3', nombres: 'Milagros', apellidos: 'Pérez Chu', etiqueta: 'Parroquia Santa Ana' },
  { id: 'mock-ct-4', nombres: 'Bruno', apellidos: 'De la Cruz', etiqueta: 'Parroquia Santa Ana' },
];

const MOCK_ASISTENCIAS_CATEQUISTAS: RegistroAsistenciaMatriz[] = [
  { personaId: 'mock-ct-1', eventoId: 'ev-1', estado: 'PRESENTE' },
  { personaId: 'mock-ct-1', eventoId: 'ev-3', estado: 'TARDANZA' },
  { personaId: 'mock-ct-3', eventoId: 'ev-2', estado: 'FALTA' },
];

/** Celas demo cuando la tabla trae IDs reales de API (solo visual hasta el endpoint matricial). */
function asistenciasDemoParaIds(personas: PersonaMatriz[]): RegistroAsistenciaMatriz[] {
  const out: RegistroAsistenciaMatriz[] = [];
  const muestras: [number, EstadoCelda][] = [
    [0, 'PRESENTE'],
    [1, 'TARDANZA'],
    [2, 'FALTA'],
  ];
  for (let i = 0; i < muestras.length; i++) {
    const idx = muestras[i][0];
    const estado = muestras[i][1];
    const p = personas[idx];
    if (!p) continue;
    out.push({ personaId: p.id, eventoId: MOCK_EVENTOS[0].id, estado });
    out.push({
      personaId: p.id,
      eventoId: MOCK_EVENTOS[Math.min(1, MOCK_EVENTOS.length - 1)].id,
      estado: estado === 'PRESENTE' ? 'FALTA' : 'TARDANZA',
    });
  }
  return out;
}

function mapUsuarioACatequistaRow(u: Usuario): PersonaMatriz | null {
  const esCatequista =
    Array.isArray(u.roles) &&
    u.roles.some((role) => String(role).toUpperCase().includes('CATEQUISTA'));
  if (!esCatequista) return null;
  return {
    id: u.id,
    nombres: u.nombres ?? '',
    apellidos: u.apellidos ?? '',
    etiqueta: u.grupo_nombre ?? 'Catequista',
  };
}

export default function MatrizAsistenciaPage() {
  const params = useParams();
  const router = useRouter();
  const tipoSlug = params.tipoId as string;
  const tipoActual = TIPOS_EVENTO.find((tipo) => toSlug(tipo.nombre) === tipoSlug);

  const [listaModo, setListaModo] = useState<ListaModo>('confirmantes');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [soloConRegistros, setSoloConRegistros] = useState(false);

  const [eventos] = useState(MOCK_EVENTOS);
  const [personas, setPersonas] = useState<PersonaMatriz[]>([]);
  const [asistencias, setAsistencias] = useState<RegistroAsistenciaMatriz[]>([]);
  const [usandoListaApi, setUsandoListaApi] = useState(false);

  const cargarDatosLista = useCallback(async () => {
    setLoading(true);
    try {
      if (listaModo === 'confirmantes') {
        setUsandoListaApi(false);
        setPersonas(MOCK_CONFIRMANTES);
        setAsistencias(MOCK_ASISTENCIAS_CONFIRMANTES);
        await new Promise((r) => setTimeout(r, 320));
      } else {
        let filasApi: PersonaMatriz[] | null = null;
        try {
          const data = await usuarioService.getAll(1, 200);
          filasApi = data.items.map(mapUsuarioACatequistaRow).filter((x): x is PersonaMatriz => x !== null);
        } catch {
          filasApi = null;
        }
        if (filasApi?.length) {
          setPersonas(filasApi);
          setAsistencias(asistenciasDemoParaIds(filasApi));
          setUsandoListaApi(true);
        } else {
          setPersonas(MOCK_CATEQUISTAS_FALLBACK);
          setAsistencias(MOCK_ASISTENCIAS_CATEQUISTAS);
          setUsandoListaApi(false);
        }
        await new Promise((r) => setTimeout(r, 280));
      }
    } catch (error) {
      console.error('Error al cargar la matriz:', error);
      if (listaModo === 'catequistas') {
        setPersonas(MOCK_CATEQUISTAS_FALLBACK);
        setAsistencias(MOCK_ASISTENCIAS_CATEQUISTAS);
        setUsandoListaApi(false);
      }
    } finally {
      setLoading(false);
    }
  }, [listaModo]);

  useEffect(() => {
    if (tipoSlug) void cargarDatosLista();
  }, [tipoSlug, cargarDatosLista]);

  const obtenerEstado = (personaId: string, eventoId: string) => {
    const registro = asistencias.find((a) => a.personaId === personaId && a.eventoId === eventoId);
    if (!registro) return <span className="text-[#CAC2B6] font-medium tabular-nums">—</span>;

    switch (registro.estado) {
      case 'PRESENTE':
        return (
          <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-green-600/12 text-green-700 ring-1 ring-green-700/25 shadow-sm">
            <Check size={15} strokeWidth={2.5} />
          </div>
        );
      case 'FALTA':
        return (
          <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-red-600/12 text-red-700 ring-1 ring-red-700/20 shadow-sm">
            <X size={15} strokeWidth={2.5} />
          </div>
        );
      case 'TARDANZA':
        return (
          <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-orange-600/14 text-orange-800 ring-1 ring-orange-700/22 shadow-sm">
            <Clock size={15} strokeWidth={2.5} />
          </div>
        );
      default:
        return <span className="text-[#CAC2B6]">—</span>;
    }
  };

  const nombreColumnaLista = listaModo === 'confirmantes' ? 'Confirmante' : 'Catequista';
  const placeholderBuscar =
    listaModo === 'confirmantes' ? 'Buscar confirmante…' : 'Buscar catequista…';

  const personasFiltradas = personas.filter((persona) => {
    const nombreCompleto = `${persona.nombres} ${persona.apellidos}`.toLowerCase();
    const coincideBusqueda = nombreCompleto.includes(search.toLowerCase().trim());

    if (!soloConRegistros) return coincideBusqueda;

    const tieneRegistro = asistencias.some((a) => a.personaId === persona.id);
    return coincideBusqueda && tieneRegistro;
  });

  if (loading) {
      return (
          <div className="flex h-[70vh] flex-col items-center justify-center bg-gradient-to-b from-[#FCFAF7] via-[#F9F8F6] to-[#F6F2EC] text-[#5A431C]">
            <Loader2 className="mb-3 animate-spin opacity-80" size={36} strokeWidth={2} />
            <p className="text-sm font-medium text-[#8B7355]">Cargando registro…</p>
          </div>
      );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#FCFAF7] via-[#F9F8F6] to-[#F6F2EC] px-4 py-5 sm:px-6 md:px-8 md:py-7">
      
      <div className="mb-5 flex flex-col gap-5 sm:mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3 sm:gap-4">
            <button 
                type="button"
                onClick={() => router.back()} 
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E8E2DA] bg-white/90 shadow-[0_1px_2px_rgba(33,24,20,0.06)] transition active:scale-95 hover:bg-[#F3F1ED]"
                aria-label="Volver atrás"
            >
              <ArrowLeft size={20} className="text-[#5A431C]" strokeWidth={2} />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7355]">Registro histórico</p>
              <h1 className="mt-1 font-serif text-[1.65rem] font-semibold leading-tight tracking-tight text-[#211814] sm:text-[1.85rem]">
                Asistencias
              </h1>
              <p className="mt-1.5 max-w-xl text-[13px] font-medium leading-relaxed text-[#8B7355]">
                {tipoActual
                  ? `${tipoActual.icono} · ${tipoActual.nombre}. Cambia entre listas cuando conectes el backend de la matriz.`
                  : 'Visualización de asistencias por personas y eventos (datos demo / API donde aplique).'}
              </p>
            </div>
          </div>
        
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#E8E2DA] bg-white/95 px-3 py-2.5 shadow-sm sm:gap-4 sm:self-center">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A8875] w-full sm:w-auto sm:mr-1">Leyenda</span>
              <div className="flex items-center gap-2 text-[#211814] text-xs sm:text-sm font-semibold tracking-tight">
                <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-green-600 ring-2 ring-green-700/25" aria-hidden />
                Presente
              </div>
              <div className="flex items-center gap-2 text-[#211814] text-xs sm:text-sm font-semibold tracking-tight">
                <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-red-600 ring-2 ring-red-700/25" aria-hidden />
                Falta
              </div>
              <div className="flex items-center gap-2 text-[#211814] text-xs sm:text-sm font-semibold tracking-tight">
                <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-orange-600 ring-2 ring-orange-700/25" aria-hidden />
                Tardanza
              </div>
          </div>
        </div>

        <div
          className="w-full rounded-2xl border border-[#E6DED4] bg-[#F7F4EF]/95 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:inline-flex sm:max-w-xl"
          role="tablist"
          aria-label="Tipo de persona en la tabla"
        >
          <button
            type="button"
            role="tab"
            aria-selected={listaModo === 'confirmantes'}
            onClick={() => setListaModo('confirmantes')}
            className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl px-3 text-[13px] font-semibold tracking-tight transition sm:rounded-[11px] sm:py-2.5 ${
              listaModo === 'confirmantes'
                ? 'bg-white text-[#5A431C] shadow-[0_8px_24px_-8px_rgba(33,24,20,0.18),inset_0_1px_0_rgba(255,255,255,1)] ring-1 ring-black/[0.05]'
                : 'text-[#8B7355] hover:bg-white/50 hover:text-[#6B583A]'
            }`}
          >
            <Users size={17} strokeWidth={2} className="shrink-0 opacity-90" />
            Confirmantes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={listaModo === 'catequistas'}
            onClick={() => setListaModo('catequistas')}
            className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl px-3 text-[13px] font-semibold tracking-tight transition sm:rounded-[11px] sm:py-2.5 ${
              listaModo === 'catequistas'
                ? 'bg-white text-[#5A431C] shadow-[0_8px_24px_-8px_rgba(33,24,20,0.18),inset_0_1px_0_rgba(255,255,255,1)] ring-1 ring-black/[0.05]'
                : 'text-[#8B7355] hover:bg-white/50 hover:text-[#6B583A]'
            }`}
          >
            <BookMarked size={17} strokeWidth={2} className="shrink-0 opacity-90" />
            Catequistas
          </button>
        </div>

        {listaModo === 'catequistas' && (
          <p className="text-[12px] font-medium leading-relaxed text-[#8B7355]">
            {usandoListaApi
              ? 'Lista cargada desde la API (/usuarios, rol catequista). La matriz de celdas sigue en modo demo hasta que conectes el endpoint de bloques.'
              : 'Mostrando catequistas de ejemplo; cuando la API devuelva resultados sustituirás automáticamente esta vista.'}
          </p>
        )}
      </div>

      <div className="mb-4 rounded-2xl border border-[#E8E2DA] bg-white/90 p-3 shadow-[0_1px_3px_rgba(33,24,20,0.04)] sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholderBuscar}
          className="w-full rounded-xl border border-[#C0B1A0]/35 bg-[#F9F8F6] px-4 py-2.5 text-sm text-[#211814] placeholder:text-[#ABA08F] outline-none ring-0 transition focus:border-[#5A431C]/70 focus:ring-[3px] focus:ring-[#5A431C]/12 sm:max-w-sm"
        />
        <button
          type="button"
          onClick={() => setSoloConRegistros((prev) => !prev)}
          className={`mt-2 min-h-[44px] w-full rounded-xl border text-[12px] font-semibold tracking-tight transition sm:mt-0 sm:min-h-0 sm:w-auto sm:shrink-0 sm:px-4 sm:py-2.5 ${
            soloConRegistros
              ? 'border-[#5A431C] bg-[#5A431C] text-white shadow-[inset_0_-1px_0_rgba(0,0,0,0.08)]'
              : 'border-[#C0B1A0]/50 bg-white text-[#5A431C] hover:bg-[#F9F8F6]'
          }`}
        >
          {soloConRegistros ? 'Solo con registro' : 'Filtrar: con registro'}
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-[#EBE5E0] bg-white/95 shadow-md">
        <div className="custom-scrollbar max-h-[calc(100vh-320px)] min-h-[240px] flex-1 overflow-auto sm:max-h-[calc(100vh-280px)]">
          <table className="w-full border-collapse table-auto text-left text-xs sm:text-sm">
            <thead className="sticky top-0 z-20 bg-[#F4F2EE]/94 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B7355] backdrop-blur-md">
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-[35] w-10 min-w-[2.5rem] whitespace-nowrap border-b border-[#EBE5E0] bg-[#F4F2EE]/95 px-1.5 py-3 text-center align-middle font-bold tabular-nums text-[#5A431C] sm:w-11"
                  title="Número de fila"
                >
                  #
                </th>
                <th className="sticky left-10 z-[32] w-[1%] whitespace-nowrap border-b border-[#EBE5E0] border-r border-[#EBE5E0]/70 bg-[#F4F2EE]/95 px-3 py-3 align-middle font-bold text-[#5A431C] shadow-[2px_0_6px_-2px_rgba(33,24,20,0.08)] sm:left-11">
                  {nombreColumnaLista}
                </th>
                <th className="border-b border-[#EBE5E0] px-3 py-3 align-middle text-[11px] font-semibold whitespace-nowrap sm:px-4">
                  Grupo / Nota
                </th>

                {eventos.map((evento) => (
                  <th
                    key={evento.id}
                    className="min-w-[78px] cursor-default whitespace-nowrap border-l border-[#EBE5E0] px-2 py-3 text-center align-middle sm:min-w-[90px]"
                  >
                    <div className="text-[13px] font-semibold tracking-tight text-[#211814]">{evento.fecha}</div>
                    <div className="mt-0.5 truncate text-[10px] font-semibold text-[#8B7355] max-w-[92px]" title={evento.nombre}>
                      {evento.nombre}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#EDE9E4]">
              {personasFiltradas.map((persona, rowIndex) => (
                <tr key={persona.id} className="group transition-colors hover:bg-[#FAF8F6]">
                  <td className="sticky left-0 z-[25] w-10 min-w-[2.5rem] whitespace-nowrap border-r border-[#EBE5E0]/65 bg-white px-1.5 py-2.5 text-center align-middle tabular-nums text-[13px] font-semibold text-[#5A431C] transition-colors group-hover:bg-[#FAF8F6] sm:w-11 sm:py-3">
                    {rowIndex + 1}
                  </td>
                  <td className="sticky left-10 z-[20] w-[1%] max-w-none whitespace-nowrap border-r border-[#EBE5E0]/50 bg-white px-3 py-2.5 align-middle shadow-[2px_0_6px_-2px_rgba(33,24,20,0.05)] transition-colors group-hover:bg-[#FAF8F6] sm:left-11 sm:py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E8E2DA] bg-[#F3F1ED] text-[10px] font-bold leading-none text-[#5A431C] sm:text-[11px]">
                        {persona.nombres.charAt(0)}
                        {persona.apellidos.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold leading-tight text-[#211814] text-xs sm:text-[13px]">{persona.apellidos}</div>
                        <div className="text-[10px] font-medium leading-tight text-[#8B7355] sm:text-[11px]">{persona.nombres}</div>
                      </div>
                    </div>
                  </td>

                  <td className="whitespace-normal border-[#EDE9E4]/80 px-3 py-2.5 align-middle text-[12px] text-[#8B7355] sm:px-4 sm:py-3 sm:text-[13px]">
                    {persona.etiqueta ?? '—'}
                  </td>

                  {eventos.map((evento) => (
                    <td
                      key={`${persona.id}-${evento.id}`}
                      className="border-l border-[#EBE5E0] px-2 py-2.5 text-center align-middle sm:py-3"
                    >
                      {obtenerEstado(persona.id, evento.id)}
                    </td>
                  ))}
                </tr>
              ))}
              {personasFiltradas.length === 0 && (
                <tr>
                  <td
                    colSpan={eventos.length + 3}
                    className="py-12 text-center text-[13px] font-medium text-[#8B7355]"
                  >
                    No hay filas para los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="flex flex-col gap-1 border-t border-[#EBE5E0] bg-[#F9F8F6] px-4 py-3 text-[11px] font-semibold tabular-nums text-[#8B7355] sm:flex-row sm:items-center sm:justify-between sm:text-xs">
            <span>
              {listaModo === 'confirmantes' ? 'Confirmantes' : 'Catequistas'}: {personasFiltradas.length}
            </span>
            <span className="text-[#ACA297]">{eventos.length} columnas demo</span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import ColumnaGrupo from '@/components/grupos/ColumnaGrupo';
import { grupoService } from '@/app/services/grupos';
import { anioService } from '@/app/services/anios'; // Importamos el nuevo servicio
import { TableroData, AnioCatequetico } from '@/app/types';
import Swal from 'sweetalert2';
import { Loader2, Users, BookOpen } from 'lucide-react';

type ViewMode = 'CONFIRMANTES' | 'CATEQUISTAS';

export default function GruposPage() {
  const [data, setData] = useState<TableroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('CONFIRMANTES');
  
  // Nuevos estados para manejar los años
  const [anios, setAnios] = useState<AnioCatequetico[]>([]);
  const [selectedAnioId, setSelectedAnioId] = useState<string | null>(null);

  // 1. Cargar la lista de años al montar el componente
  useEffect(() => {
    const fetchAnios = async () => {
      try {
        const dataAnios = await anioService.getAll();
        setAnios(dataAnios);
        // Si hay años, seleccionamos el primero (que debería ser el más reciente por cómo ordenamos en backend)
        if (dataAnios.length > 0) {
          setSelectedAnioId(dataAnios[0].id);
        } else {
          setLoading(false); // Si no hay años, terminamos de cargar
        }
      } catch (error) {
        console.error("Error cargando años", error);
        setLoading(false);
      }
    };
    fetchAnios();
  }, []);

  // 2. Cargar el tablero CADA VEZ que cambie el selectedAnioId
  useEffect(() => {
    const fetchTablero = async () => {
      if (!selectedAnioId) return;
      setLoading(true);
      try {
        const datos = await grupoService.getTablero(selectedAnioId);
        setData(datos);
      } catch (error) {
        console.error("Error cargando tablero", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTablero();
  }, [selectedAnioId]); // <-- Dependencia clave

  // --- DRAG & DROP ---
  useEffect(() => {
    return monitorForElements({
      onDrop({ source, location }) {
        const destino = location.current.dropTargets[0];
        if (!destino) return;

        const itemId = source.data.id as string;
        const itemType = source.data.type as string;
        const grupoId = destino.data.grupoId as string | null;

        if (viewMode === 'CONFIRMANTES' && itemType !== 'CONFIRMANTE') return;
        if (viewMode === 'CATEQUISTAS' && itemType !== 'CATEQUISTA') return;

        if (itemType === 'CONFIRMANTE') {
          handleMoverConfirmante(itemId, grupoId);
        } else if (itemType === 'CATEQUISTA') {
          handleMoverCatequista(itemId, grupoId);
        }
      },
    });
  }, [data, viewMode, selectedAnioId]); // Añadimos selectedAnioId a las dependencias

  const handleMoverConfirmante = async (id: string, grupoId: string | null) => {
    try {
      await grupoService.moverConfirmante({ confirmante_id: id, grupo_id: grupoId });
      // Recargamos el tablero actual
      if (selectedAnioId) {
        const datos = await grupoService.getTablero(selectedAnioId);
        setData(datos);
      }
    } catch (e: any) {
      Swal.fire('Error', e.response?.data?.detail || 'Error al mover confirmante', 'error');
    }
  };

  const handleMoverCatequista = async (id: string, grupoId: string | null) => {
    try {
      await grupoService.moverCatequista({ catequista_id: id, grupo_id: grupoId });
      if (selectedAnioId) {
        const datos = await grupoService.getTablero(selectedAnioId);
        setData(datos);
      }
    } catch (e: any) {
      Swal.fire('Error', e.response?.data?.detail || 'Error al mover catequista', 'error');
    }
  };

  const getSinAsignar = () => {
    if (!data) return [];
    return viewMode === 'CONFIRMANTES'
      ? data.sin_asignar_confirmantes
      : data.sin_asignar_catequistas;
  };

  const getItemsGrupo = (grupo: any) => {
    return viewMode === 'CONFIRMANTES' ? grupo.confirmantes : grupo.catequistas;
  };

  if (loading && !data)
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-[#5A431C]">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );

  // Si terminó de cargar pero no hay años en el sistema
  if (!loading && anios.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#F9F8F6] rounded-2xl shadow-md border border-[#E8E2DA] p-8 text-center">
        <h2 className="text-2xl font-serif font-bold text-[#211814] mb-2">No hay años catequéticos</h2>
        <p className="text-[#8B7355]">Debes crear un Año Catequético (ej: 2026) en la configuración del sistema para empezar a asignar grupos.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F9F8F6] rounded-2xl shadow-md border border-[#E8E2DA] overflow-hidden">
      {/* HEADER */}
      <div className="px-8 py-6 border-b border-[#E8E2DA] bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#211814] tracking-tight">
            {viewMode === 'CONFIRMANTES' ? 'Asignación de Confirmantes' : 'Asignación de Catequistas'}
          </h1>
          <p className="text-sm text-[#C0B1A0] mt-1">
            Arrastra para organizar los grupos
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* SELECTOR DE AÑO DINÁMICO */}
          <select 
            className="border border-[#E0D9D2] bg-white text-[#5A431C] font-semibold text-sm rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#5A431C]"
            value={selectedAnioId || ''}
            onChange={(e) => setSelectedAnioId(e.target.value)}
          >
            {anios.map(anio => (
              <option key={anio.id} value={anio.id}>
                Año {anio.anio}
              </option>
            ))}
          </select>

          {/* SWITCH MEJORADO */}
          <div className="flex bg-[#F3F1ED] p-1 rounded-xl border border-[#E0D9D2]">
            <button
              onClick={() => setViewMode('CONFIRMANTES')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                viewMode === 'CONFIRMANTES'
                  ? 'bg-[#5A431C] text-white shadow-md'
                  : 'text-[#5A431C] hover:bg-white'
              }`}
            >
              <Users size={16} /> Confirmantes
            </button>

            <button
              onClick={() => setViewMode('CATEQUISTAS')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                viewMode === 'CATEQUISTAS'
                  ? 'bg-[#5A431C] text-white shadow-md'
                  : 'text-[#5A431C] hover:bg-white'
              }`}
            >
              <BookOpen size={16} /> Catequistas
            </button>
          </div>
        </div>
      </div>

      {/* TABLERO */}
      <div className="flex-1 overflow-hidden bg-gradient-to-b from-[#F9F8F6] to-[#F3F1ED]">
        {loading ? (
           <div className="h-full flex items-center justify-center text-[#5A431C]">
             <Loader2 className="animate-spin" size={32} />
           </div>
        ) : data ? (
          <div className="h-full overflow-x-auto overflow-y-hidden">
            <div className="flex min-h-full p-8 gap-8 w-max">
              {/* SIN ASIGNAR */}
              <ColumnaGrupo
                grupoId={null}
                titulo={viewMode === 'CONFIRMANTES' ? 'Jóvenes sin grupo' : 'Catequistas disponibles'}
                items={getSinAsignar()}
                esSinAsignar={true}
                tipoVista={viewMode}
              />

              {/* DIVISOR */}
              <div className="w-px bg-[#E5DED6] my-6"></div>

              {/* GRUPOS */}
              {data.grupos.map((grupo: any) => (
                <ColumnaGrupo
                  key={grupo.id}
                  grupoId={grupo.id}
                  titulo={grupo.nombre}
                  capacidad={grupo.capacidad_maxima}
                  inscritos={grupo.total_inscritos}
                  items={getItemsGrupo(grupo)}
                  tipoVista={viewMode}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">Error al cargar datos del tablero.</div>
        )}
      </div>
    </div>
  );
}
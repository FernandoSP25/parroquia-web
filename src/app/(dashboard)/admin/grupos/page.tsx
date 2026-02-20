'use client';

import { useEffect, useState } from 'react';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import ColumnaGrupo from '@/components/grupos/ColumnaGrupo';
import { grupoService } from '@/app/services/grupos';
import { TableroData } from '@/app/types';
import Swal from 'sweetalert2';
import { Loader2, Users, BookOpen } from 'lucide-react';

type ViewMode = 'CONFIRMANTES' | 'CATEQUISTAS';

export default function GruposPage() {
  const [data, setData] = useState<TableroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('CONFIRMANTES');

  const ANIO_ID = "abe39a0a-6b90-45f2-bc9e-0471dd985dc6";

  const fetchTablero = async () => {
    try {
      const datos = await grupoService.getTablero(ANIO_ID);
      setData(datos);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTablero();
  }, []);

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
  }, [data, viewMode]);

  const handleMoverConfirmante = async (id: string, grupoId: string | null) => {
    try {
      await grupoService.moverConfirmante({
        confirmante_id: id,
        grupo_id: grupoId,
      });
      fetchTablero();
    } catch (e: any) {
      Swal.fire('Error', e.response?.data?.detail, 'error');
    }
  };

  const handleMoverCatequista = async (id: string, grupoId: string | null) => {
    try {
      await grupoService.moverCatequista({
        catequista_id: id,
        grupo_id: grupoId,
      });
      fetchTablero();
    } catch (e: any) {
      Swal.fire('Error', e.response?.data?.detail, 'error');
    }
  };

  const getSinAsignar = () => {
    if (!data) return [];
    return viewMode === 'CONFIRMANTES'
      ? data.sin_asignar_confirmantes
      : data.sin_asignar_catequistas;
  };

  const getItemsGrupo = (grupo: any) => {
    return viewMode === 'CONFIRMANTES'
      ? grupo.confirmantes
      : grupo.catequistas;
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-[#5A431C]">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );

  if (!data) return <div>No data</div>;

  return (
  <div className="flex flex-col h-full bg-[#F9F8F6] rounded-2xl shadow-md border border-[#E8E2DA] overflow-hidden">

    {/* HEADER */}
    <div className="px-8 py-6 border-b border-[#E8E2DA] bg-white flex justify-between items-center shrink-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#211814] tracking-tight">
          {viewMode === 'CONFIRMANTES'
            ? 'Asignación de Confirmantes'
            : 'Asignación de Catequistas'}
        </h1>
        <p className="text-sm text-[#C0B1A0] mt-1">
          Arrastra para organizar los grupos
        </p>
      </div>

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

    {/* TABLERO */}
    <div className="flex-1 overflow-hidden bg-gradient-to-b from-[#F9F8F6] to-[#F3F1ED]">
      <div className="h-full overflow-x-auto overflow-y-hidden">
        <div className="flex min-h-full p-8 gap-8 w-max">

          {/* SIN ASIGNAR */}
          <ColumnaGrupo
            grupoId={null}
            titulo={
              viewMode === 'CONFIRMANTES'
                ? 'Jóvenes sin grupo'
                : 'Catequistas disponibles'
            }
            items={getSinAsignar()}
            esSinAsignar={true}
            tipoVista={viewMode}
          />

          {/* DIVISOR MÁS SUTIL */}
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
    </div>

  </div>
);

}

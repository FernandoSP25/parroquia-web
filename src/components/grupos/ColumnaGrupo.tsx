'use client';

import { useEffect, useRef, useState } from 'react';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import CardConfirmante from './CardConfirmante';
import CardCatequista from './CardCatequista';
import { Users, BookOpen } from 'lucide-react';

interface ColumnaProps {
  grupoId: string | null;
  titulo: string;
  capacidad?: number;
  inscritos?: number;
  items: any[];
  esSinAsignar?: boolean;
  tipoVista: 'CONFIRMANTES' | 'CATEQUISTAS';
}

export default function ColumnaGrupo({
  grupoId,
  titulo,
  capacidad = 0,
  inscritos = 0,
  items,
  esSinAsignar,
  tipoVista,
}: ColumnaProps) {

  const ref = useRef<HTMLDivElement>(null);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    return dropTargetForElements({
      element: el,
      getData: () => ({ grupoId }),
      canDrop: ({ source }) =>
        source.data.type ===
        (tipoVista === 'CONFIRMANTES' ? 'CONFIRMANTE' : 'CATEQUISTA'),
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: () => setIsOver(false),
    });
  }, [grupoId, tipoVista]);

  // Estado visual cuando está lleno
  const estaLleno =
    tipoVista === 'CONFIRMANTES' &&
    capacidad > 0 &&
    inscritos >= capacidad;

  return (
    <div
      ref={ref}
      className={`
        flex-shrink-0 w-64 rounded-2xl flex flex-col h-full max-h-full
        transition-all duration-200 border
        ${
          isOver
            ? 'border-[#5A431C] bg-[#F3EEE7] shadow-lg scale-[1.02]'
            : 'border-[#E6DED6] bg-white shadow-sm'
        }
      `}
    >
      {/* HEADER */}
      <div className="px-4 py-3 border-b border-[#EEE6DE]">

        <div className="flex justify-between items-center">

          <h3 className={`
            font-serif font-bold text-sm truncate
            ${esSinAsignar ? 'text-[#C0B1A0]' : 'text-[#211814]'}
          `}>
            {titulo}
          </h3>

          {/* Confirmantes */}
          {!esSinAsignar && tipoVista === 'CONFIRMANTES' && (
            <div className={`
              flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px]
              font-semibold border transition-all
              ${
                estaLleno
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-[#F3F1ED] text-[#5A431C] border-[#E0D9D2]'
              }
            `}>
              <Users size={11} />
              <span>{inscritos}/{capacidad}</span>
            </div>
          )}

          {/* Catequistas */}
          {!esSinAsignar && tipoVista === 'CATEQUISTAS' && (
            <div className="
              flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px]
              font-semibold bg-[#F3F1ED] text-[#5A431C] border border-[#E0D9D2]
            ">
              <BookOpen size={11} />
              {items.length}
            </div>
          )}

        </div>
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-2 p-3 custom-scrollbar">

        {items.map((item) =>
          tipoVista === 'CONFIRMANTES' ? (
            <CardConfirmante
              key={item.id}
              id={item.id}
              nombres={item.nombres}
              apellidos={item.apellidos}
              edad={item.edad}
            />
          ) : (
            <CardCatequista
              key={item.id}
              id={item.id}
              nombres={item.nombres}
              apellidos={item.apellidos}
            />
          )
        )}

        {items.length === 0 && (
          <div className="
            h-32 flex flex-col items-center justify-center
            text-[#C0B1A0]
            border-2 border-dashed border-[#E6DED6]
            rounded-xl bg-[#F9F8F6]
          ">
            <span className="text-xs font-medium">
              {isOver ? 'Suelta aquí' : 'Vacío'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { User, GripVertical } from 'lucide-react';

interface CardProps {
  id: string;
  nombres: string;
  apellidos: string;
  edad: number;
}

export default function CardConfirmante({ id, nombres, apellidos, edad }: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    return draggable({
      element: el,
      getInitialData: () => ({ type: 'CONFIRMANTE', id }), // Enviamos el ID al arrastrar
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });
  }, [id]);

  return (
    <div
      ref={ref}
      className={`
        relative p-3 mb-2 bg-white rounded-xl shadow-sm border 
        transition-all duration-200 group select-none
        ${isDragging 
          ? 'opacity-40 border-dashed border-[#5A431C] bg-[#F9F8F6]' 
          : 'opacity-100 border-gray-200 hover:border-[#5A431C] hover:shadow-md cursor-grab active:cursor-grabbing'
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icono / Avatar */}
        <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-[#5A431C] font-bold shrink-0">
           {nombres.charAt(0)}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 truncate leading-tight">
            {nombres}
          </p>
          <p className="text-xs text-gray-500 truncate mb-1">
            {apellidos}
          </p>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
            {edad} años
          </span>
        </div>

        {/* Grip Icon (Visual) */}
        <div className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical size={16} />
        </div>
      </div>
    </div>
  );
}
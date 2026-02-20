// src/components/grupos/CardCatequista.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { BookOpen, GripVertical } from 'lucide-react';

interface CardProps {
  id: string;
  nombres: string;
  apellidos: string;
}

export default function CardCatequista({ id, nombres, apellidos }: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    return draggable({
      element: el,
      // 🔑 CLAVE: Aquí enviamos el tipo correcto
      getInitialData: () => ({ type: 'CATEQUISTA', id }), 
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
          ? 'opacity-40 border-dashed border-blue-500 bg-blue-50' 
          : 'opacity-100 border-gray-200 hover:border-blue-500 hover:shadow-md cursor-grab active:cursor-grabbing'
        }
      `}
    >
      <div className="flex items-center gap-3">
        {/* Icono diferente para Catequista */}
        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-bold shrink-0">
           <BookOpen size={16} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 truncate leading-tight">
            {nombres}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {apellidos}
          </p>
        </div>

        <div className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical size={16} />
        </div>
      </div>
    </div>
  );
}
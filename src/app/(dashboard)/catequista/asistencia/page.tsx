'use client';

import { useState } from 'react';
import EscanerQR from '@/components/layout/EscanerQR';
import { QrCode } from 'lucide-react';
import Swal from 'sweetalert2';

import { formatFechaAsistencia } from '@/app/utils/formatters'; // La función de la fecha

export default function AsistenciaPage() {
  const [escaneando, setEscaneando] = useState(false);

      

  return (
    <div className="min-h-screen bg-[#F9F8F6] p-6">
      
      
    </div>
  );
}
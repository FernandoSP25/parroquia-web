'use client';

import { useState } from 'react';
import EscanerQR from '@/components/layout/EscanerQR';
import { QrCode } from 'lucide-react';
import Swal from 'sweetalert2';
import { asistenciaService } from '@/app/services/asistencia'; // Tu servicio con axios
import { formatFechaAsistencia } from '@/app/utils/formatters'; // La función de la fecha

export default function AsistenciaPage() {
  const [escaneando, setEscaneando] = useState(false);

  const handleScan = async (codigoLeido: string) => {
    try {
      // 1. Llamada al servicio utilizando la interfaz AsistenciaResponse
      const resultado = await asistenciaService.registrar(codigoLeido);
      
      // 2. Formateamos la fecha recibida (ej: "27 de Feb, 6:30 PM")
      const fechaLegible = formatFechaAsistencia(resultado.fecha);

      // 3. Éxito: Mostramos los datos reales que vienen de la base de datos
      Swal.fire({
        title: '¡Asistencia Registrada!',
        html: `
          <div class="text-center">
            <p class="font-bold text-green-600 mb-2">${resultado.mensaje}</p>
            <p class="text-sm text-gray-500">
              Confirmado el <b>${fechaLegible}</b><br/>
              Método: <span class="badge">${resultado.metodo}</span>
            </p>
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#5A431C'
      });
      
      setEscaneando(false); // Cerramos el escáner al terminar

    } catch (error: any) {
      // 4. Error: Capturamos mensajes del backend (QR expirado, ya registrado, etc.)
      Swal.fire({
        title: 'Atención',
        text: error.response?.data?.detail || 'No se pudo procesar el código',
        icon: 'warning',
        confirmButtonColor: '#5A431C'
      });
      // Mantenemos el escáner abierto por si fue un error de lectura
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] p-6">
      <div className="max-w-md mx-auto mt-10 text-center">
        <h1 className="text-3xl font-serif font-bold mb-8">Asistencia Parroquial</h1>

        {!escaneando ? (
          <button 
            onClick={() => setEscaneando(true)}
            className="w-full bg-[#5A431C] text-white py-4 rounded-xl font-bold shadow-md flex items-center justify-center gap-2"
          >
            <QrCode size={24} /> Abrir Cámara
          </button>
        ) : (
          <div className="space-y-6">
            <EscanerQR onScanSuccess={handleScan} />
            <button 
              onClick={() => setEscaneando(false)}
              className="text-gray-500 font-bold underline"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
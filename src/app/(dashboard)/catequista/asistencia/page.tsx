'use client';

import { useState } from 'react';
import EscanerQR from '@/components/layout/EscanerQR';
import { QrCode } from 'lucide-react';
import Swal from 'sweetalert2';
// Aquí importaremos tu servicio de asistencias luego:
// import { asistenciaService } from '@/app/services/asistencia';

export default function AsistenciaPage() {
  const [escaneando, setEscaneando] = useState(false);

  const handleScan = async (codigoLeido: string) => {
    // El código leído será algo como "123e4567-e89b-12d3...-token"
    console.log("¡Código capturado!", codigoLeido);
    
    try {
      // TODO: Aquí llamaremos al backend:
      // await asistenciaService.registrar(codigoLeido);
      
      Swal.fire({
        title: '¡Asistencia Registrada!',
        text: 'Tu llegada ha sido confirmada correctamente.',
        icon: 'success',
        confirmButtonColor: '#5A431C'
      });
      setEscaneando(false); // Apagamos la cámara

    } catch (error) {
      console.error("Error registrando asistencia:", error);
      Swal.fire('Error', 'Código QR inválido o expirado.', 'error');
      setEscaneando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] p-6 text-[#211814]">
      <div className="max-w-md mx-auto mt-10 text-center">
        <div className="bg-[#5A431C] w-16 h-16 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-lg">
          <QrCode size={32} />
        </div>
        
        <h1 className="text-3xl font-serif font-bold mb-2">Registrar Asistencia</h1>
        <p className="text-gray-500 mb-8">Escanea el código mostrado por tu catequista para confirmar tu llegada al evento.</p>

        {!escaneando ? (
          <button 
            onClick={() => setEscaneando(true)}
            className="w-full bg-[#5A431C] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#4a3616] transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <QrCode size={24} /> Abrir Escáner
          </button>
        ) : (
          <div className="animate-fade-in-up">
            <EscanerQR onScanSuccess={handleScan} />
            <button 
              onClick={() => setEscaneando(false)}
              className="mt-6 text-gray-500 hover:text-[#5A431C] font-bold underline transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
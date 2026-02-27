'use client';

import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Loader2 } from 'lucide-react';

interface EscanerQRProps {
  onScanSuccess: (decodedText: string) => void;
}

export default function EscanerQR({ onScanSuccess }: EscanerQRProps) {
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Configuramos el escáner para que use la cámara trasera por defecto
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText) => {
        // Cuando lee un código exitosamente, detenemos el escáner y avisamos al padre
        scanner.clear();
        onScanSuccess(decodedText);
      },
      (error) => {
        // Aquí podríamos manejar errores de lectura si queremos, pero por ahora los ignoramos
        console.warn("Error leyendo QR:", error);
      }
    );

    // SOLUCIÓN AL ERROR: Le damos un pequeño retraso para que React no haga un doble renderizado instantáneo.
    // Además, le da tiempo a la librería de inyectar sus botones de cámara en el HTML.
    const timer = setTimeout(() => {
      setCargando(false);
    }, 500);

    // Limpieza al desmontar el componente (cerrar la cámara)
    return () => {
      clearTimeout(timer);
      scanner.clear().catch(console.error);
    };
  }, [onScanSuccess]);

  return (
    <div className="w-full max-w-sm mx-auto bg-white p-4 rounded-2xl shadow-sm border border-[#C0B1A0]/30">
      {cargando && (
        <div className="flex flex-col items-center py-10 text-[#C0B1A0]">
          <Loader2 className="animate-spin mb-2" size={32} />
          <p className="text-sm font-bold animate-pulse">Iniciando cámara...</p>
        </div>
      )}
      {/* Aquí es donde la librería inyectará el video de la cámara */}
      <div id="qr-reader" className={`w-full overflow-hidden rounded-xl ${cargando ? 'hidden' : 'block'}`}></div>
    </div>
  );
}
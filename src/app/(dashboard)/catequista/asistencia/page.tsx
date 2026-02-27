'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Loader2, ScanLine } from 'lucide-react';

interface EscanerQRProps {
  onScanSuccess: (decodedText: string) => void;
}

export default function EscanerQR({ onScanSuccess }: EscanerQRProps) {
  const [cargando, setCargando] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader");
    scannerRef.current = html5QrCode;

    html5QrCode.start(
      { facingMode: "environment" }, 
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0, // Fuerza un aspecto cuadrado para celulares
      },
      (decodedText) => {
        if (html5QrCode.isScanning) {
          html5QrCode.stop().then(() => {
            html5QrCode.clear();
            onScanSuccess(decodedText);
          }).catch(console.error);
        }
      },
      () => {
        // IMPORTANTE: Dejamos esto vacío intencionalmente.
        // Si imprimimos los errores aquí, el celular se pone lento.
      }
    ).then(() => {
      setCargando(false);
    }).catch((err) => {
      console.error("Error iniciando cámara trasera:", err);
      setCargando(false); 
    });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
        }).catch(console.error);
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="w-full max-w-sm mx-auto bg-white p-3 rounded-[2rem] shadow-xl border border-[#C0B1A0]/30 relative">
      
      {/* MAGIA CSS: Ocultamos a la fuerza los textos basura, 
        bordes e interfaces inyectadas por la librería 
      */}
      <style>{`
        #qr-reader {
          border: none !important;
          border-radius: 1.5rem;
          overflow: hidden;
          background: #000;
        }
        #qr-reader video {
          border-radius: 1.5rem !important;
          object-fit: cover !important;
          width: 100% !important;
        }
        /* Oculta los textos, spans y links que la librería inyecta */
        #qr-reader div:not(:first-child) > span,
        #qr-reader a {
          display: none !important;
        }
      `}</style>

      {/* Contenedor principal de la cámara */}
      <div className="relative min-h-[300px] flex items-center justify-center bg-gray-50 rounded-[1.5rem] border-2 border-dashed border-[#C0B1A0]/50 overflow-hidden">
        
        {cargando && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-[#5A431C] bg-gray-50/90 backdrop-blur-sm">
            <Loader2 className="animate-spin mb-3" size={40} />
            <p className="text-sm font-bold animate-pulse">Conectando lente...</p>
          </div>
        )}
        
        {/* Aquí va la cámara */}
        <div 
          id="qr-reader" 
          className={`w-full transition-opacity duration-500 ${cargando ? 'opacity-0' : 'opacity-100'}`}
        ></div>

        {/* Adorno visual encima del recuadro */}
        {!cargando && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
            <ScanLine size={100} strokeWidth={1} className="text-white/40 animate-pulse" />
          </div>
        )}

      </div>
      
      <div className="text-center mt-4 mb-2">
        <p className="text-xs font-semibold text-[#5A431C] uppercase tracking-wider">
          Enfoca el código QR en el recuadro
        </p>
      </div>
      
    </div>
  );
}
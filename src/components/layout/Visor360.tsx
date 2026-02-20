"use client";

import React from 'react';
import { ReactPhotoSphereViewer } from 'react-photo-sphere-viewer';

interface Visor360Props {
  imagePath: string;
}

export default function Visor360({ imagePath }: Visor360Props) {
  return (
    <div className="w-full h-full cursor-grab active:cursor-grabbing">
      <ReactPhotoSphereViewer
        src={imagePath}
        height="100%"
        width="100%"
        defaultYaw={Math.PI} // Ángulo inicial
        defaultPitch={0}     // Inclinación inicial
        navbar={false}       // Oculta la barra de abajo para que se vea más limpio
        touchmoveTwoFingers={false} // Permite mover con 1 dedo en celulares
      />
    </div>
  );
}
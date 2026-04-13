"use client";

import { useState } from "react";
import { 
  Users, 
  GraduationCap, 
  Download, 
  Phone, 
  Search,
  Save
} from "lucide-react";

const COLORS = {
  primary: "#5A431C",
  dark: "#211814",
  accent: "#C0B1A0",
  bgLight: "#F9F8F6",
};

export default function MiGrupoPage() {
  // Estado para controlar qué pestaña está activa
  const [activeTab, setActiveTab] = useState<'DIRECTORIO' | 'NOTAS'>('DIRECTORIO');
  
  // Simulamos a los alumnos (esto vendrá de tu backend)
  const alumnos = [
    { id: 1, nombres: "Juan Diego", apellidos: "Pérez López", telefono: "987654321", apoderado: "María López" },
    { id: 2, nombres: "Ana Lucía", apellidos: "Gómez Torres", telefono: "912345678", apoderado: "Carlos Gómez" },
  ];

  return (
    <div className="p-4 sm:p-8 min-h-screen font-sans" style={{ backgroundColor: COLORS.bgLight }}>
      
      {/* 1. CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight" style={{ color: COLORS.dark }}>
            Grupo San Pedro
          </h1>
          <p className="text-[#5A431C] opacity-70 mt-1">
            Gestiona la información y calificaciones de tus jóvenes confirmantes.
          </p>
        </div>
        
        <button className="bg-white border border-[#C0B1A0]/40 text-[#5A431C] px-5 py-2.5 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
          <Download size={18} />
          <span>Exportar Registro</span>
        </button>
      </div>

      {/* 2. SISTEMA DE PESTAÑAS (TABS) */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-[#EBE5E0] overflow-hidden min-h-[60vh]">
        
        {/* Navegación de Pestañas */}
        <div className="flex border-b border-gray-100 px-6 pt-4 bg-[#F9F8F6]">
          <button 
            onClick={() => setActiveTab('DIRECTORIO')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm border-b-2 transition-colors ${
              activeTab === 'DIRECTORIO' 
                ? 'border-[#5A431C] text-[#211814]' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Users size={18} /> Directorio de Alumnos
          </button>
          <button 
            onClick={() => setActiveTab('NOTAS')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm border-b-2 transition-colors ${
              activeTab === 'NOTAS' 
                ? 'border-[#5A431C] text-[#211814]' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <GraduationCap size={18} /> Registro de Notas
          </button>
        </div>

        {/* 3. CONTENIDO DE LAS PESTAÑAS */}
        <div className="p-6 sm:p-8">
          
          {/* VISTA A: DIRECTORIO */}
          {activeTab === 'DIRECTORIO' && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Buscar alumno..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#5A431C] focus:ring-1 focus:ring-[#5A431C] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {alumnos.map(alumno => (
                  <div key={alumno.id} className="border border-gray-100 p-4 rounded-2xl flex items-center gap-4 hover:border-[#C0B1A0]/40 transition-colors">
                    <div className="w-12 h-12 bg-[#5A431C]/10 text-[#5A431C] rounded-full flex items-center justify-center font-bold text-lg">
                      {alumno.nombres[0]}{alumno.apellidos[0]}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="font-bold text-[#211814] truncate">{alumno.nombres} {alumno.apellidos}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Phone size={12} /> {alumno.telefono} • {alumno.apoderado}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VISTA B: NOTAS */}
          {activeTab === 'NOTAS' && (
            <div className="animate-fade-in">
              <div className="flex justify-end mb-4">
                <button className="bg-[#211814] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#5A431C] transition-colors flex items-center gap-2 text-sm shadow-md">
                  <Save size={16} /> Guardar Calificaciones
                </button>
              </div>

              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F9F8F6] text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4">Joven Confirmante</th>
                      <th className="px-6 py-4 text-center w-32">Oraciones</th>
                      <th className="px-6 py-4 text-center w-32">Ex. Parcial</th>
                      <th className="px-6 py-4 text-center w-32">Ex. Final</th>
                      <th className="px-6 py-4 text-center w-32">Promedio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {alumnos.map(alumno => (
                      <tr key={alumno.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-[#211814]">
                          {alumno.nombres} {alumno.apellidos}
                        </td>
                        <td className="px-6 py-3">
                          <input type="number" min="0" max="20" placeholder="--" className="w-full text-center py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#5A431C] font-bold text-[#5A431C]" />
                        </td>
                        <td className="px-6 py-3">
                          <input type="number" min="0" max="20" placeholder="--" className="w-full text-center py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#5A431C] font-bold text-[#5A431C]" />
                        </td>
                        <td className="px-6 py-3">
                          <input type="number" min="0" max="20" placeholder="--" className="w-full text-center py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#5A431C] font-bold text-[#5A431C]" />
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-gray-400">
                          14.5
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
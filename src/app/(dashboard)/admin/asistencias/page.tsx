"use client";

import { useState } from "react";
import { 
Calendar, 
MapPin, 
Users, 
CheckCircle2, 
XCircle, 
Clock, 
Plus, 
Filter, 
Search,
MoreHorizontal,
FileBarChart
} from "lucide-react";

import Image from "next/image";

// --- TIPOS (Basados en tu DB) ---
interface Evento {
id: string;
nombre: string;
tipo: 'DOMINGO' | 'ROSARIO' | 'PROCESION' | 'EXAMEN' | 'OTRO';
fecha: string;
hora: string;
obligatorio: boolean;
grupo: string; // Puede ser "Todos" o un grupo específico
estado: 'Pendiente' | 'Finalizado';
}

interface Asistencia {
id: string;
usuario: string; // Nombre del confirmante/catequista
rol: 'CONFIRMANTE' | 'CATEQUISTA';
grupo: string;
horaMarcada: string;
estado: 'PRESENTE' | 'TARDANZA' | 'FALTA';
}

// --- DATOS MOCK (Simulados) ---
const EVENTOS_MOCK: Evento[] = [
{ id: '1', nombre: 'Misa Dominical', tipo: 'DOMINGO', fecha: '2026-01-25', hora: '08:00 AM', obligatorio: true, grupo: 'Todos', estado: 'Finalizado' },
{ id: '2', nombre: 'Reunión Catequistas', tipo: 'OTRO', fecha: '2026-01-26', hora: '07:00 PM', obligatorio: true, grupo: 'N/A', estado: 'Pendiente' },
{ id: '3', nombre: 'Rosario Grupal', tipo: 'ROSARIO', fecha: '2026-01-28', hora: '05:00 PM', obligatorio: false, grupo: 'Grupo Mateo', estado: 'Pendiente' },
];

const ASISTENCIAS_MOCK: Asistencia[] = [
{ id: '101', usuario: 'Juan Pérez', rol: 'CONFIRMANTE', grupo: 'Grupo Mateo', horaMarcada: '07:55 AM', estado: 'PRESENTE' },
{ id: '102', usuario: 'Maria Gonzalez', rol: 'CONFIRMANTE', grupo: 'Grupo Marcos', horaMarcada: '08:15 AM', estado: 'TARDANZA' },
{ id: '103', usuario: 'Sor María', rol: 'CATEQUISTA', grupo: 'N/A', horaMarcada: '07:45 AM', estado: 'PRESENTE' },
{ id: '104', usuario: 'Carlos Ruiz', rol: 'CONFIRMANTE', grupo: 'Grupo Lucas', horaMarcada: '-', estado: 'FALTA' },
];

export default function AsistenciasPage() {
// Estados de la vista
const [activeTab, setActiveTab] = useState<'eventos' | 'registros'>('eventos');
const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

// --- ESTADOS NUEVOS PARA MODALES ---
const [isEventModalOpen, setIsEventModalOpen] = useState(false);
const [isQRModalOpen, setIsQRModalOpen] = useState(false);
const [selectedEventForQR, setSelectedEventForQR] = useState<Evento | null>(null);

// --- MANEJADORES ---
const handleSaveEvent = (e: React.FormEvent) => {
e.preventDefault();
// Aquí conectarás con tu Backend (FastAPI) luego
alert("Evento creado exitosamente (Simulación)");
setIsEventModalOpen(false);
};

const handleOpenQR = (evento: Evento) => {
setSelectedEventForQR(evento);
setIsQRModalOpen(true);
};

// Función para badges de estado de asistencia
const getStatusBadge = (estado: string) => {
switch (estado) {
    case 'PRESENTE': return <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold"><CheckCircle2 size={12}/> PRESENTE</span>;
    case 'TARDANZA': return <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold"><Clock size={12}/> TARDANZA</span>;
    case 'FALTA': return <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold"><XCircle size={12}/> FALTA</span>;
    default: return null;
}
};

return (
<div className="space-y-6">
    
    {/* 1. HEADER Y KPIs RÁPIDOS */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div>
        <h1 className="text-2xl font-bold text-slate-900">Control de Asistencias</h1>
        <p className="text-slate-500 text-sm">Gestiona eventos y monitorea la participación.</p>
    </div>
    
    {/* Botón de Acción Principal */}
    <button  onClick={() => setIsEventModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-all">
        <Plus size={18} />
        {activeTab === 'eventos' ? 'Crear Nuevo Evento' : 'Registrar Asistencia Manual'}
    </button>
    </div>

    {/* KPIs (Tarjetas de resumen) */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Calendar size={24} /></div>
        <div>
        <p className="text-slate-500 text-xs font-medium uppercase">Eventos este mes</p>
        <h3 className="text-2xl font-bold text-slate-800">8</h3>
        </div>
    </div>
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="p-3 bg-green-100 text-green-600 rounded-lg"><CheckCircle2 size={24} /></div>
        <div>
        <p className="text-slate-500 text-xs font-medium uppercase">Asistencia Promedio</p>
        <h3 className="text-2xl font-bold text-slate-800">92%</h3>
        </div>
    </div>
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="p-3 bg-red-100 text-red-600 rounded-lg"><XCircle size={24} /></div>
        <div>
        <p className="text-slate-500 text-xs font-medium uppercase">Faltas Críticas</p>
        <h3 className="text-2xl font-bold text-slate-800">12</h3>
        </div>
    </div>
    </div>

    {/* 2. BARRA DE CONTROL (TABS Y FILTROS) */}
    <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
    
    {/* Tabs: Eventos vs Registros */}
    <div className="flex p-1 bg-slate-100 rounded-lg w-full sm:w-auto">
        <button 
        onClick={() => setActiveTab('eventos')}
        className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'eventos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
        Gestión de Eventos
        </button>
        <button 
        onClick={() => setActiveTab('registros')}
        className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'registros' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
        Registros Detallados
        </button>
    </div>

    {/* Filtros Globales */}
    <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-40">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input 
            aria-label="Seleccionar fecha"
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500"
        />
        </div>
        <button className="p-2 border border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50" aria-label="Más filtros">
        <Filter size={18} />
        </button>
    </div>
    </div>

    {/* 3. CONTENIDO PRINCIPAL */}
    
    {/* VISTA A: GESTIÓN DE EVENTOS */}
    {activeTab === 'eventos' && (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EVENTOS_MOCK.map((evento) => (
        <div key={evento.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow relative overflow-hidden">
            {/* Borde izquierdo de color según tipo */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${evento.obligatorio ? 'bg-red-500' : 'bg-blue-500'}`}></div>
            
            <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{evento.tipo}</span>
            {evento.obligatorio && (
                <span className="bg-red-50 text-red-600 text-[10px] px-2 py-0.5 rounded-full border border-red-100 font-bold">OBLIGATORIO</span>
            )}
            </div>
            
            <h3 className="font-bold text-lg text-slate-900 mb-1">{evento.nombre}</h3>
            
            <div className="space-y-2 text-sm text-slate-600 mt-4">
            <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400"/>
                <span>{evento.fecha}</span>
            </div>
            <div className="flex items-center gap-2">
                <Clock size={16} className="text-slate-400"/>
                <span>{evento.hora}</span>
            </div>
            <div className="flex items-center gap-2">
                <Users size={16} className="text-slate-400"/>
                <span>{evento.grupo === 'Todos' ? 'Todos los grupos' : evento.grupo}</span>
            </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
            <button onClick={() => handleOpenQR(evento)} className="flex-1 text-sm bg-blue-50 text-blue-700 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                Ver QR
            </button>
            <button className="flex-1 text-sm border border-slate-200 text-slate-700 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors">
                Editar
            </button>
            </div>
        </div>
        ))}
    </div>
    )}

    {/* VISTA B: REGISTROS DE ASISTENCIA */}
    {activeTab === 'registros' && (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Sub-header de la tabla */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-bold text-slate-700">Registros del {selectedDate}</h3>
        <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
            type="text" 
            placeholder="Buscar alumno..." 
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
            />
        </div>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs border-b border-slate-200">
            <tr>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Grupo</th>
                <th className="px-6 py-4">Hora Entrada</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
            {ASISTENCIAS_MOCK.map((asistencia) => (
                <tr key={asistencia.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                    <div className="flex flex-col">
                    <span className="font-medium text-slate-900">{asistencia.usuario}</span>
                    <span className="text-xs text-slate-500 capitalize">{asistencia.rol.toLowerCase()}</span>
                    </div>
                </td>
                <td className="px-6 py-4 text-slate-600">{asistencia.grupo}</td>
                <td className="px-6 py-4 font-mono text-slate-600">{asistencia.horaMarcada}</td>
                <td className="px-6 py-4">
                    {getStatusBadge(asistencia.estado)}
                </td>
                <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50" aria-label="Más opciones">
                    <MoreHorizontal size={18} />
                    </button>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
        
        {/* Footer de la tabla (Paginación) */}
        <div className="p-4 border-t border-slate-200 flex justify-center text-xs text-slate-500">
        Mostrando 4 resultados de un total de 120
        </div>
    </div>
    )}

{/* --- MODAL 1: NUEVO EVENTO --- */}
    {isEventModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-lg text-slate-800">Programar Nuevo Evento</h3>
            <button aria-label="Cerrar Modal" onClick={() => setIsEventModalOpen(false)} className="text-slate-400 hover:text-slate-600">
            <XCircle size={24} />
            </button>
        </div>
        
        <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Evento</label>
                <input type="text" placeholder="Ej. Misa de Apertura" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                <select aria-label="Tipo de evento" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white">
                <option value="DOMINGO">Misa Domingo</option>
                <option value="ROSARIO">Rosario</option>
                <option value="PROCESION">Procesión</option>
                <option value="EXAMEN">Examen</option>
                <option value="OTRO">Otro</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Grupo</label>
                <select aria-label="Grupo del evento" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white">
                <option value="Todos">Todos los grupos</option>
                <option value="Mateo">Grupo Mateo</option>
                <option value="Marcos">Grupo Marcos</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                <input type="date" aria-label="Fecha del evento" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" required />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hora</label>
                <input type="time" aria-label="Hora del evento" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" required />
            </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-100 mt-2">
            <input type="checkbox" id="checkObligatorio" className="w-4 h-4 text-red-600 rounded focus:ring-red-500" />
            <label htmlFor="checkObligatorio" className="text-sm font-medium text-red-800">
                Este evento es obligatorio (Cuenta para inasistencias)
            </label>
            </div>

            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsEventModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium">Guardar Evento</button>
            </div>
        </form>
        </div>
    </div>
    )}

    {/* --- MODAL 2: GENERADOR DE QR --- */}
    {isQRModalOpen && selectedEventForQR && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center relative">
        
        {/* Cabecera Colorida */}
        <div className={`h-24 flex items-center justify-center ${selectedEventForQR.obligatorio ? 'bg-red-600' : 'bg-blue-600'}`}>
            <h3 className="text-white font-bold text-xl px-4">{selectedEventForQR.nombre}</h3>
        </div>
        
        {/* Cuerpo del QR */}
        <div className="p-8 -mt-10">
            <div className="bg-white p-4 rounded-xl shadow-lg inline-block mx-auto border-2 border-slate-100">
            {/* Generador QR Real usando API pública (No requiere librerías) */}
                <Image 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PARROQUIA-EVENTO-${selectedEventForQR.id}`} 
                alt="Código QR de Asistencia" 
                width={200}   // 👈 Obligatorio poner medidas
                height={200}  // 👈 Obligatorio poner medidas
                className="object-contain" // Puedes quitar w-48 h-48 porque ya definimos width/height
                />
            </div>

            <div className="mt-6 space-y-1">
            <p className="text-slate-500 text-sm uppercase font-semibold">Fecha del Evento</p>
            <p className="text-slate-900 font-bold text-lg">{selectedEventForQR.fecha} • {selectedEventForQR.hora}</p>
            </div>

            <div className="mt-2 text-xs text-slate-400 bg-slate-50 p-2 rounded-lg">
            Este código expira al finalizar el evento.
            </div>
        </div>

        {/* Botones */}
        <div className="grid grid-cols-2 gap-0 border-t border-slate-200">
            <button 
            onClick={() => setIsQRModalOpen(false)} 
            className="py-4 text-slate-600 font-medium hover:bg-slate-50 border-r border-slate-200"
            >
            Cerrar
            </button>
            <button 
            className="py-4 text-blue-600 font-bold hover:bg-blue-50"
            onClick={() => alert("Función de imprimir pendiente")}
            >
            Descargar / Imprimir
            </button>
        </div>
        </div>
    </div>
    )}
</div>
);
}
"use client";

import Link from "next/link";
import {
  MapPin, Clock, Lock, CheckCircle, Users, Heart, Wallet,
  Facebook, Instagram, Youtube, Loader2, Menu, X, Mail,
  Sparkles, Shirt, AlertCircle
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { inscripcionService } from "@/app/services/inscripcion"; 
import { InscripcionData } from "@/app/types"; // Asegúrate de tener este tipo definido o impórtalo del servicio

const COLORS = {
  primary: "#5A431C",
  dark: "#211814",
  accent: "#C0B1A0",
  bgLight: "#F9F8F6",
};

export default function Home() {
  // --- ESTADOS ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error', texto: string } | null>(null);
  
  // Carrusel Hero
  const heroImages = [ "/hero/1.jpg", "/hero/2.jpg", "/hero/4.jpg", "/hero/7.jpg"];
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  // --- LÓGICA DEL FORMULARIO ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    // 1. GUARDAMOS EL FORMULARIO EN UNA VARIABLE ANTES DEL AWAIT
    const form = e.currentTarget; 
    const formData = new FormData(form);

    // ... lógica de datos ...
    const datos: InscripcionData = {
       // ... (tus campos igual que antes) ...
       nombres: formData.get("nombres") as string,
       apellidos: formData.get("apellidos") as string,
       dni: formData.get("dni") as string,
       celular_joven: formData.get("celular_joven") as string,
       fecha_nacimiento: formData.get("fecha_nacimiento") as string,
       // edad: Number(formData.get("edad")), // <--- RECUERDA BORRAR ESTO SI YA LO QUITASTE
       email: (formData.get("email") as string) || "",
       direccion: formData.get("direccion") as string,
       nombre_apoderado: formData.get("nombre_apoderado") as string,
       celular_apoderado: formData.get("celular_apoderado") as string,
    };

    try {
      const respuesta = await inscripcionService.registrar(datos);
      
      setMensaje({ 
        tipo: 'exito', 
        texto: `¡Registro Exitoso! La ficha de inscripción de ${respuesta.nombres} se ha guardado correctamente. Nos pondremos en contacto pronto.` 
      });
      
      // 2. USAMOS LA VARIABLE GUARDADA, NO 'e.currentTarget'
      form.reset(); 

    } catch (error: any) {
      let textoAmigable = "Ocurrió un error inesperado. Por favor intenta de nuevo.";

      // CASO 1: El Backend nos respondió con un error conocido (ej: DNI duplicado)
      if (error.response) {
        const datosError = error.response.data;
        
        // Si es un error 400 (como el DNI duplicado que programamos)
        if (error.response.status === 400) {
           textoAmigable = datosError.detail || "Hay un problema con los datos enviados.";
        }
        
        // CASO 2: Error de validación automática de FastAPI (422)
        // Esto pasa si envían texto en un campo numérico o una fecha inválida
        else if (error.response.status === 422) {
           textoAmigable = "Algunos campos no son válidos. Por favor revisa que el email, fechas y números estén correctos.";
        }
        
        // CASO 3: Error del Servidor (500)
        else if (error.response.status >= 500) {
           textoAmigable = "Tenemos un problema técnico en el servidor. Por favor avísanos por WhatsApp si persiste.";
        }
      } 
      // CASO 4: Error de Conexión (El servidor está apagado o no hay internet)
      else if (error.request) {
        textoAmigable = "No pudimos conectar con el servidor. Verifica tu internet o intenta más tarde.";
      }
      setMensaje({ 
        tipo: 'error', 
        texto: textoAmigable 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: COLORS.bgLight, color: COLORS.dark }}>
      
      {/* ===== NAVBAR GLASS ===== */}
      <header className="fixed top-0 z-50 w-full pt-6 px-4">
        <div className="mx-auto max-w-6xl">
          <div
            className="relative flex h-16 items-center justify-between gap-4 rounded-full border border-white/30 bg-white/15 backdrop-blur-xl px-4 sm:px-6 shadow-lg z-50"
            style={{ WebkitBackdropFilter: "blur(18px)" }}
          >
            <Link href="/" className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full text-white font-bold shadow shrink-0" style={{ backgroundColor: COLORS.primary }}>
                SJ
              </div>
              <div className="leading-tight">
                <p className="text-[10px] uppercase tracking-widest font-bold opacity-70">Parroquia</p>
                <p className="text-[14px] font-serif font-bold hidden sm:block">San Juan María Vianney</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-sm font-semibold">
              {[
                { name: "Inicio", href: "#inicio" },
                { name: "Experiencia", href: "#experiencia" },
                { name: "Inscripciones", href: "#inscripciones" },
                { name: "Preguntas", href: "#preguntas-frecuentes" },
              ].map((link) => (
                <a key={link.name} href={link.href} className="rounded-full px-4 py-2 hover:bg-white/30 transition text-[#1B140A]/80 hover:text-black">
                  {link.name}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/login" className="group relative overflow-hidden rounded-full px-3 sm:px-5 py-2 shadow-md transition hover:shadow-lg flex items-center justify-center" style={{ backgroundColor: COLORS.primary, color: "white" }}>
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                <div className="relative flex items-center gap-2 text-sm font-medium">
                  <Lock size={16} className="text-[#C0B1A0]" />
                  <span className="hidden sm:block">Acceder</span>
                </div>
              </Link>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-full hover:bg-white/20 transition text-[#1B140A]">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {isMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 px-4 md:hidden animate-fade-in-down">
              <div className="rounded-3xl border border-white/30 bg-white/80 backdrop-blur-xl shadow-xl p-4 flex flex-col gap-2" style={{ WebkitBackdropFilter: "blur(20px)" }}>
                {[
                  { name: "Inicio", href: "#inicio" },
                  { name: "Experiencia", href: "#experiencia" },
                  { name: "Inscripciones", href: "#inscripciones" },
                  { name: "Preguntas Frecuentes", href: "#preguntas-frecuentes" },
                ].map((link) => (
                  <a key={link.name} href={link.href} onClick={() => setIsMenuOpen(false)} className="block w-full rounded-xl px-4 py-3 text-sm font-bold text-[#1B140A] hover:bg-white/50 transition active:scale-95">
                    {link.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow">
        {/* ===== HERO ===== */}
        <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
          <div className="absolute inset-0 z-0 bg-black">
            {heroImages.map((img, index) => (
              <div key={index} className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${index === currentImage ? "opacity-100" : "opacity-0"}`}>
                <Image src={img} alt={`Hero ${index}`} fill priority={index === 0} className="object-cover scale-105" unoptimized />
              </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/80" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#D1B28A]/10 blur-[120px] rounded-full mix-blend-screen" />
          </div>

          <div className="container relative z-10 px-6 mx-auto text-center">
            <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#D1B28A]/30 bg-black/40 backdrop-blur-md shadow-lg mx-auto">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D1B28A] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D1B28A]"></span>
                </span>
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#F3E5AB]">Inscripciones Abiertas 2026</span>
              </div>

              <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-2xl tracking-tight leading-[1.1]">
                Fortalece tu vida en <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D1B28A] via-[#F3E5AB] to-[#D1B28A] italic relative inline-block mt-1">
                  Cristo
                  <svg className="absolute -bottom-3 left-0 w-full h-4 text-[#D1B28A]" viewBox="0 0 100 10" preserveAspectRatio="none">
                     <path d="M0 5 Q 50 12 100 5" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.7" />
                  </svg>
                </span>
              </h1>

              <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex items-center justify-center gap-4 opacity-80">
                    <div className="h-px w-12 bg-white/40"></div>
                    <p className="text-lg md:text-xl font-light text-white uppercase tracking-widest">Catequesis de Confirmación</p>
                    <div className="h-px w-12 bg-white/40"></div>
                </div>
                <p className="text-base md:text-lg text-white/80 leading-relaxed font-sans max-w-lg mx-auto">
                  Un camino de madurez cristiana para jóvenes que desean recibir la fuerza del Espíritu Santo y ser testigos valientes de la fe.
                </p>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-3 z-20">
            {heroImages.map((_, idx) => (
              <button key={idx} onClick={() => setCurrentImage(idx)} className={`h-1 rounded-full transition-all duration-500 ${idx === currentImage ? "bg-[#D1B28A] w-8" : "bg-white/30 w-4 hover:bg-white/60"}`} aria-label={`Ir a imagen ${idx}`} />
            ))}
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/40">
             <span className="text-[10px] uppercase tracking-widest block text-center mb-1">Más Información</span>
             <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7" /></svg>
          </div>
        </section>

        {/* ===== EXPERIENCIA ===== */}
        <section id="experiencia" className="py-24 px-6 bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D1B28A]/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#211814] mb-4">
                Más que una clase, una <span className="text-[#D1B28A]">aventura</span>
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Olvídate de las charlas aburridas. La confirmación 2026 está diseñada para que hagas amigos, descubras tu propósito y vivas tu fe de una manera totalmente nueva.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-[#FAF9F6] p-8 rounded-3xl border border-transparent hover:border-[#D1B28A]/30 hover:shadow-xl transition-all duration-300 group">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#D1B28A] mb-6 group-hover:scale-110 transition-transform"><Users size={28} /></div>
                <h3 className="font-bold text-xl mb-3 text-[#211814]">Nuevos Amigos</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Conocerás a chicos y chicas de tu edad (14+) con tus mismas inquietudes.</p>
              </div>
              <div className="bg-[#FAF9F6] p-8 rounded-3xl border border-transparent hover:border-[#D1B28A]/30 hover:shadow-xl transition-all duration-300 group relative">
                 <div className="absolute top-4 right-4 bg-[#D1B28A] text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Top</div>
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#D1B28A] mb-6 group-hover:scale-110 transition-transform"><Heart size={28} /></div>
                <h3 className="font-bold text-xl mb-3 text-[#211814]">Retiros Espirituales</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Vive fines de semana inolvidables llenos de música, dinámicas y encuentro con Dios.</p>
              </div>
              <div className="bg-[#211814] p-8 rounded-3xl border border-gray-800 text-white hover:shadow-xl transition-all duration-300 group">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-[#D1B28A] mb-6 group-hover:scale-110 transition-transform"><CheckCircle size={28} /></div>
                <h3 className="font-bold text-xl mb-3">Solo un requisito</h3>
                <p className="text-sm text-white/60 leading-relaxed mb-4">No pedimos mucho. Solo necesitas tener ganas de aprender.</p>
                <div className="inline-block bg-[#D1B28A] text-[#211814] font-bold px-3 py-1 rounded text-xs">Tener 14 años o más</div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FORMULARIO ===== */}
        <section id="inscripciones" className="py-24 px-6 relative bg-[#211814] text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#D1B28A]/20 rounded-full blur-[100px]"></div>

          <div className="container mx-auto max-w-4xl relative z-10">
            <div className="text-center mb-10">
              <h2 className="font-serif text-4xl font-bold mb-4">Ficha de Inscripción 2026</h2>
              <p className="text-white/60 max-w-lg mx-auto">
                Completa todos los campos obligatorios (*). <br/>
                <span className="text-[#D1B28A]">Tus datos serán validados con tu DNI.</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-md border border-white/10 p-8 md:p-10 rounded-3xl text-left shadow-2xl">
              

              {/* GRUPO 1: DATOS JOVEN */}
              <div className="mb-8 border-b border-white/10 pb-8">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <span className="bg-[#D1B28A] w-2 h-6 rounded-full inline-block"></span> Sección 1: Datos Personales (Candidato)
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Nombres Completos *</label>
                    <input name="nombres" type="text" placeholder="Ej. Juan Carlos" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#D1B28A] transition-colors" required />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Apellidos Completos *</label>
                    <input name="apellidos" type="text" placeholder="Ej. Pérez López" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#D1B28A] transition-colors" required />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#D1B28A] mb-2">DNI *</label>
                    <input name="dni" type="tel" maxLength={8} placeholder="8 dígitos" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#D1B28A] transition-colors" required />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Fecha de Nacimiento *</label>
                    <input name="fecha_nacimiento" type="date" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#D1B28A] transition-colors appearance-none [color-scheme:dark]" />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#D1B28A] mb-2">Teléfono / WhatsApp (Joven) *</label>
                    <input name="celular_joven" type="tel" maxLength={9} placeholder="999 999 999" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#D1B28A] transition-colors" required />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Correo Electrónico</label>
                    <input name="email" type="email" placeholder="ejemplo@gmail.com" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#D1B28A] transition-colors" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Dirección de Domicilio *</label>
                    <input name="direccion" type="text" placeholder="Av. / Calle / Mz. / Lt." className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#D1B28A] transition-colors" required />
                  </div>
                </div>
              </div>

              {/* GRUPO 2: APODERADO */}
              <div>
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <span className="bg-[#D1B28A] w-2 h-6 rounded-full inline-block"></span> Sección 2: Datos del Apoderado
                </h3>
                <p className="text-xs text-white/40 mb-6 -mt-4 ml-4">Necesario para coordinaciones y reuniones de padres.</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#D1B28A] mb-2">Nombre del Apoderado *</label>
                    <input name="nombre_apoderado" type="text" placeholder="Papá, Mamá o Tutor" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#D1B28A] transition-colors" required />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#D1B28A] mb-2">Celular del Apoderado *</label>
                    <input name="celular_apoderado" type="tel" maxLength={9} placeholder="999 999 999" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#D1B28A] transition-colors" required />
                  </div>
                </div>
              </div>

              <button disabled={loading} className="w-full bg-[#D1B28A] hover:bg-[#c4a275] disabled:opacity-50 disabled:cursor-not-allowed text-[#211814] font-bold py-4 rounded-xl mt-10 shadow-lg shadow-[#D1B28A]/20 transition-all transform hover:-translate-y-1 text-sm tracking-widest uppercase flex items-center justify-center gap-2">
                 {loading ? <><Loader2 className="animate-spin" /> ENVIANDO...</> : "ENVIAR FICHA DE INSCRIPCIÓN"}
              </button>
              <p className="text-center text-xs text-white/40 mt-4">* Al enviar, declaras que los datos ingresados son verdaderos.</p>
            </form>
          </div>
        </section>

        {/* ===== PREGUNTAS FRECUENTES ===== */}
        <section id="preguntas-frecuentes" className="py-24 px-6 bg-[#FAF9F6]">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#211814]">Preguntas Frecuentes</h2>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">Resolvemos las dudas más comunes de los padres y jóvenes antes de iniciar este camino de fe.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="bg-[#D1B28A]/20 p-3 rounded-xl text-[#8B5E3C]"><Wallet size={24} /></div>
                  <div>
                    <h3 className="font-bold text-lg text-[#211814] mb-2">¿Tiene algún costo la inscripción?</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">Sí, existe una cuota única de inscripción. Este aporte cubre el <strong>libro de trabajo</strong> personal, materiales y retiros.</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="bg-[#D1B28A]/20 p-3 rounded-xl text-[#8B5E3C]"><Sparkles size={24} /></div>
                  <div>
                    <h3 className="font-bold text-lg text-[#211814] mb-2">¿Qué pasa si no estoy bautizado?</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">¡No hay problema! Te prepararemos para recibir el Bautismo antes de tu Confirmación.</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="bg-[#D1B28A]/20 p-3 rounded-xl text-[#8B5E3C]"><Clock size={24} /></div>
                  <div>
                    <h3 className="font-bold text-lg text-[#211814] mb-2">¿Es obligatorio asistir?</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">Sí, la constancia es fundamental. Se permite un máximo de 3 faltas justificadas.</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="bg-[#D1B28A]/20 p-3 rounded-xl text-[#8B5E3C]"><Shirt size={24} /></div>
                  <div>
                    <h3 className="font-bold text-lg text-[#211814] mb-2">¿Quiénes pueden ser padrinos?</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">Católicos confirmados, mayores de 18 años y con vida congruente con la fe.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer className="relative bg-[#12110F] text-white pt-20 pb-10 overflow-hidden font-sans">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#211814] via-[#D1B28A] to-[#211814]" />
          <div className="container mx-auto max-w-6xl px-6 relative z-10">
            <div className="grid md:grid-cols-4 gap-12 mb-16">
              <div className="md:col-span-1 space-y-4">
                <Link href="/" className="inline-block">
                  <span className="block text-[#D1B28A] text-xs font-bold tracking-[0.2em] uppercase mb-1">Parroquia</span>
                  <h4 className="font-serif text-2xl font-bold text-white leading-none">San Juan <br/> María Vianney</h4>
                </Link>
                <p className="text-white/50 text-sm leading-relaxed">Formando jóvenes en la fe, la esperanza y el amor. Arquidiócesis de Trujillo.</p>
                <div className="flex gap-4 pt-2">
                  <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#D1B28A] hover:text-[#211814] transition-all"><Facebook size={16} /></a>
                  <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#D1B28A] hover:text-[#211814] transition-all"><Instagram size={16} /></a>
                  <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#D1B28A] hover:text-[#211814] transition-all"><Youtube size={16} /></a>
                </div>
              </div>
              <div>
                <h5 className="font-bold text-white mb-6 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#D1B28A]"></span> Navegación</h5>
                <ul className="space-y-3 text-sm text-white/60">
                  <li><a href="#inicio" className="hover:text-[#D1B28A] transition-colors flex items-center gap-2">Inicio</a></li>
                  <li><a href="#inscripciones" className="hover:text-[#D1B28A] transition-colors flex items-center gap-2">Inscripciones 2026</a></li>
                  <li><a href="#experiencia" className="hover:text-[#D1B28A] transition-colors flex items-center gap-2">Experiencia</a></li>
                  <li><Link href="/login" className="hover:text-[#D1B28A] transition-colors flex items-center gap-2">Intranet Catequistas</Link></li>
                </ul>
              </div>
              <div>
                <h5 className="font-bold text-white mb-6 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#D1B28A]"></span> Despacho</h5>
                <ul className="space-y-4 text-sm text-white/60">
                  <li className="flex gap-3"><Clock size={18} className="text-[#D1B28A] shrink-0" /><span><strong className="block text-white text-xs uppercase tracking-wide mb-1">Lunes a Viernes</strong>9:00 AM - 1:00 PM <br/> 4:00 PM - 7:00 PM</span></li>
                  <li className="flex gap-3"><a href="https://maps.google.com/?q=Parroquia+San+Juan+Maria+Vianney+Wichanzao" target="_blank" rel="noopener noreferrer" className="flex gap-3 items-start group hover:text-white transition-colors"><MapPin size={18} className="text-[#D1B28A] shrink-0 mt-1 group-hover:animate-bounce" /><span className="group-hover:text-[#D1B28A] transition-colors">Av. 3, Mz 31, Lt. 5 <br/> Wichanzao, La Esperanza</span></a></li>
                </ul>
              </div>
              <div className="bg-[#1A1816] p-6 rounded-2xl border border-white/5">
                <h5 className="font-bold text-white mb-2">¿Tienes dudas?</h5>
                <p className="text-xs text-white/50 mb-6 leading-relaxed">Escríbenos directamente.</p>
                <a href="mailto:parroquia.sanjuanmariavianney.ti@gmail.com" className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-all border border-white/10"><Mail size={18} /> Enviar Correo</a>
              </div>
            </div>
            <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/30">
              <p>© 2026 Parroquia San Juan María Vianney.</p>
              <div className="flex gap-6"><a href="#" className="hover:text-white transition-colors">Privacidad</a><a href="#" className="hover:text-white transition-colors">Cookies</a></div>
            </div>
          </div>
        </footer>
      </main>

      {/* ================= MODAL DE ÉXITO / ERROR (NUEVO) ================= */}
      {mensaje && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fade-in">
          
          {/* Fondo Oscuro con Blur */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMensaje(null)} // Cierra si clickeas afuera
          />

          {/* Caja del Modal */}
          <div className="relative bg-[#FAF9F6] rounded-3xl p-8 md:p-10 max-w-md w-full shadow-2xl transform transition-all scale-100 animate-bounce-in text-center border border-white/20">
            
            {/* Icono Grande Animado */}
            <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-inner ${mensaje.tipo === 'exito' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {mensaje.tipo === 'exito' ? <CheckCircle size={40} /> : <AlertCircle size={40} />}
            </div>

            {/* Título */}
            <h3 className="text-2xl font-serif font-bold text-[#211814] mb-3">
              {mensaje.tipo === 'exito' ? '¡Inscripción Recibida!' : 'Ocurrió un problema'}
            </h3>

            {/* Texto del Mensaje */}
            <p className="text-gray-600 mb-8 leading-relaxed text-sm">
              {mensaje.texto}
            </p>

            {/* Botón de Acción */}
            <button
              onClick={() => setMensaje(null)}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 uppercase tracking-widest text-xs ${
                mensaje.tipo === 'exito' 
                  ? 'bg-[#16a34a] hover:bg-[#15803d] shadow-green-500/30' 
                  : 'bg-[#dc2626] hover:bg-[#b91c1c] shadow-red-500/30'
              }`}
            >
              {mensaje.tipo === 'exito' ? 'Entendido, gracias' : 'Intentar de nuevo'}
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
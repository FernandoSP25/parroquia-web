"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Lock, ArrowLeft, Loader2, Church } from "lucide-react";
import { authService } from "@/app/services/auth";
import { AxiosError } from "axios";

// --- TUS COLORES ---
const COLORS = {
  primary: "#5A431C",
  dark: "#211814",
  accent: "#C0B1A0",
  bgLight: "#F9F8F6",
};

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. LLAMADA REAL AL BACKEND
      const data = await authService.login({
        email: formData.email,
        password: formData.password
      });

      console.log("Login exitoso:", data);

      // 2. GUARDAR TOKEN Y USUARIO EN LOCALSTORAGE
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // 3. REDIRECCIÓN INTELIGENTE SEGÚN ROL
      // Buscamos qué rol tiene el usuario para mandarlo a su dashboard correcto
      const roles = data.user.roles;

      if (roles.includes("ADMIN")) {
        router.push("/admin");
      } else if (roles.includes("CATEQUISTA")) {
        router.push("/catequista");
      } else {
        router.push("/confirmante"); // O a una página por defecto
      }

    } catch (err: any) {
      // 4. MANEJO DE ERRORES REALES
      console.error("Error login:", err);
      if (err instanceof AxiosError) {
          // Si el backend responde (ej: 401 Credenciales incorrectas)
          setError(err.response?.data?.detail || "Error al iniciar sesión");
      } else {
          setError("No se pudo conectar con el servidor");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans"
         style={{ backgroundColor: COLORS.bgLight }}>
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border transition-all"
           style={{ borderColor: COLORS.accent }}>
        
        {/* Cabecera */}
        <div className="p-10 text-center relative overflow-hidden" style={{ backgroundColor: COLORS.dark }}>
          <div className="absolute top-0 left-0 w-full h-1 opacity-50 bg-gradient-to-r from-[#5A431C] via-[#C0B1A0] to-[#5A431C]"></div>
          
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg border border-[#ffffff20]"
               style={{ backgroundColor: COLORS.primary }}>
            <Church className="text-white" size={32} />
          </div>
          
          <h2 className="text-3xl font-serif font-bold text-white mb-2 tracking-wide">Bienvenido</h2>
          <p className="text-sm uppercase tracking-widest font-medium opacity-60 text-[#C0B1A0]">
            Sistema Parroquial
          </p>
        </div>

        {/* Formulario */}
        <div className="p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Input Email */}
            <div className="space-y-2">
              <label className="text-sm font-bold block ml-1" style={{ color: COLORS.dark }}>
                Correo Electrónico
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#5A431C]" style={{ color: COLORS.accent }}>
                  <User size={20} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="admin@parroquia.com"
                  className="w-full pl-12 pr-4 py-3.5 border rounded-xl outline-none transition-all bg-[#F9F8F6] focus:bg-white focus:ring-4 focus:ring-[#5A431C]/10"
                  style={{ borderColor: COLORS.accent, color: COLORS.dark }}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-2">
              <label className="text-sm font-bold block ml-1" style={{ color: COLORS.dark }}>
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#5A431C]" style={{ color: COLORS.accent }}>
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 border rounded-xl outline-none transition-all bg-[#F9F8F6] focus:bg-white focus:ring-4 focus:ring-[#5A431C]/10"
                  style={{ borderColor: COLORS.accent, color: COLORS.dark }}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {/* Mensaje de Error */}
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-center justify-center font-medium animate-pulse">
                {error}
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ backgroundColor: COLORS.primary }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Verificando...
                </>
              ) : (
                "Ingresar al Sistema"
              )}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t" style={{ borderColor: '#EBE5E0' }}>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:underline" style={{ color: COLORS.primary }}>
              <ArrowLeft size={16} /> Volver a la página principal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
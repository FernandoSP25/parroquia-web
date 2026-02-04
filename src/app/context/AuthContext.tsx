"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserInfo } from "@/app/types"; // Asegúrate de tener tus tipos importados

interface AuthContextType {
  user: UserInfo | null;
  isLoading: boolean;
  login: (token: string, userData: UserInfo) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname(); // Para saber en qué página estamos
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. AL CARGAR LA PÁGINA: Revisamos si hay token guardado
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        // Si hay token, cargamos al usuario en memoria
        setUser(JSON.parse(storedUser));
      } else {
        // Si NO hay token y estamos intentando entrar a una zona privada...
        // (Aquí defines qué rutas son públicas y cuáles privadas)
        const publicRoutes = ["/", "/login"]; 
        
        if (!publicRoutes.includes(pathname)) {
          console.log("🚫 Acceso denegado. Redirigiendo al login...");
          router.push("/login");
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [pathname, router]);

  // 2. FUNCIÓN DE LOGIN (Para usarla en tu página de Login)
  const login = (token: string, userData: UserInfo) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    
    // Redirigir según rol
    if (userData.roles.includes("ADMIN")) router.push("/admin");
    else if (userData.roles.includes("CATEQUISTA")) router.push("/catequista");
    else router.push("/confirmante");
  };

  // 3. FUNCIÓN DE LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar el contexto fácil
export const useAuth = () => useContext(AuthContext);
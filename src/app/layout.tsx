import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    // El %s se reemplaza por el título de páginas específicas si lo tuvieran
    template: '%s | Parroquia SJMV',
    default: 'Parroquia San Juan María Vianney', // Título principal
  },
  description: "Sitio web oficial de la Parroquia San Juan María Vianney. Inscripciones a catequesis, horarios y noticias.",
  // Opcional: Puedes añadir autores, palabras clave, etc.
  keywords: ["Parroquia", "Catequesis", "Confirmación 2026", "Trujillo", "Iglesia Católica"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

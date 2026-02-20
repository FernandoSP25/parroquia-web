import axios from 'axios';

// La URL de tu FastAPI (asegúrate que esté corriendo)
const API_URL = 'http://10.13.80.141:8000/api/v1';


const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// INTERCEPTOR (Truco Pro):
// Antes de cada petición, inyectamos el Token automáticamente si existe.
api.interceptors.request.use((config) => {
  // Ojo: En Next.js a veces guardamos el token en cookies o localStorage.
  // Por ahora asumiremos localStorage para simplificar.
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
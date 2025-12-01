// Configuración centralizada del backend
// Fijamos la URL del backend para evitar depender de variables de entorno de Vercel.
const API_BASE_URL = 'https://gestion-panol-eset-production.up.railway.app';

// Log visible para verificar en consola qué URL usa el frontend.
try {
	// Este console.log debe verse al cargar la app o al intentar login.
	// Si NO aparece, el deployment está sirviendo un build viejo.
	console.info('🔧 API_BASE_URL en frontend:', API_BASE_URL);
} catch {}

export default API_BASE_URL;

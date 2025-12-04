// Configuración centralizada del backend
// En producción usa la variable de entorno o Railway, en desarrollo usa localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://gestion-panol-eset-production.up.railway.app'
    : 'http://localhost:4000');

export default API_BASE_URL;

const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://gestion-panol-eset-backend.onrender.com'
    : 'http://localhost:4000');

export default API_BASE_URL;

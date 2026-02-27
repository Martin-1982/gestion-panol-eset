// config.js — URL base del backend
// En producción (Vercel): frontend y API están en el mismo dominio,
// por eso usamos string vacío → las llamadas van a /api/... del mismo host.
// En desarrollo: el backend corre en localhost:4000.

const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? ''
    : 'http://localhost:4000';

export default API_BASE_URL;

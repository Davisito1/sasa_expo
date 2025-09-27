// ===============================
// MantenimientosService.js
// ===============================

// 🔹 URL base de la API
const API_BASE = "http://localhost:8080"; // Ajusta según tu backend
const BASE = `${API_BASE}/apiMantenimiento`;

// -------------------------------
// Utilidad HTTP genérica
// -------------------------------
async function http(url, { method = "GET", headers = {}, body, credentials } = {}) {
  const isForm = body instanceof FormData;
  const baseHeaders = isForm ? {} : { "Content-Type": "application/json" };

  // 🔹 Token guardado en localStorage
  const token = localStorage.getItem("authToken");
  const auth = token ? { Authorization: `Bearer ${token}` } : {};

  // 🔹 Hacemos la petición
  const res = await fetch(url, {
    method,
    headers: { ...baseHeaders, ...auth, ...headers },
    body,
    credentials
  });

  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} -> ${url}\n${text}`);
  }

  return res;
}

// -------------------------------
// Servicios de Mantenimiento
// -------------------------------

// 🔹 Listar mantenimientos
export async function listarMantenimientos() {
  const r = await http(`${BASE}/consultar`);
  return r.json();
}

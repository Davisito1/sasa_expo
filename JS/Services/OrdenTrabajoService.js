// ===============================
// OrdenTrabajoService.js ✅ FINAL FUNCIONAL (Local + Heroku)
// ===============================

// Detectar entorno actual
const isProd =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("vercel.app") ||
   window.location.hostname.includes("herokuapp.com") ||
   window.location.hostname !== "localhost");

// Base dinámica
const API_BASE = isProd
  ? "https://sasaapi-73d5de493985.herokuapp.com"
  : "http://localhost:8080";

const BASE = `${API_BASE}/apiOrdenTrabajo`;

// ===============================
// Helper HTTP universal
// ===============================
async function http(url, { method = "GET", headers = {}, body } = {}) {
  const isForm = body instanceof FormData;
  const baseHeaders = isForm ? {} : { "Content-Type": "application/json" };

  const token = localStorage.getItem("authToken");
  const auth = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(url, {
    method,
    headers: { ...baseHeaders, ...auth, ...headers },
    body,
    credentials: "include",
  });

  const text = await res.text();

  if (!res.ok) {
    console.error(`❌ Error HTTP ${res.status} en: ${url}`);
    throw new Error(`HTTP ${res.status} -> ${url}\n${text}`);
  }

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

// ===============================
// Normalizador de respuesta
// ===============================
function normalizePage(json) {
  if (json?.data?.content)
    return json.data;
  if (json?.content)
    return json;
  if (Array.isArray(json?.data))
    return { content: json.data, totalPages: 1, totalElements: json.data.length };
  if (Array.isArray(json))
    return { content: json, totalPages: 1, totalElements: json.length };
  return { content: [], totalPages: 0, totalElements: 0 };
}

// ===============================
// MÉTODOS CRUD
// ===============================

// 🔹 Listar órdenes (con paginación y filtros)
export async function listarOrdenes({ page = 0, size = 10, filtro = "", estado = "" } = {}) {
  const params = new URLSearchParams({ page, size });
  if (filtro) params.append("filtro", filtro);
  if (estado) params.append("estado", estado);

  const url = `${BASE}/consultar?${params.toString()}`;
  const json = await http(url);
  return normalizePage(json);
}

// 🔹 Crear nueva orden
export async function crearOrden({ idVehiculo, fecha }) {
  const payload = { idVehiculo, fecha };
  const json = await http(`${BASE}/crear`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return json?.data ?? json;
}

// 🔹 Actualizar orden existente
export async function actualizarOrden(idOrden, { idVehiculo, fecha }) {
  const payload = { idVehiculo, fecha };
  const json = await http(`${BASE}/actualizar/${encodeURIComponent(idOrden)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return json?.data ?? json;
}

// 🔹 Obtener orden por ID
export async function obtenerOrden(idOrden) {
  const json = await http(`${BASE}/consultar/${encodeURIComponent(idOrden)}`);
  return json?.data ?? json;
}

// 🔹 Eliminar orden
export async function eliminarOrden(idOrden) {
  const json = await http(`${BASE}/eliminar/${encodeURIComponent(idOrden)}`, {
    method: "DELETE",
  });
  return json?.data ?? json;
}

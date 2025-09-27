// ===============================
// OrdenTrabajoService.js FINAL ✅
// ===============================

const API_BASE = "http://localhost:8080";
const BASE = `${API_BASE}/apiOrdenTrabajo`;

// -------------------------------
// Utilidad HTTP genérica
// -------------------------------
async function http(url, { method = "GET", headers = {}, body, credentials } = {}) {
  const isForm = body instanceof FormData;
  const baseHeaders = isForm ? {} : { "Content-Type": "application/json" };

  const token = localStorage.getItem("authToken");
  const auth = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(url, {
    method,
    headers: { ...baseHeaders, ...auth, ...headers },
    body,
    credentials,
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} -> ${url}\n${text}`);

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

// -------------------------------
// Normalizador de paginación
// -------------------------------
function normalizePage(json) {
  // Caso 1: Spring paginado
  if (json?.data?.content) {
    return {
      content: json.data.content,
      totalPages: json.data.totalPages ?? 1,
      totalElements: json.data.totalElements ?? json.data.content.length,
      number: json.data.number ?? 0,
    };
  }
  // Caso 2: Spring paginado sin wrapper
  if (json?.content) {
    return {
      content: json.content,
      totalPages: json.totalPages ?? 1,
      totalElements: json.totalElements ?? json.content.length,
      number: json.number ?? 0,
    };
  }
  // Caso 3: Wrapper con data:[...]
  if (Array.isArray(json?.data)) {
    return {
      content: json.data,
      totalPages: 1,
      totalElements: json.data.length,
      number: 0,
    };
  }
  // Caso 4: Array plano
  if (Array.isArray(json)) {
    return { content: json, totalPages: 1, totalElements: json.length, number: 0 };
  }
  return { content: [], totalPages: 0, totalElements: 0, number: 0 };
}

// -------------------------------
// Servicios Orden de Trabajo
// -------------------------------
export async function listarOrdenes({ page = 0, size = 10, filtro = "", estado = "" } = {}) {
  const q = new URLSearchParams({ page, size });
  if (filtro) q.set("filtro", filtro);
  if (estado) q.set("estado", estado);

  const url = `${BASE}/consultar?${q.toString()}`;
  console.log("➡️ GET ordenes:", url);

  const json = await http(url);
  console.log("📥 Respuesta ordenes:", json);

  return normalizePage(json);
}

export async function crearOrden({ idVehiculo, fecha }) {
  return http(`${BASE}/crear`, {
    method: "POST",
    body: JSON.stringify({ idVehiculo, fecha }),
  });
}

export async function actualizarOrden(idOrden, { idVehiculo, fecha }) {
  return http(`${BASE}/actualizar/${encodeURIComponent(idOrden)}`, {
    method: "PUT",
    body: JSON.stringify({ idVehiculo, fecha }),
  });
}

export async function obtenerOrden(idOrden) {
  return http(`${BASE}/${encodeURIComponent(idOrden)}`);
}

export async function eliminarOrden(idOrden) {
  return http(`${BASE}/eliminar/${encodeURIComponent(idOrden)}`, { method: "DELETE" });
}

// ===============================
// Servicio de Citas (CRUD + Paginado)
// ===============================

const API_BASE = "http://localhost:8080/apiCitas";

// ===== Utilidad fetch =====
async function fetchJsonOrThrow(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} -> ${url}\n${text}`);
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

// ===== Normalización de respuesta =====
function normalizeResponse(json) {
  if (!json) return { content: [], totalPages: 1, totalElements: 0 };
  if (json.data?.content) return json.data;
  if (json.content) return json;
  if (Array.isArray(json.data)) {
    return { content: json.data, totalPages: 1, totalElements: json.data.length };
  }
  return { content: [], totalPages: 1, totalElements: 0 };
}

// ===== Servicios Citas =====

// Listar con paginación
export async function getCitasPaginado(page = 0, size = 10) {
  const s = Math.min(size, 100);
  const url = `${API_BASE}/consultar?page=${page}&size=${s}`;
  const json = await fetchJsonOrThrow(url);
  return normalizeResponse(json);
}

// Obtener por ID
export async function getCitaById(id) {
  const json = await fetchJsonOrThrow(`${API_BASE}/${id}`);
  return json?.data ?? json;
}

// Crear
export async function createCita(data) {
  const payload = {
    fecha: data.fecha,
    hora: data.hora,
    estado: data.estado,
    idCliente: data.idCliente
  };
  const body = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  };
  const json = await fetchJsonOrThrow(`${API_BASE}/registrar`, body);
  return json?.data ?? json;
}

// Actualizar
export async function updateCita(id, data) {
  const payload = {
    fecha: data.fecha,
    hora: data.hora,
    estado: data.estado,
    idCliente: data.idCliente
  };
  const body = {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  };
  const json = await fetchJsonOrThrow(`${API_BASE}/actualizar/${id}`, body);
  return json?.data ?? json;
}

// Eliminar
export async function deleteCita(id) {
  const json = await fetchJsonOrThrow(`${API_BASE}/eliminar/${id}`, { method: "DELETE" });
  return json?.data ?? json;
}

// ===============================
// CitasService.js
// ===============================

// URL base para todas las llamadas a la API de citas
const API_BASE = "http://localhost:8080/apiCitas";

// ===============================
// FUNCIONES AUXILIARES
// ===============================

// -------- Utilidad base para fetch --------
// Hace la llamada fetch, maneja errores y devuelve JSON o texto
async function fetchJsonOrThrow(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();

  // Si la respuesta no es OK, lanza error con detalle
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} -> ${url}\n${text}`);

  // Intenta parsear a JSON, si no es válido, devuelve texto plano
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

// -------- Normalización de respuesta --------
// Estandariza diferentes formatos de API en un objeto común
function normalizeResponse(json) {
  if (!json) return { content: [], totalPages: 1, totalElements: 0 };
  if (json.data && json.data.content) return json.data;   // formato Spring pageable
  if (json.content) return json;                          // formato con content directo
  if (Array.isArray(json.data)) 
    return { content: json.data, totalPages: 1, totalElements: json.data.length };

  return { content: [], totalPages: 1, totalElements: 0 };
}

// ===============================
// SERVICIOS CITAS (CRUD)
// ===============================

// -------- LISTAR CITAS (paginado) --------
export async function getCitasPaginado(page = 0, size = 10) {
  const s = Math.min(size, 100); // límite máximo de 100 registros por página
  const url = `${API_BASE}/consultar?page=${page}&size=${s}`;
  const json = await fetchJsonOrThrow(url);
  return normalizeResponse(json);
}

// -------- OBTENER CITA POR ID --------
export async function getCitaById(id) {
  const json = await fetchJsonOrThrow(`${API_BASE}/${id}`);
  return json?.data ?? json;
}

// -------- CREAR CITA --------
export async function createCita(data) {
  const payload = {
    fecha: data.fecha,
    hora: data.hora,
    estado: data.estado,
    idCliente: data.idCliente // 🔹 ID plano del cliente
  };

  const body = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  };

  const json = await fetchJsonOrThrow(`${API_BASE}/registrar`, body);
  return json?.data ?? json;
}

// -------- ACTUALIZAR CITA --------
export async function updateCita(id, data) {
  const payload = {
    fecha: data.fecha,
    hora: data.hora,
    estado: data.estado,
    idCliente: data.idCliente // 🔹 ID plano del cliente
  };

  const body = {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  };

  const json = await fetchJsonOrThrow(`${API_BASE}/actualizar/${id}`, body);
  return json?.data ?? json;
}

// -------- ELIMINAR CITA --------
export async function deleteCita(id) {
  const json = await fetchJsonOrThrow(`${API_BASE}/eliminar/${id}`, { method: "DELETE" });
  return json?.data ?? json;
}

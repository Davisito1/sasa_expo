// ===============================
// CitasService.js
// ===============================
const API_BASE = "http://localhost:8080/apiCitas";

// -------------------------------
// Fetch con manejo de errores
// -------------------------------
async function fetchJsonOrThrow(url, options = {}) {
  const isGet = !options.method || options.method === "GET";
  const headers = isGet
    ? { ...(options.headers || {}) } // GET sin content-type
    : { "Content-Type": "application/json", Accept: "application/json", ...(options.headers || {}) };

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    let msg = `Error ${res.status} -> ${url}`;
    try {
      const errorData = await res.json();
      msg += "\n" + JSON.stringify(errorData);
    } catch {}
    throw new Error(msg);
  }

  // Si no hay contenido (ej. DELETE con 204)
  if (res.status === 204) return null;

  return res.json();
}

// -------------------------------
// Normalizar respuesta
// -------------------------------
function normalize(json) {
  if (!json) return { content: [], totalPages: 1, totalElements: 0 };
  if (json.data?.content) return json.data;
  if (json.content) return json;
  if (Array.isArray(json)) return { content: json, totalPages: 1, totalElements: json.length };
  if (Array.isArray(json.data)) return { content: json.data, totalPages: 1, totalElements: json.data.length };
  return json;
}

// -------------------------------
// Obtener citas (paginado)
// -------------------------------
export async function getCitasPaginado(page = 0, size = 10) {
  const url = `${API_BASE}/consultar?page=${page}&size=${size}`;
  const json = await fetchJsonOrThrow(url);
  return normalize(json);
}

// -------------------------------
// Obtener cita por ID
// -------------------------------
export async function getCitaById(id) {
  const url = `${API_BASE}/${id}`;
  const json = await fetchJsonOrThrow(url);
  return json?.data ?? json;
}

// -------------------------------
// Crear cita
// -------------------------------
export async function createCita(data) {
  const url = `${API_BASE}/registrar`;
  const json = await fetchJsonOrThrow(url, {
    method: "POST",
    body: JSON.stringify(data)
  });
  return json?.data ?? json;
}

// -------------------------------
// Actualizar cita
// -------------------------------
export async function updateCita(id, data) {
  const url = `${API_BASE}/actualizar/${id}`;
  const json = await fetchJsonOrThrow(url, {
    method: "PUT",
    body: JSON.stringify(data)
  });
  return json?.data ?? json;
}

// -------------------------------
// Eliminar cita
// -------------------------------
export async function deleteCita(id) {
  const url = `${API_BASE}/eliminar/${id}`;
  await fetchJsonOrThrow(url, { method: "DELETE" }); // sin return porque backend puede dar 204
  return true;
}

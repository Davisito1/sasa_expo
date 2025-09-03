const API_BASE = "http://localhost:8080/apiMantenimiento";

// -------- Utilidad base para fetch --------
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

// -------- Normalización de respuesta --------
function normalizeResponse(json) {
  if (!json) return { content: [], totalPages: 1, totalElements: 0 };
  if (json.data && json.data.content) return json.data;      // Spring pageable
  if (json.content) return json;                             // respuesta directa
  if (Array.isArray(json.data)) return { content: json.data, totalPages: 1, totalElements: json.data.length };
  return { content: [], totalPages: 1, totalElements: 0 };
}

// ===============================
// LISTAR (paginado + búsqueda)
// ===============================
export async function getMantenimientos(page = 0, size = 10, query = "") {
  const s = Math.min(size, 100);
  let url = `${API_BASE}/consultar?page=${page}&size=${s}`;
  if (query && query.trim() !== "") url += `&q=${encodeURIComponent(query)}`;
  const json = await fetchJsonOrThrow(url);
  return normalizeResponse(json);
}

// OBTENER POR ID

export async function getMantenimientoById(id) {
  const json = await fetchJsonOrThrow(`${API_BASE}/${id}`);
  return json?.data ?? json;
}

// CREAR MANTENIMIENTO

export async function createMantenimiento(data) {
  const payload = {
    descripcion: data.descripcion,                   
    fechaRealizacion: data.fechaRealizacion,
    codigoMantenimiento: data.codigoMantenimiento,
    idVehiculo: data.idVehiculo                      
  };

  const body = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  };

  const json = await fetchJsonOrThrow(`${API_BASE}/registrar`, body);
  return json?.data ?? json;
}


// ACTUALIZAR MANTENIMIENTO
export async function updateMantenimiento(id, data) {
  const payload = {
    descripcion: data.descripcion,
    fechaRealizacion: data.fechaRealizacion,
    codigoMantenimiento: data.codigoMantenimiento,
    idVehiculo: data.idVehiculo
  };

  const body = {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  };

  const json = await fetchJsonOrThrow(`${API_BASE}/actualizar/${id}`, body);
  return json?.data ?? json;
}

// ELIMINAR MANTENIMIENTO
export async function deleteMantenimiento(id) {
  const json = await fetchJsonOrThrow(`${API_BASE}/eliminar/${id}`, { method: "DELETE" });
  return json?.data ?? json;
}

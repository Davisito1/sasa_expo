// ===============================
// MantenimientosService.js
// ===============================
const API_BASE = "http://localhost:8080/apiMantenimiento";

// -------- Utilidad base --------
async function fetchJsonOrThrow(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} -> ${url}\n${text}`);
  try { return text ? JSON.parse(text) : null; } catch { return text; }
}

// -------- Normalización --------
function normalizePage(json) {
  if (!json) return { content: [], totalPages: 0, totalElements: 0 };
  if (json.data && json.data.content) return json.data;        // cuando viene dentro de "data"
  if (json.content) return json;                               // cuando viene directo
  if (Array.isArray(json.data)) return { content: json.data, totalPages: 1, totalElements: json.data.length };
  if (Array.isArray(json)) return { content: json, totalPages: 1, totalElements: json.length };
  return { content: [], totalPages: 0, totalElements: 0 };
}

// ===============================
// LISTAR (paginado + búsqueda)
// ===============================
export async function getMantenimientos(page = 0, size = 10, q = "") {
  const s = Math.min(size, 50);
  let url = `${API_BASE}/consultar?page=${page}&size=${s}`;
  if (q && q.trim() !== "") url += `&q=${encodeURIComponent(q)}`;

  const json = await fetchJsonOrThrow(url);
  return normalizePage(json);
}

// ===============================
// CREAR
// ===============================
export async function createMantenimiento(data) {
  const payload = {
    descripcionTrabajo: data.descripcionTrabajo ?? "",
    fechaRealizacion: data.fechaRealizacion,
    idVehiculo: data.idVehiculo
  };

  const body = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };

  const json = await fetchJsonOrThrow(`${API_BASE}/registrar`, body);
  return json?.data ?? json;
}

// ===============================
// ACTUALIZAR
// ===============================
export async function updateMantenimiento(id, data) {
  const payload = {
    descripcionTrabajo: data.descripcionTrabajo ?? "",
    fechaRealizacion: data.fechaRealizacion,
    codigoMantenimiento: data.codigoMantenimiento || undefined,
    idVehiculo: data.idVehiculo
  };

  const body = {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };

  const json = await fetchJsonOrThrow(`${API_BASE}/actualizar/${id}`, body);
  return json?.data ?? json;
}

// ===============================
// ELIMINAR
// ===============================
export async function deleteMantenimiento(id) {
  const json = await fetchJsonOrThrow(`${API_BASE}/eliminar/${id}`, { method: "DELETE" });
  return json?.data ?? json;
}

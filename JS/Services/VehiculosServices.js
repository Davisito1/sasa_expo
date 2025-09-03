// VehiculosServices.js
const API_BASE = "http://localhost:8080/apiVehiculo";

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
  if (json.data && json.data.content) return json.data;   // {status, data: Page}
  if (json.content) return json;                          // Page directo
  if (Array.isArray(json.data)) return { content: json.data, totalPages: 1, totalElements: json.data.length };
  if (Array.isArray(json)) return { content: json, totalPages: 1, totalElements: json.length };
  return { content: [], totalPages: 0, totalElements: 0 };
}

// =============== READ (paginado + orden) ===============
export async function getVehiculos(page = 0, size = 10, sortBy = "idVehiculo", sortDir = "asc") {
  const url = `${API_BASE}/consultar?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`;
  const json = await fetchJsonOrThrow(url);
  return normalizePage(json);
}

// =============== CREATE ===============
export async function createVehiculo(data) {
  const payload = {
    ...data,
    idCliente: data.idCliente,
    idEstado:  data.idEstado
  };

  const body = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };

  const json = await fetchJsonOrThrow(`${API_BASE}/registrar`, body);
  return json?.data ?? json;
}

// =============== UPDATE ===============
export async function updateVehiculo(id, data) {
  const payload = {
    ...data,
    idCliente: data.idCliente,
    idEstado:  data.idEstado
  };

  const body = {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };

  const json = await fetchJsonOrThrow(`${API_BASE}/actualizar/${id}`, body);
  return json?.data ?? json;
}

// =============== DELETE ===============
export async function deleteVehiculo(id) {
  const json = await fetchJsonOrThrow(`${API_BASE}/eliminar/${id}`, { method: "DELETE" });
  return json?.data ?? json;
}

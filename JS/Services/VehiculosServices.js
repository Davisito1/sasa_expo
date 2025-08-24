// 🔧 VehiculosServices.js
// Trabaja contra tu API local de Spring Boot.
// Es tolerante a diferentes estructuras de respuesta (Page, wrapper "data", lista directa).

const API_BASE = "http://localhost:8080";

// ——————————————————————————————————————————————
// Helpers para parsear respuestas con diferentes formas
// ——————————————————————————————————————————————
function parseListResponse(json) {
  // Soporta:
  // 1) { data: { content: [...] } }
  // 2) { content: [...] }
  // 3) { data: [...] }
  // 4) [...]
  if (Array.isArray(json)) return json;
  if (json?.data?.content) return json.data.content;
  if (json?.content) return json.content;
  if (json?.data && Array.isArray(json.data)) return json.data;
  return [];
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${text || url}`);
  }
  return res.json();
}

// ——————————————————————————————————————————————
// Vehículos
// ——————————————————————————————————————————————
const VEHICULOS_API = `${API_BASE}/apiVehiculo`;

export async function getVehiculos({ page = 0, size = 500 } = {}) {
  // Intento 1: endpoint paginado /consultar
  try {
    const j = await fetchJson(`${VEHICULOS_API}/consultar?page=${page}&size=${size}`);
    return parseListResponse(j);
  } catch {
    // Intento 2: lista directa en /
    const j = await fetchJson(`${VEHICULOS_API}`);
    return parseListResponse(j);
  }
}

export async function createVehiculo(vehiculo) {
  const j = await fetchJson(VEHICULOS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vehiculo),
  });
  return j;
}

export async function updateVehiculo(id, vehiculo) {
  const j = await fetchJson(`${VEHICULOS_API}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vehiculo),
  });
  return j;
}

export async function deleteVehiculo(id) {
  await fetchJson(`${VEHICULOS_API}/${id}`, { method: "DELETE" });
  return true;
}

// ——————————————————————————————————————————————
// Clientes
// ——————————————————————————————————————————————
const CLIENTES_API = `${API_BASE}/apiCliente`;

export async function getClientes({ page = 0, size = 200 } = {}) {
  try {
    const j = await fetchJson(`${CLIENTES_API}/consultar?page=${page}&size=${size}`);
    return parseListResponse(j);
  } catch {
    const j = await fetchJson(`${CLIENTES_API}`);
    return parseListResponse(j);
  }
}

// ——————————————————————————————————————————————
// Estados de Vehículo
// ——————————————————————————————————————————————
const ESTADOS_API = `${API_BASE}/apiEstadoVehiculo`;

export async function getEstados({ page = 0, size = 200 } = {}) {
  try {
    const j = await fetchJson(`${ESTADOS_API}/consultar?page=${page}&size=${size}`);
    return parseListResponse(j);
  } catch {
    const j = await fetchJson(`${ESTADOS_API}`);
    return parseListResponse(j);
  }
}


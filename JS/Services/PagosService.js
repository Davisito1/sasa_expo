// ===============================
// PagosService.js
// ===============================
const API_BASE = "http://localhost:8080/apiPagos";

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
  if (!json) return [];
  if (json.data && Array.isArray(json.data)) return json.data;   // caso con envoltorio {status,data:[...]}
  if (Array.isArray(json)) return json;                         // lista directa
  return [];
}

// ===============================
// LISTAR TODOS
// ===============================
export async function getPagos() {
  const json = await fetchJsonOrThrow(`${API_BASE}/consultar`);
  return normalizeResponse(json);
}

// ===============================
// OBTENER POR ID
// ===============================
export async function getPagoById(id) {
  const json = await fetchJsonOrThrow(`${API_BASE}/${id}`);
  return json?.data ?? json;
}


export async function createPago(data) {
  const payload = {
    fecha: data.fecha,
    monto: data.monto,
    idFactura: data.idFactura,
    idMetodoPago: data.idMetodoPago   // ✅ corregido
  };

  const body = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };

  const json = await fetchJsonOrThrow(`${API_BASE}/registrar`, body);
  return json?.data ?? json;
}

export async function updatePago(id, data) {
  const payload = {
    fecha: data.fecha,
    monto: data.monto,
    idFactura: data.idFactura,
    idMetodoPago: data.idMetodoPago   // ✅ corregido
  };

  const body = {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };

  const json = await fetchJsonOrThrow(`${API_BASE}/actualizar/${id}`, body);
  return json?.data ?? json;
}


export async function deletePago(id) {
  const json = await fetchJsonOrThrow(`${API_BASE}/eliminar/${id}`, { method: "DELETE" });
  return json?.data ?? json;
}

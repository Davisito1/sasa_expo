// ===============================
// FacturasService.js FINAL ✅
// ===============================

const BASE = "http://localhost:8080/apiFactura";
const EMPLEADOS_API = "http://localhost:8080/apiEmpleados";      // plural correcto
const METODOS_PAGO_API = "http://localhost:8080/api/metodoPago"; // correcto con /listar

// -------------------------------
// Utilidad base para fetch
// -------------------------------
async function fetchJsonOrThrow(url, options = {}) {
  const res = await fetch(url, { credentials: "include", ...options });
  const text = await res.text();

  // ⚠️ Si falla, devolver el error real del backend
  if (!res.ok) {
    try {
      return Promise.reject(JSON.parse(text));
    } catch {
      throw new Error(`${res.status} ${res.statusText} -> ${url}\n${text}`);
    }
  }

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

// -------------------------------
// Normalización de paginación
// -------------------------------
function normalizePage(json) {
  if (json?.data?.content) {
    return {
      content: json.data.content,
      totalPages: json.data.totalPages ?? 1,
      number: json.data.number ?? 0,
    };
  }
  if (json?.content) {
    return {
      content: json.content,
      totalPages: json.totalPages ?? 1,
      number: json.number ?? 0,
    };
  }
  if (Array.isArray(json)) {
    return { content: json, totalPages: 1, number: 0 };
  }
  return { content: [], totalPages: 0, number: 0 };
}

// ===============================
// Servicios Factura (CRUD + extras)
// ===============================
export async function getFacturas({ page = 0, size = 10, archivada = false, onlyWithOrder = false } = {}) {
  const url = new URL(`${BASE}/consultar`);
  url.searchParams.set("page", page);
  url.searchParams.set("size", size);
  url.searchParams.set("archivada", archivada ? "true" : "false");
  if (onlyWithOrder) url.searchParams.set("onlyWithOrder", "true");

  const json = await fetchJsonOrThrow(url.toString());
  return normalizePage(json);
}

export async function getFacturaById(id) {
  const json = await fetchJsonOrThrow(`${BASE}/${id}`);
  return json?.data ?? json;
}

export async function createFactura(data) {
  return fetchJsonOrThrow(`${BASE}/registrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateFactura(id, data) {
  return fetchJsonOrThrow(`${BASE}/actualizar/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteFactura(id) {
  return fetchJsonOrThrow(`${BASE}/eliminar/${id}`, { method: "DELETE" });
}

export async function archiveFactura(id) {
  return fetchJsonOrThrow(`${BASE}/${id}/archivar`, { method: "PUT" });
}

export async function unarchiveFactura(id) {
  return fetchJsonOrThrow(`${BASE}/${id}/restaurar`, { method: "PUT" });
}

export async function payFactura(id) {
  return fetchJsonOrThrow(`${BASE}/${id}/pagar`, { method: "PUT" });
}

export async function anularFactura(id) {
  return fetchJsonOrThrow(`${BASE}/anular/${id}`, { method: "PUT" });
}

// ===============================
// 🔹 Nuevos servicios: empleados y métodos de pago
// ===============================
export async function listarEmpleados() {
  // Backend usa /apiEmpleados/consultar
  const json = await fetchJsonOrThrow(`${EMPLEADOS_API}/consultar?page=0&size=100`);
  return json?.data?.content || json?.content || json || [];
}

export async function listarMetodosPago() {
  // Backend usa /api/metodoPago/listar
  const json = await fetchJsonOrThrow(`${METODOS_PAGO_API}/listar`);
  return json?.data || json || [];
}

// ===============================
// FacturasService.js FINAL ✅ (Heroku + Local + Vercel)
// ===============================

// 🔥 Detectar entorno (funciona en 127.0.0.1, localhost y Vercel)
const isProd =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("vercel.app") ||
   window.location.hostname === "127.0.0.1" ||
   window.location.hostname === "0.0.0.0");

// ===============================
// Bases dinámicas
// ===============================
const BASE = isProd
  ? "https://sasaapi-73d5de493985.herokuapp.com/apiFactura"        // Heroku API base
  : "http://localhost:8080/apiFactura";

const EMPLEADOS_API = isProd
  ? "https://sasaapi-73d5de493985.herokuapp.com/apiEmpleados"      // Heroku API empleados
  : "http://localhost:8080/apiEmpleados";

const METODOS_PAGO_API = isProd
  ? "https://sasaapi-73d5de493985.herokuapp.com/api/metodoPago"    // Heroku API métodos de pago
  : "http://localhost:8080/api/metodoPago";

// -------------------------------
// Fetch con manejo de errores
// -------------------------------
async function fetchJsonOrThrow(url, options = {}) {
  const res = await fetch(url, { credentials: "include", ...options });
  const text = await res.text();

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

// -------- Listar facturas (paginado) --------
export async function getFacturas({ page = 0, size = 10, archivada = false, onlyWithOrder = false } = {}) {
  const url = new URL(`${BASE}/consultar`);
  url.searchParams.set("page", page);
  url.searchParams.set("size", size);
  url.searchParams.set("archivada", archivada ? "true" : "false");
  if (onlyWithOrder) url.searchParams.set("onlyWithOrder", "true");

  const json = await fetchJsonOrThrow(url.toString());
  return normalizePage(json);
}

// -------- Obtener factura por ID --------
export async function getFacturaById(id) {
  const json = await fetchJsonOrThrow(`${BASE}/${id}`);
  return json?.data ?? json;
}

// -------- Crear factura --------
export async function createFactura(data) {
  return fetchJsonOrThrow(`${BASE}/registrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// -------- Actualizar factura --------
export async function updateFactura(id, data) {
  return fetchJsonOrThrow(`${BASE}/actualizar/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// -------- Eliminar factura --------
export async function deleteFactura(id) {
  return fetchJsonOrThrow(`${BASE}/eliminar/${id}`, { method: "DELETE" });
}

// -------- Archivar factura --------
export async function archiveFactura(id) {
  return fetchJsonOrThrow(`${BASE}/${id}/archivar`, { method: "PUT" });
}

// -------- Desarchivar factura --------
export async function unarchiveFactura(id) {
  return fetchJsonOrThrow(`${BASE}/${id}/restaurar`, { method: "PUT" });
}

// -------- Marcar factura como pagada --------
export async function payFactura(id) {
  return fetchJsonOrThrow(`${BASE}/${id}/pagar`, { method: "PUT" });
}

// -------- Anular factura --------
export async function anularFactura(id) {
  return fetchJsonOrThrow(`${BASE}/${id}/anular`, { method: "PUT" });
}

// ===============================
// 🔹 Servicios extra: empleados y métodos de pago
// ===============================
export async function listarEmpleados() {
  const json = await fetchJsonOrThrow(`${EMPLEADOS_API}/consultar?page=0&size=100`);
  return json?.data?.content || json?.content || json || [];
}

export async function listarMetodosPago() {
  const json = await fetchJsonOrThrow(`${METODOS_PAGO_API}/listar`);
  return json?.data || json || [];
}

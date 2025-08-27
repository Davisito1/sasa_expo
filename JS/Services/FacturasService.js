// ===============================
// FacturasService.js
// ===============================
const API_BASE = "http://localhost:8080/apiFactura";

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

// -------- Normalización de paginación --------
function normalizePage(json) {
  if (json?.data?.content) {
    return {
      content: json.data.content,
      totalPages: json.data.totalPages ?? 1
    };
  }
  if (json?.content) {
    return {
      content: json.content,
      totalPages: json.totalPages ?? 1
    };
  }
  if (Array.isArray(json)) {
    return { content: json, totalPages: 1 };
  }
  return { content: [], totalPages: 0 };
}

// ===============================
// LISTAR PAGINADO
// ===============================
export async function getFacturas(page = 0, size = 10) {
  const json = await fetchJsonOrThrow(`${API_BASE}/consultar?page=${page}&size=${size}`);
  return normalizePage(json);
}

// ===============================
// OBTENER POR ID
// ===============================
export async function getFacturaById(id) {
  const json = await fetchJsonOrThrow(`${API_BASE}/${id}`);
  return json?.data ?? json;
}

// ===============================
// CREAR
// ===============================
export async function createFactura(data) {
  const payload = {
    fecha: data.fecha,
    montoTotal: data.montoTotal,
    idEmpleado: data.idEmpleado,
    idMantenimiento: data.idMantenimiento,
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
export async function updateFactura(id, data) {
  const payload = {
    fecha: data.fecha,
    montoTotal: data.montoTotal,
    idEmpleado: data.idEmpleado,
    idMantenimiento: data.idMantenimiento,
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
export async function deleteFactura(id) {
  const json = await fetchJsonOrThrow(`${API_BASE}/eliminar/${id}`, { method: "DELETE" });
  return json?.data ?? json;
}

// ===============================
// HistorialService.js (solo lectura + eliminar)
// ===============================
const API_BASE = "http://localhost:8080/api/historial";

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
  if (json.content) return json;                             // Directo
  if (Array.isArray(json)) return { content: json, totalPages: 1, totalElements: json.length };
  return { content: [], totalPages: 1, totalElements: 0 };
}

// ===============================
// LISTAR HISTORIAL (paginado)
// ===============================
export async function getHistorial(page = 0, size = 10) {
  const s = Math.min(size, 100);
  const url = `${API_BASE}/consultar?page=${page}&size=${s}`;
  const json = await fetchJsonOrThrow(url);
  return normalizeResponse(json);
}

// ===============================
// ELIMINAR HISTORIAL
// ===============================
export async function deleteHistorial(id) {
  const json = await fetchJsonOrThrow(`${API_BASE}/eliminar/${id}`, { method: "DELETE" });
  return json?.data ?? json;
}
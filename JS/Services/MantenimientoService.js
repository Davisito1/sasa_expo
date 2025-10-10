// ===============================
// MantenimientosService.js (FINAL ✅ Heroku + Token + Local + Vercel)
// ===============================

import { getToken } from "../Services/LoginService.js"; // 🔥 importa el token

// 🔥 Detección universal del entorno
const isProd =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("vercel.app") ||
   window.location.hostname === "127.0.0.1" ||
   window.location.hostname === "0.0.0.0");

// ===============================
// Base dinámica según entorno
// ===============================
const API_BASE = isProd
  ? "https://sasaapi-73d5de493985.herokuapp.com/apiMantenimiento" // Heroku
  : "http://localhost:8080/apiMantenimiento";                     // Local

// -------- Utilidad base para fetch --------
async function fetchJsonOrThrow(url, options = {}) {
  const token = getToken(); // 👈 agrega el token JWT al header
  const headers = {
    ...(options.headers || {}),
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });

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

// ===============================
// LISTAR TODOS (para combos sin paginación)
// ===============================
export async function listarMantenimientosCombo() {
  const json = await fetchJsonOrThrow(`${API_BASE}/listar`);
  return json?.data || json || [];
}

// ===============================
// OBTENER POR ID
// ===============================
export async function getMantenimientoById(id) {
  const json = await fetchJsonOrThrow(`${API_BASE}/${id}`);
  return json?.data ?? json;
}

// ===============================
// CREAR MANTENIMIENTO
// ===============================
export async function createMantenimiento(data) {
  const payload = {
    descripcion: data.descripcion,
    fechaRealizacion: data.fechaRealizacion,
    codigoMantenimiento: data.codigoMantenimiento,
    idVehiculo: data.idVehiculo,
  };

  const json = await fetchJsonOrThrow(`${API_BASE}/registrar`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return json?.data ?? json;
}

// ===============================
// ACTUALIZAR MANTENIMIENTO
// ===============================
export async function updateMantenimiento(id, data) {
  const payload = {
    descripcion: data.descripcion,
    fechaRealizacion: data.fechaRealizacion,
    codigoMantenimiento: data.codigoMantenimiento,
    idVehiculo: data.idVehiculo,
  };

  const json = await fetchJsonOrThrow(`${API_BASE}/actualizar/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return json?.data ?? json;
}

// ===============================
// ELIMINAR MANTENIMIENTO
// ===============================
export async function deleteMantenimiento(id) {
  const json = await fetchJsonOrThrow(`${API_BASE}/eliminar/${id}`, {
    method: "DELETE",
  });
  return json?.data ?? json;
}

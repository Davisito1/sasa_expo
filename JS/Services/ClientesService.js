// ===============================
// ClienteService.js
// ===============================
import { attachAuthInterceptor } from "../services/loginService.js";

attachAuthInterceptor();

const API_BASE = "http://localhost:8080/apiCliente";

// ===============================
// Helpers
// ===============================
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

function normalizeResponse(json) {
  if (!json) return { content: [], totalPages: 1, totalElements: 0 };
  if (json.data && json.data.content) return json.data;         // pageable
  if (json.content) return json;                                // pageable directo
  if (Array.isArray(json.data))
    return { content: json.data, totalPages: 1, totalElements: json.data.length };
  if (Array.isArray(json))
    return { content: json, totalPages: 1, totalElements: json.length };

  return { content: [], totalPages: 1, totalElements: 0 };
}

// ===============================
// CRUD
// ===============================

// -------- LISTAR CLIENTES --------
export async function getClientes(page = 0, size = 10, query = "", sortDir = "asc") {
  let url = `${API_BASE}/consultar?page=${page}&size=${Math.min(size, 100)}&sortDir=${sortDir}`;
  if (query && query.trim() !== "") url += `&filtro=${encodeURIComponent(query)}`;
  const json = await fetchJsonOrThrow(url);
  return normalizeResponse(json);
}

// -------- OBTENER CLIENTE POR ID --------
export async function getClienteById(id) {
  const json = await fetchJsonOrThrow(`${API_BASE}/${id}`);
  return json?.data ?? json;   // 👈 devuelve directo el objeto cliente
}




// -------- CREAR CLIENTE --------
export async function createCliente(data) {
  const payload = {
    nombre: data.nombre,
    apellido: data.apellido,
    dui: data.dui,
    fechaNacimiento: data.fechaNacimiento,
    genero: data.genero,
    correo: data.correo,
    // ⚠️ contraseñas no se envían desde aquí
  };

  const json = await fetchJsonOrThrow(`${API_BASE}/registrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return json?.data ?? json;
}

// -------- ACTUALIZAR CLIENTE --------
export async function updateCliente(id, data) {
  const payload = {
    nombre: data.nombre,
    apellido: data.apellido,
    dui: data.dui,
    fechaNacimiento: data.fechaNacimiento,
    genero: data.genero,
    correo: data.correo,
  };

  const json = await fetchJsonOrThrow(`${API_BASE}/actualizar/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return json?.data ?? json;
}

// -------- ELIMINAR CLIENTE --------
export async function deleteCliente(id) {
  const json = await fetchJsonOrThrow(`${API_BASE}/eliminar/${id}`, {
    method: "DELETE",
  });
  return json?.data ?? json;
}

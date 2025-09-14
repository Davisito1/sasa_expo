// ===============================
// ClienteService.js
// ===============================


import { attachAuthInterceptor } from "../services/loginService.js";

attachAuthInterceptor();  //esto asegura que todas las peticiones fetch lleven el token

const API_BASE = "http://localhost:8080/apiCliente";

// ===============================
// FUNCIONES AUXILIARES
// ===============================

// Hace la petición a la API, valida errores y parsea a JSON
async function fetchJsonOrThrow(url, options = {}) {
  const res = await fetch(url, options); // 👈 el token ya se agrega por attachAuthInterceptor
  const text = await res.text();

  if (!res.ok) throw new Error(`${res.status} ${res.statusText} -> ${url}\n${text}`);

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

// Normalización de respuesta estándar para pageable o arrays simples
function normalizeResponse(json) {
  if (!json) return { content: [], totalPages: 1, totalElements: 0 };
  if (json.data && json.data.content) return json.data;   // Spring pageable (data.content)
  if (json.content) return json;                          // pageable directo (content)
  if (Array.isArray(json.data)) 
    return { content: json.data, totalPages: 1, totalElements: json.data.length };

  return { content: [], totalPages: 1, totalElements: 0 };
}

// ===============================
// SERVICIOS CLIENTE (CRUD)
// ===============================

// -------- LISTAR CLIENTES (paginado + búsqueda) --------
export async function getClientes(page = 0, size = 10, query = "") {
  const s = Math.min(size, 100); // límite máximo de registros
  let url = `${API_BASE}/consultar?page=${page}&size=${s}`;
  if (query && query.trim() !== "") url += `&q=${encodeURIComponent(query)}`;
  const json = await fetchJsonOrThrow(url);
  return normalizeResponse(json);
}

// -------- OBTENER CLIENTE POR ID --------
export async function getClienteById(id) {
  const json = await fetchJsonOrThrow(`${API_BASE}/${id}`);
  return json?.data ?? json;
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
  };

  const json = await fetchJsonOrThrow(`${API_BASE}/registrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
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
    body: JSON.stringify(payload)
  });

  return json?.data ?? json;
}

// -------- ELIMINAR CLIENTE --------
export async function deleteCliente(id) {
  const json = await fetchJsonOrThrow(`${API_BASE}/eliminar/${id}`, { method: "DELETE" });
  return json?.data ?? json;
}

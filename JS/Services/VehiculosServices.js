// VehiculosServices.js
// ===============================================
// Servicio con soporte de autenticación (cookie JWT o header Bearer),
// manejo de 401, timeout y base URL por ENV.
// ===============================================

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_VEHICULO) ||
  (typeof process !== "undefined" && process.env && process.env.API_VEHICULO) ||
  "http://localhost:8080/apiVehiculo";

// ------- Utilidades de auth -------
const TOKEN_KEYS = ["authToken", "token", "jwt"];

export function getAuthToken() {
  for (const k of TOKEN_KEYS) {
    const t = localStorage.getItem(k) || sessionStorage.getItem(k);
    if (t) return t;
  }
  return null;
}

export function setAuthToken(token, { persist = true } = {}) {
  // Por si quieres guardar al iniciar sesión
  const store = persist ? localStorage : sessionStorage;
  store.setItem("authToken", token);
}

export function clearAuth() {
  TOKEN_KEYS.forEach((k) => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
}

// ------- Error específico para 401 -------
export class UnauthorizedError extends Error {
  constructor(message = "No autorizado (401)") {
    super(message);
    this.name = "UnauthorizedError";
    this.status = 401;
  }
}

// -------- fetch con JSON + timeout + auth --------
async function fetchJsonOrThrow(url, options = {}, { timeoutMs = 15000 } = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");

  // Si tienes token, lo envías por header
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    credentials: "include", // importante si usas JWT por cookie
    ...options,
    headers,
    signal: controller.signal,
  }).catch((err) => {
    clearTimeout(id);
    throw err;
  });

  clearTimeout(id);

  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (res.status === 401) {
    // Deja listo para que tu UI capture y redirija al login
    throw new UnauthorizedError(typeof body === "string" ? body : (body?.message || "No autorizado"));
  }

  if (!res.ok) {
    const msg = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(`${res.status} ${res.statusText} -> ${url}\n${msg}`);
  }

  return body;
}

// -------- Normalización de páginas --------
function normalizePage(json) {
  if (!json) return { content: [], totalPages: 0, totalElements: 0 };
  if (json.data && json.data.content) return json.data;   // {status, data: Page}
  if (json.content) return json;                          // Page directo
  if (Array.isArray(json?.data)) return { content: json.data, totalPages: 1, totalElements: json.data.length };
  if (Array.isArray(json)) return { content: json, totalPages: 1, totalElements: json.length };
  return { content: [], totalPages: 0, totalElements: 0 };
}

// =============== READ (paginado + orden) ===============
export async function getVehiculos(page = 0, size = 10, sortBy = "idVehiculo", sortDir = "asc") {
  const url = `${API_BASE}/consultar?page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}&sortBy=${encodeURIComponent(sortBy)}&sortDir=${encodeURIComponent(sortDir)}`;
  const json = await fetchJsonOrThrow(url);
  return normalizePage(json);
}

// =============== CREATE ===============
export async function createVehiculo(data) {
  // Asegura únicamente los campos que backend espera
  const payload = {
    ...data,
    idCliente: data.idCliente,
    idEstado: data.idEstado,
  };

  const json = await fetchJsonOrThrow(`${API_BASE}/registrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return json?.data ?? json;
}

// =============== UPDATE ===============
export async function updateVehiculo(id, data) {
  const payload = {
    ...data,
    idCliente: data.idCliente,
    idEstado: data.idEstado,
  };

  const json = await fetchJsonOrThrow(`${API_BASE}/actualizar/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return json?.data ?? json;
}

// =============== DELETE ===============
export async function deleteVehiculo(id) {
  const json = await fetchJsonOrThrow(`${API_BASE}/eliminar/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return json?.data ?? json;
}

// =============== BÚSQUEDA (opcional) ===============
// Si luego agregas endpoint /buscar?term=...
export async function searchVehiculos(term = "", page = 0, size = 10) {
  const url = `${API_BASE}/buscar?term=${encodeURIComponent(term)}&page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}`;
  const json = await fetchJsonOrThrow(url);
  return normalizePage(json);
}

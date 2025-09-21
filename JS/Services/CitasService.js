// ===============================
// CitasService.js
// ===============================
const API_BASE = "http://localhost:8080/apiCitas";

// -------------------------------
// Utilidad fetch con manejo de errores
// -------------------------------
async function fetchJsonOrThrow(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options
  });

  if (!res.ok) {
    let msg = `Error ${res.status} -> ${url}`;
    try {
      const errorData = await res.json();
      msg += "\n" + JSON.stringify(errorData);
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

// -------------------------------
// Obtener citas (paginado)
// -------------------------------
export async function getCitasPaginado(page = 0, size = 10) {
  const url = `${API_BASE}/consultar?page=${page}&size=${size}`;
  const json = await fetchJsonOrThrow(url);
  // puede venir en distintas formas, lo normalizamos
  return json.data ?? json.content ?? json;
}

// -------------------------------
// Obtener cita por ID
// -------------------------------
export async function getCitaById(id) {
  const url = `${API_BASE}/${id}`;
  const json = await fetchJsonOrThrow(url);
  return json.data ?? json;
}

// -------------------------------
// Crear cita
// -------------------------------
export async function createCita(data) {
  const url = `${API_BASE}/registrar`;
  const json = await fetchJsonOrThrow(url, {
    method: "POST",
    body: JSON.stringify(data)
  });
  return json.data ?? json;
}

// -------------------------------
// Actualizar cita
// -------------------------------
export async function updateCita(id, data) {
  const url = `${API_BASE}/actualizar/${id}`;
  const json = await fetchJsonOrThrow(url, {
    method: "PUT",
    body: JSON.stringify(data)
  });
  return json.data ?? json;
}

// -------------------------------
// Eliminar cita
// -------------------------------
export async function deleteCita(id) {
  const url = `${API_BASE}/eliminar/${id}`;
  const json = await fetchJsonOrThrow(url, { method: "DELETE" });
  return json.data ?? json;
}

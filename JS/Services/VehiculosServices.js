// VehiculosServices.js
const API_BASE = "http://localhost:8080/apiVehiculo";

async function fetchJsonOrThrow(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text(); // lee texto SIEMPRE para poder mostrar el error real
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} -> ${url}\n${text}`);
  }
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

function normalizeList(json) {
  if (Array.isArray(json)) return json;
  if (json?.data?.content) return json.data.content;      // {status, data: Page}
  if (json?.content) return json.content;                  // Page directo
  if (json?.data && Array.isArray(json.data)) return json.data; // {status, data:[...]}
  return [];
}

// =============== READ ===============
export async function getVehiculos(page = 0, size = 50) {
  // tu backend expone /consultar (paginado)
  const json = await fetchJsonOrThrow(`${API_BASE}/consultar?page=${page}&size=${size}`);
  return normalizeList(json);
}

// =============== CREATE ===============
export async function createVehiculo(data) {
  // intenta primero payload plano (idCliente, idEstado)
  const bodyPlano = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };

  // si el backend espera objetos anidados:
  const dataAnidado = {
    ...data,
    cliente: data.idCliente ? { idCliente: data.idCliente } : undefined,
    estado:  data.idEstado  ? { idEstado:  data.idEstado  } : undefined,
  };
  delete dataAnidado.idCliente;
  delete dataAnidado.idEstado;

  const bodyAnidado = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dataAnidado),
  };

  // probar /registrar y /crear
  try {
    const j = await fetchJsonOrThrow(`${API_BASE}/registrar`, bodyPlano);
    return j?.data ?? j;
  } catch (e1) {
    try {
      const j2 = await fetchJsonOrThrow(`${API_BASE}/registrar`, bodyAnidado);
      return j2?.data ?? j2;
    } catch (e2) {
      try {
        const j3 = await fetchJsonOrThrow(`${API_BASE}/crear`, bodyPlano);
        return j3?.data ?? j3;
      } catch (e3) {
        const j4 = await fetchJsonOrThrow(`${API_BASE}/crear`, bodyAnidado);
        return j4?.data ?? j4;
      }
    }
  }
}

// =============== UPDATE ===============
export async function updateVehiculo(id, data) {
  // SOLO usamos /actualizar/{id} (tu backend lo tiene).
  // Igual que en create: intentamos plano y luego anidado para compatibilidad.
  const bodyPlano = {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };

  const dataAnidado = {
    ...data,
    cliente: data.idCliente ? { idCliente: data.idCliente } : undefined,
    estado:  data.idEstado  ? { idEstado:  data.idEstado  } : undefined,
  };
  delete dataAnidado.idCliente;
  delete dataAnidado.idEstado;

  const bodyAnidado = {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dataAnidado),
  };

  try {
    const j = await fetchJsonOrThrow(`${API_BASE}/actualizar/${id}`, bodyPlano);
    return j?.data ?? j;
  } catch (e1) {
    // si fue 400 por formato, intentamos anidado
    const j2 = await fetchJsonOrThrow(`${API_BASE}/actualizar/${id}`, bodyAnidado);
    return j2?.data ?? j2;
  }
}

// =============== DELETE ===============
export async function deleteVehiculo(id) {
  const j = await fetchJsonOrThrow(`${API_BASE}/eliminar/${id}`, { method: "DELETE" });
  return j?.data ?? j;
}

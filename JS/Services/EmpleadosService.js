// ===============================
// EmpleadosService.js
// ===============================

// URL base de la API de empleados
const API_BASE = "http://localhost:8080/apiEmpleados";

// ===============================
// FUNCIONES AUXILIARES
// ===============================

// -------- Utilidad base para fetch --------
// Hace fetch, valida errores y devuelve JSON o texto
async function fetchJsonOrThrow(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();

  // Si hubo error en la respuesta, lanza excepción con detalles
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} -> ${url}\n${text}`);

  // Intenta parsear JSON, si no puede devuelve texto plano
  try { 
    return text ? JSON.parse(text) : null; 
  } catch { 
    return text; 
  }
}

// ===============================
// SERVICIOS EMPLEADOS (CRUD)
// ===============================

// -------- LISTAR EMPLEADOS (paginado + búsqueda) --------
// `page` = número de página, `size` = tamaño de página, `q` = filtro de búsqueda
export async function getEmpleados(page = 0, size = 10, q = "") {
  const s = Math.min(size, 50); // límite máximo de 50 registros por página
  const query = q ? `&q=${encodeURIComponent(q)}` : "";
  const json = await fetchJsonOrThrow(`${API_BASE}/consultar?page=${page}&size=${s}${query}`);
  return json?.data ?? json;   // backend devuelve {status, data}
}

// -------- CREAR EMPLEADO --------
export async function createEmpleado(data) {
  const payload = {
    nombres: data.nombres,
    apellidos: data.apellidos,
    cargo: data.cargo,
    dui: data.dui,
    telefono: data.telefono,
    direccion: data.direccion,
    fechaContratacion: data.fechaContratacion,
    correo: data.correo,
    idUsuario: data.idUsuario
  };

  const res = await fetchJsonOrThrow(`${API_BASE}/registrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return res?.data ?? res;
}

// -------- ACTUALIZAR EMPLEADO --------
export async function updateEmpleado(id, data) {
  const payload = {
    nombres: data.nombres,
    apellidos: data.apellidos,
    cargo: data.cargo,
    dui: data.dui,
    telefono: data.telefono,
    direccion: data.direccion,
    fechaContratacion: data.fechaContratacion,
    correo: data.correo,
    idUsuario: data.idUsuario
  };

  const res = await fetchJsonOrThrow(`${API_BASE}/actualizar/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return res?.data ?? res;
}

// -------- ELIMINAR EMPLEADO --------
export async function deleteEmpleado(id) {
  const res = await fetchJsonOrThrow(`${API_BASE}/eliminar/${id}`, { method: "DELETE" });
  return res?.data ?? res;
}

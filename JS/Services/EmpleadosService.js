// ===============================
// EmpleadosService.js
// ===============================

// 🔥 URL actualizada para Heroku
const API_BASE = "https://sasaapi-73d5de493985.herokuapp.com/apiEmpleados";

// Importar el interceptor que agrega automáticamente el token JWT
import { attachAuthInterceptor } from "../services/loginService.js";
attachAuthInterceptor();

// ===============================
// Función fetch con manejo de errores
// ===============================
async function fetchJsonOrThrow(url, options = {}) {
  const res = await fetch(url, options); // 👈 el token lo agrega el interceptor
  const text = await res.text();

  if (!res.ok) throw new Error(`${res.status} ${res.statusText} -> ${url}\n${text}`);

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

// ===============================
// SERVICIOS EMPLEADOS (CRUD)
// ===============================

// -------- LISTAR EMPLEADOS --------
export async function getEmpleados(page = 0, size = 10, q = "") {
  const s = Math.min(size, 50); // máximo 50 registros por página
  const query = q ? `&q=${encodeURIComponent(q)}` : "";
  const json = await fetchJsonOrThrow(`${API_BASE}/consultar?page=${page}&size=${s}${query}`);
  return json?.data ?? json;
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

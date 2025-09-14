const API_URL = "http://localhost:8080/apiPagos";
import { attachAuthInterceptor } from "../services/loginService.js";
attachAuthInterceptor();


async function fetchJsonOrThrow(url, options = {}) {
  const res = await fetch(url, options);

  if (!res.ok) {
    let errorData = {};
    try {
      errorData = await res.json();
    } catch {}
    throw new Error(`${res.status} -> ${url}\n${JSON.stringify(errorData)}`);
  }

  return res.json();
}

// ===============================
// SERVICIOS PAGOS (CRUD)
// ===============================

// Listar pagos
export async function getPagos() {
  const res = await fetchJsonOrThrow(`${API_URL}/consultar`);
  return res.data ?? res;
}

// Crear pago
export async function createPago(dto) {
  return fetchJsonOrThrow(`${API_URL}/registrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

// Actualizar pago
export async function updatePago(id, dto) {
  return fetchJsonOrThrow(`${API_URL}/actualizar/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

// Eliminar pago
export async function deletePago(id) {
  return fetchJsonOrThrow(`${API_URL}/eliminar/${id}`, {
    method: "DELETE",
  });
}

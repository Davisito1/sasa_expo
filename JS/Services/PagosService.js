// ===============================
// PagosService.js
// ===============================

// URL base de la API de pagos
const API_URL = "http://localhost:8080/apiPagos";

// ===============================
// FUNCIONES AUXILIARES
// ===============================

// -------- fetchJsonOrThrow --------
// Llama al endpoint, valida errores y devuelve JSON
async function fetchJsonOrThrow(url, options = {}) {
  const res = await fetch(url, options);

  // Si no es OK, intenta parsear error y lo lanza
  if (!res.ok) {
    let errorData = {};
    try {
      errorData = await res.json();
    } catch {}
    throw new Error(`${res.status} -> ${url}\n${JSON.stringify(errorData)}`);
  }

  // Si es correcto, devuelve JSON parseado
  return res.json();
}

// ===============================
// SERVICIOS PAGOS (CRUD)
// ===============================

// -------- LISTAR PAGOS --------
// Devuelve todos los pagos disponibles
export async function getPagos() {
  const res = await fetchJsonOrThrow(`${API_URL}/consultar`);
  return res.data ?? res; // algunos backends envían dentro de {status, data}
}

// -------- CREAR PAGO --------
// Recibe un DTO con fecha, monto, idFactura, idMetodoPago
export async function createPago(dto) {
  return fetchJsonOrThrow(`${API_URL}/registrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

// -------- ACTUALIZAR PAGO --------
// Actualiza un pago existente por id
export async function updatePago(id, dto) {
  return fetchJsonOrThrow(`${API_URL}/actualizar/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

// -------- ELIMINAR PAGO --------
// Elimina un pago por id
export async function deletePago(id) {
  return fetchJsonOrThrow(`${API_URL}/eliminar/${id}`, {
    method: "DELETE",
  });
}

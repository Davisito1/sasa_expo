// ===============================
// DetalleOrdenService.js ✅ Corregido
// ===============================

const API_BASE = "http://localhost:8080";
const BASE = `${API_BASE}/apiDetalleOrden`;

async function http(url, { method = "GET", headers = {}, body, credentials } = {}) {
  const isForm = body instanceof FormData;
  const baseHeaders = isForm ? {} : { "Content-Type": "application/json" };

  const token = localStorage.getItem("authToken");
  const auth = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(url, {
    method,
    headers: { ...baseHeaders, ...auth, ...headers },
    body,
    credentials,
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} -> ${url}\n${text}`);

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

function normalizeResponse(json) {
  if (json?.data) return json.data;
  if (json?.content) return json.content;
  if (Array.isArray(json)) return json;
  return json ? [json] : [];
}

// Crear detalle
export async function agregarDetalle({ idOrden, idMantenimiento, cantidad, precioUnitario, subtotal }) {
  if (!idOrden) throw new Error("Debe seleccionar una orden válida.");
  if (!idMantenimiento) throw new Error("Debe seleccionar un mantenimiento válido.");
  if (!cantidad || cantidad <= 0) throw new Error("La cantidad debe ser mayor a 0.");
  if (!precioUnitario || precioUnitario <= 0) throw new Error("El precio unitario debe ser mayor a 0.");

  const sub = subtotal ?? cantidad * precioUnitario;

  return http(`${BASE}/registrar`, {
    method: "POST",
    body: JSON.stringify({ idOrden, idMantenimiento, cantidad, precioUnitario, subtotal: sub }),
  });
}

// Eliminar detalle
export async function eliminarDetalle(idDetalle) {
  if (!idDetalle) throw new Error("Debe proporcionar un ID de detalle válido.");
  return http(`${BASE}/eliminar/${encodeURIComponent(idDetalle)}`, { method: "DELETE" });
}

// Listar detalles por orden
export async function getDetallesByOrden(idOrden) {
  if (!idOrden) throw new Error("Debe proporcionar un ID de orden válido.");
  // ✅ Corrige aquí según el backend
  // Si tu controller tiene @GetMapping("/porOrden/{idOrden}") → usa /porOrden
  // Si lo tienes como @GetMapping("/consultar/{idOrden}") → cambia aquí:
  const json = await http(`${BASE}/porOrden/${encodeURIComponent(idOrden)}`);
  return normalizeResponse(json);
}

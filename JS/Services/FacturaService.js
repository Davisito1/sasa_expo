const API_BASE = "http://localhost:8080"; // AJUSTA AQUÍ
const FACT = `${API_BASE}/apiFactura`;
const EMP  = `${API_BASE}/apiEmpleados`;
const MP   = `${API_BASE}/api/metodoPago`;

async function http(url, { method = "GET", headers = {}, body, credentials } = {}) {
  const isForm = body instanceof FormData;
  const baseHeaders = isForm ? {} : { "Content-Type": "application/json" };
  const token = localStorage.getItem("authToken");
  const auth = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(url, { method, headers: { ...baseHeaders, ...auth, ...headers }, body, credentials });
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${await res.text()}`);
  return res;
}

export async function obtenerFacturaPorOrden(idOrden) {
  const r = await http(`${FACT}/por-orden/${encodeURIComponent(idOrden)}`);
  return r.json();
}

// payload: { idFactura?, idOrden, fecha, montoTotal, idEmpleado, idMetodoPago, estado, descripcion }
export async function crearActualizarFactura(payload) {
  const method = payload.idFactura ? "PUT" : "POST";
  const path = payload.idFactura ? `/actualizar/${encodeURIComponent(payload.idFactura)}` : "/crear";
  const r = await http(`${FACT}${path}`, { method, body: JSON.stringify(payload) });
  return r.json();
}
export async function anularFactura(idFactura) {
  const r = await http(`${FACT}/anular/${encodeURIComponent(idFactura)}`, { method: "PUT" });
  return r.json();
}
export async function listarEmpleados() {
  const r = await http(`${EMP}/consultar`);
  return r.json();
}
export async function listarMetodosPago() {
  const r = await http(`${MP}/consultar`);
  return r.json();
}

const API_BASE = "http://localhost:8080"; // AJUSTA AQUÍ
const BASE = `${API_BASE}/apiDetalleOrden`;

async function http(url, { method = "GET", headers = {}, body, credentials } = {}) {
  const isForm = body instanceof FormData;
  const baseHeaders = isForm ? {} : { "Content-Type": "application/json" };
  const token = localStorage.getItem("authToken");
  const auth = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(url, { method, headers: { ...baseHeaders, ...auth, ...headers }, body, credentials });
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${await res.text()}`);
  return res;
}

export async function agregarDetalle({ idOrden, idMantenimiento, precio }) {
  const r = await http(`${BASE}/crear`, { method: "POST", body: JSON.stringify({ idOrden, idMantenimiento, precio }) });
  return r.json();
}
export async function eliminarDetalle(idDetalle) {
  const r = await http(`${BASE}/eliminar/${encodeURIComponent(idDetalle)}`, { method: "DELETE" });
  return r.json();
}
export async function listarDetalles(idOrden) {
  const r = await http(`${BASE}/por-orden/${encodeURIComponent(idOrden)}`);
  return r.json();
}

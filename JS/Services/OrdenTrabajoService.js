const API_BASE = "http://localhost:8080"; // AJUSTA AQUÍ
const BASE = `${API_BASE}/apiOrdenTrabajo`;

async function http(url, { method = "GET", headers = {}, body, credentials } = {}) {
  const isForm = body instanceof FormData;
  const baseHeaders = isForm ? {} : { "Content-Type": "application/json" };
  const token = localStorage.getItem("authToken");
  const auth = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(url, { method, headers: { ...baseHeaders, ...auth, ...headers }, body, credentials });
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${await res.text()}`);
  return res;
}

export async function crearOrden({ idVehiculo, fecha }) {
  const r = await http(`${BASE}/crear`, { method: "POST", body: JSON.stringify({ idVehiculo, fecha }) });
  return r.json();
}
export async function actualizarOrden(idOrden, { idVehiculo, fecha }) {
  const r = await http(`${BASE}/actualizar/${encodeURIComponent(idOrden)}`, { method: "PUT", body: JSON.stringify({ idVehiculo, fecha }) });
  return r.json();
}
export async function obtenerOrden(idOrden) {
  const r = await http(`${BASE}/${encodeURIComponent(idOrden)}`);
  return r.json();
}
export async function listarOrdenes({ page = 0, size = 10, filtro = "" } = {}) {
  const q = new URLSearchParams({ page, size, filtro });
  const r = await http(`${BASE}/consultar?${q.toString()}`);
  return r.json();
}

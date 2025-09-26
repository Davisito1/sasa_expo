const API_BASE = "http://localhost:8080"; // AJUSTA AQUÍ
const BASE = `${API_BASE}/apiMantenimiento`;

async function http(url, { method = "GET", headers = {}, body, credentials } = {}) {
  const isForm = body instanceof FormData;
  const baseHeaders = isForm ? {} : { "Content-Type": "application/json" };
  const token = localStorage.getItem("authToken");
  const auth = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(url, { method, headers: { ...baseHeaders, ...auth, ...headers }, body, credentials });
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${await res.text()}`);
  return res;
}

export async function listarMantenimientos() {
  const r = await http(`${BASE}/consultar`);
  return r.json();
}

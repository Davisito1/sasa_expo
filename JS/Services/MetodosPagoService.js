// ===============================
// MetodosPagoService.js
// ===============================
const API_BASE = "http://localhost:8080/api/metodoPago";

async function fetchJsonOrThrow(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} -> ${url}\n${text}`);
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

export async function getMetodosPago() {
  const json = await fetchJsonOrThrow(`${API_BASE}/listar`);
  return json?.data ?? [];
}

// ===============================
// MetodosPagoService.js ✅ FINAL (Heroku + Local + Vercel)
// ===============================

// 🌍 Detectar entorno automáticamente
const isProd =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("vercel.app") ||
   window.location.hostname === "127.0.0.1" ||
   window.location.hostname === "0.0.0.0");

// 🔹 Base dinámica según entorno
const API_BASE = isProd
  ? "https://sasaapi-73d5de493985.herokuapp.com/api/metodoPago" // 🔥 Heroku backend
  : "http://localhost:8080/api/metodoPago";                     // local dev

// -------------------------------
// Fetch con manejo de errores
// -------------------------------
async function fetchJsonOrThrow(url, options = {}) {
  const token = localStorage.getItem("authToken");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(url, { credentials: "include", ...options, headers });
  const text = await res.text();

  if (!res.ok) {
    try {
      return Promise.reject(JSON.parse(text));
    } catch {
      throw new Error(`${res.status} ${res.statusText} -> ${url}\n${text}`);
    }
  }

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

// -------------------------------
// Obtener métodos de pago
// -------------------------------
export async function getMetodosPago() {
  const json = await fetchJsonOrThrow(`${API_BASE}/listar`);
  return json?.data || json || [];
}

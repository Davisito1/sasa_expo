// ===============================
// DetalleOrdenService.js ✅ FINAL (Solo Heroku + JWT + Seguridad 401)
// ===============================

// 🔹 URL fija a Heroku
const API_BASE = "https://sasaapi-73d5de493985.herokuapp.com";
const BASE = `${API_BASE}/apiDetalleOrden`;

// ===============================
// Helper universal de fetch con JWT y control de sesión
// ===============================
async function http(url, { method = "GET", headers = {}, body } = {}) {
  const isForm = body instanceof FormData;
  const baseHeaders = isForm ? {} : { "Content-Type": "application/json" };

  const token = localStorage.getItem("authToken");
  const auth = token ? { Authorization: `Bearer ${token}` } : {};

  try {
    const res = await fetch(url, {
      method,
      headers: { ...baseHeaders, ...auth, ...headers },
      body,
      credentials: "include",
    });

    // 🔒 Manejo de sesión expirada
    if (res.status === 401) {
      localStorage.clear();
      Swal.fire({
        icon: "warning",
        title: "Sesión expirada",
        text: "Por favor inicia sesión nuevamente.",
        confirmButtonColor: "#C91A1A",
      }).then(() => (window.location.href = "../Autenticacion/login.html"));
      throw new Error("401 Unauthorized");
    }

    const text = await res.text();
    if (!res.ok) {
      console.error(`❌ Error HTTP ${res.status} -> ${url}`);
      console.error("🧾 Respuesta:", text);
      throw new Error(`HTTP ${res.status} -> ${url}\n${text}`);
    }

    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return text;
    }
  } catch (err) {
    console.error("❌ Error de conexión o servidor:", err);
    Swal.fire({
      icon: "error",
      title: "Error de conexión",
      text: "No se pudo conectar con el servidor SASA en Heroku.",
      confirmButtonColor: "#C91A1A",
    });
    throw err;
  }
}

// ===============================
// Normalización de respuesta
// ===============================
function normalizeResponse(json) {
  if (!json) return [];
  if (json?.data) return json.data;
  if (json?.content) return json.content;
  if (Array.isArray(json)) return json;
  return [json];
}

// ===============================
// ENDPOINTS
// ===============================

// -------- Crear detalle --------
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

// -------- Eliminar detalle --------
export async function eliminarDetalle(idDetalle) {
  if (!idDetalle) throw new Error("Debe proporcionar un ID de detalle válido.");
  return http(`${BASE}/eliminar/${encodeURIComponent(idDetalle)}`, { method: "DELETE" });
}

// -------- Listar detalles por orden --------
export async function getDetallesByOrden(idOrden) {
  if (!idOrden) throw new Error("Debe proporcionar un ID de orden válido.");
  const json = await http(`${BASE}/porOrden/${encodeURIComponent(idOrden)}`);
  return normalizeResponse(json);
}

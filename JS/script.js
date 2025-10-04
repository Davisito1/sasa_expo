// ===============================
// Dashboard Init.js
// ===============================

// ✅ Verificación de sesión antes de inicializar
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    // No hay sesión → redirigir al login
    window.location.href = "../Autenticacion/login.html";
    return;
  }
  init();
});

async function init() {
  const fechaEl = byId("fechaActual");
  const horaEl  = byId("horaActual");
  const saludoEl = byId("saludo");

  // Fecha/hora/saludo
  tickDateTime(fechaEl, horaEl, saludoEl);
  setInterval(() => tickDateTime(fechaEl, horaEl, saludoEl), 60000);

  // APIs base
  const BASE = "http://localhost:8080";
  const API_VEHICULOS = `${BASE}/apiVehiculo/consultar`;
  const API_CLIENTES  = `${BASE}/apiCliente/consultar?page=0&size=100`;
  const API_CITAS     = `${BASE}/apiCitas/listar`;
  const API_HISTORIAL = `${BASE}/api/historial/consultar?page=0&size=100`;
  const API_ORDENES   = `${BASE}/apiOrdenTrabajo/consultar`;

  // Cargar totales
  const vehiculos = await totalizar(API_VEHICULOS, "vehiculosTotal");
  const clientes  = await totalizar(API_CLIENTES,  "clientesTotal");
  const citas     = await totalizar(API_CITAS,     "citasTotal");
  await totalizar(API_HISTORIAL, "historialTotal");
  await totalizar(API_ORDENES,   "ordenesTotal");

  // Select y gráficas
  hydrateClienteSelect(clientes, vehiculos, citas);
  buildCharts(vehiculos);

  // Animaciones
  revealOnScroll(".card-in,.card-pop", 80);
}

// ===============================
// Utilidades DOM
// ===============================
function byId(id){ return document.getElementById(id) }

// ===============================
// Fecha, hora y saludo
// ===============================
function tickDateTime(fechaEl, horaEl, saludoEl) {
  const f = new Date();
  if (fechaEl) fechaEl.textContent = f.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  if (horaEl)  horaEl.textContent  = f.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  if (saludoEl) {
    const h = f.getHours();
    saludoEl.innerHTML = `${h < 12 ? "Buenos días" : (h < 18 ? "Buenas tardes" : "Buenas noches")}`;
  }
}

// ===============================
// Fetch con token y timeout
// ===============================
function fetchWithTimeout(resource, options = {}) {
  const { timeout = 8000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const token = localStorage.getItem("authToken"); // 👈 coherente con LoginService

  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(resource, {
    ...options,
    headers,
    credentials: "include",
    signal: controller.signal,
  })
    .finally(() => clearTimeout(id))
    .then(res => {
      if (res.status === 401) {
        localStorage.clear();
        Swal.fire("Sesión expirada", "Por favor inicia sesión de nuevo", "warning")
          .then(() => window.location.href = "../Autenticacion/login.html");
        throw new Error("401 Unauthorized");
      }
      return res;
    });
}

// ===============================
// Totalizar registros
// ===============================
async function totalizar(url, idContador, retries=1) {
  const el = byId(idContador);
  try {
    const res = await fetchWithTimeout(url, { timeout: 9000 });
    if (!res.ok) {
      if (retries > 0) return totalizar(url, idContador, retries-1);
      if (el) el.textContent = "0";
      return [];
    }
    const data = await safeJson(res);
    const registros = normalizeList(data);
    if (el) el.textContent = registros.length;
    return registros;
  } catch {
    if (retries > 0) return totalizar(url, idContador, retries-1);
    if (el) el.textContent = "0";
    return [];
  }
}

// ===============================
// Normalización
// ===============================
function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  if (typeof data?.data?.totalElements === "number") return Array.from({ length: data.data.totalElements });
  return [];
}

function safeJson(res) {
  return res.json().catch(() => ({}));
}

// ===============================
// Select de clientes
// ===============================
function hydrateClienteSelect(clientes, vehiculos, citas) {
  const select = byId("selectCliente");
  if (!select || !Array.isArray(clientes)) return;
  const frag = document.createDocumentFragment();
  clientes.forEach(c => {
    const opt = document.createElement("option");
    const id = c.idCliente ?? c.id;
    const nombre = [c.nombre, c.apellido].filter(Boolean).join(" ").trim() || `ID ${id}`;
    opt.value = id;
    opt.textContent = nombre;
    frag.appendChild(opt);
  });
  select.appendChild(frag);

  select.addEventListener("change", () => {
    const idCliente = parseInt(select.value, 10);
    if (!idCliente) return;
    const cliente = clientes.find(c => (c.idCliente || c.id) === idCliente);
    const vehiculosCliente = vehiculos.filter(v => (v.idCliente || v.cliente?.idCliente) === idCliente);
    const citasCliente = citas.filter(c => c.idCliente === idCliente);
    const html = `
      <div style="text-align:left">
        <p><strong>Vehículos:</strong> ${vehiculosCliente.length}</p>
        <ul>${vehiculosCliente.map(v => `<li>${v.marca||""} ${v.modelo||""} (${v.placa || "sin placa"})</li>`).join("") || "<li>Ninguno</li>"}</ul>
        <p><strong>Citas:</strong> ${citasCliente.length}</p>
        <ul>${citasCliente.map(c => `<li>${c.fecha || ""} - ${(c.descripcion || "sin descripción")}</li>`).join("") || "<li>Ninguna</li>"}</ul>
      </div>
    `;
    Swal.fire({ title: `${(cliente?.nombre||"")} ${(cliente?.apellido||"")}`.trim(), html, icon:"info", confirmButtonColor:"#C91A1A", width:600 });
  });
}

// ===============================
// Graficas (Chart.js)
// ===============================
function buildCharts(vehiculos) {
  // ... (igual que tenías, sin cambios)
}

// ===============================
// Plugin sombra gráficas
// ===============================
function shadowPlugin() {
  return {
    id:"shadow",
    beforeDraw(c) {
      const ctx = c.ctx;
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,.18)";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 6;
    },
    afterDraw(c) { c.ctx.restore(); }
  };
}

// ===============================
// Ver citas de hoy
// ===============================
window.verCitasHoy = async () => {
  const BASE = "http://localhost:8080";
  const API_CITAS = `${BASE}/apiCitas/listar`;
  try {
    const res = await fetchWithTimeout(API_CITAS, { timeout: 9000 });
    if (!res.ok) throw new Error();
    const response = await safeJson(res);
    const data = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
    const hoy = new Date().toISOString().split("T")[0];
    const citasHoy = data.filter(c => c.fecha === hoy);
    if (citasHoy.length) {
      const html = citasHoy.map(c => `<p><strong>Hora:</strong> ${c.hora || ""} — <strong>Estado:</strong> ${c.estado || ""}</p>`).join("<hr>");
      Swal.fire({ title:"Citas de hoy", html, icon:"info", confirmButtonText:"Cerrar", confirmButtonColor:"#C91A1A" });
    } else {
      Swal.fire({ title:"Sin citas hoy", text:"No hay citas registradas para hoy.", icon:"warning", confirmButtonText:"Ok", confirmButtonColor:"#C91A1A" });
    }
  } catch {
    Swal.fire({ title:"Error", text:"No se pudo cargar la información de citas.", icon:"error", confirmButtonText:"Cerrar", confirmButtonColor:"#C91A1A" });
  }
};

// ===============================
// Animación al hacer scroll
// ===============================
function revealOnScroll(selector, offset=80) {
  const els = document.querySelectorAll(selector);
  els.forEach(el => el.style.opacity = 0);
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = 1;
        e.target.style.transform = "none";
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: `0px 0px -${offset}px 0px`, threshold: .15 });
  els.forEach(el => io.observe(el));
}

// ===============================
// Logout
// ===============================
window.logout = () => {
  localStorage.clear();
  Swal.fire({
    icon: "info",
    title: "Sesión cerrada",
    text: "Has cerrado sesión correctamente",
    timer: 1500,
    showConfirmButton: false
  }).then(() => {
    window.location.href = "../Autenticacion/login.html";
  });
};

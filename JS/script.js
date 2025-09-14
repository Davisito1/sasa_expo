// dashboard.js  ✅ FINAL
// Asegúrate de que este script se cargue con: <script type="module" src="../dashboard/dashboard.js"></script>

// IMPORTA DESDE TU CARPETA JS (ajusta si es distinto)
import { attachAuthInterceptor, isLoggedIn, checkAuth } from "../js/Services/LoginService.js";

// Activa el interceptor ANTES de cualquier fetch
attachAuthInterceptor({ onUnauthorizedRedirect: "../Autenticacion/login.html" });

document.addEventListener("DOMContentLoaded", init);

async function init() {
  // ====== Guardia de sesión ======
  if (!isLoggedIn()) {
    window.location.href = "../Autenticacion/login.html";
    return;
  }
  const chk = await checkAuth();
  if (chk.status !== "success") {
    await Swal.fire("Sesión expirada", "Por favor inicia sesión nuevamente.", "warning");
    window.location.href = "../Autenticacion/login.html";
    return;
  }

  // ====== ENDPOINTS (usa los que realmente tengas) ======
  const BASE = "http://localhost:8080";
  const API_VEHICULOS = `${BASE}/apiVehiculo/consultar`;
  const API_CLIENTES  = `${BASE}/apiCliente/consultar?page=0&size=100`;
  const API_CITAS     = `${BASE}/apiCitas/listar`;
  const API_HISTORIAL = `${BASE}/api/historial/consultar?page=0&size=100`;
  const API_PAGOS     = `${BASE}/apiPagos/consultar`;

  // ====== FECHA, HORA Y SALUDO ======
  const fechaEl = document.getElementById("fechaActual");
  const horaEl  = document.getElementById("horaActual");
  const saludoEl = document.getElementById("saludo"); // ← usa este id en tu HTML

  function actualizarFechaHora() {
    const f = new Date();
    if (fechaEl) fechaEl.textContent = f.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    if (horaEl)  horaEl.textContent  = f.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  }
  function actualizarSaludo() {
    const h = new Date().getHours();
    const texto = h < 12 ? "Buenos días" : (h < 18 ? "Buenas tardes" : "Buenas noches");
    if (saludoEl) saludoEl.textContent = texto;
  }
  actualizarFechaHora();
  actualizarSaludo();
  setInterval(() => { actualizarFechaHora(); actualizarSaludo(); }, 60_000);

  // ====== Helper de carga con conteo ======
  let sessionExpiredShown = false;
  async function totalizar(url, idContador) {
    try {
      const res = await fetch(url); // el interceptor ya mete Authorization y credentials

      if (res.status === 401 && !sessionExpiredShown) {
        sessionExpiredShown = true;
        await Swal.fire("Sesión expirada", "Por favor inicia sesión nuevamente.", "warning");
        window.location.href = "../Autenticacion/login.html";
        return [];
      }
      if (!res.ok) {
        console.warn(`⚠️ ${res.status} en ${url}`);
        const el = document.getElementById(idContador);
        if (el) el.textContent = "0";
        return [];
      }

      const data = await res.json().catch(() => ({}));
      let registros = [];
      if (Array.isArray(data)) registros = data;
      else if (data.content) registros = data.content;
      else if (data.data?.content) registros = data.data.content;
      else if (Array.isArray(data.data)) registros = data.data;
      else if (typeof data.data?.totalElements === "number") {
        registros = Array.from({ length: data.data.totalElements });
      }

      const el = document.getElementById(idContador);
      if (el) el.textContent = registros.length;
      return registros;
    } catch (e) {
      console.error("Error cargando", idContador, e);
      const el = document.getElementById(idContador);
      if (el) el.textContent = "0";
      return [];
    }
  }

  // ====== Cargar datos ======
  const vehiculos = await totalizar(API_VEHICULOS, "vehiculosTotal");
  const clientes  = await totalizar(API_CLIENTES,  "clientesTotal");
  const citas     = await totalizar(API_CITAS,     "citasTotal");
  await totalizar(API_HISTORIAL, "historialTotal");
  const pagos     = await totalizar(API_PAGOS,     "pagosTotal");

  // ====== Gráfica por marca ======
  const marcas = {};
  vehiculos.forEach(v => {
    const m = (v.marca || v.Marca || "Otra").toString().trim();
    marcas[m] = (marcas[m] || 0) + 1;
  });
  if (Object.keys(marcas).length && document.getElementById("graficaVehiculosMarca")) {
    new Chart(document.getElementById("graficaVehiculosMarca"), {
      type: "doughnut",
      data: { labels: Object.keys(marcas), datasets: [{ data: Object.values(marcas), backgroundColor: ["#C91A1A","#e74c3c","#ff7675","#fab1a0","#ffeaa7"] }] },
      options: { responsive: true, maintainAspectRatio: true },
    });
  }

  // ====== Gráfica ingresos dummy ======
  if (document.getElementById("graficaIngresosMensuales")) {
    new Chart(document.getElementById("graficaIngresosMensuales"), {
      type: "line",
      data: {
        labels: ["Ene","Feb","Mar","Abr","May","Jun","Jul"],
        datasets: [{ label:"Ingresos ($)", data:[8500,9200,10500,11000,9600,12300,11500], borderColor:"#C91A1A", backgroundColor:"rgba(201,26,26,0.1)", fill:true, tension:0.3 }]
      },
      options: { responsive: true, maintainAspectRatio: true },
    });
  }

  // ====== Ver citas hoy ======
  window.verCitasHoy = async () => {
    try {
      const res = await fetch(API_CITAS);
      if (res.status === 401 && !sessionExpiredShown) {
        sessionExpiredShown = true;
        await Swal.fire("Sesión expirada", "Debes iniciar sesión nuevamente.", "warning");
        window.location.href = "../Autenticacion/login.html";
        return;
      }
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const response = await res.json();
      const data = response.data || response;
      const hoy = new Date().toISOString().split("T")[0];
      const citasHoy = (Array.isArray(data) ? data : []).filter(c => c.fecha === hoy);
      if (citasHoy.length) {
        const html = citasHoy.map(c => `<p><strong>Hora:</strong> ${c.hora} - <strong>Estado:</strong> ${c.estado}</p>`).join("<hr>");
        Swal.fire({ title:"Citas de hoy", html, icon:"info", confirmButtonText:"Cerrar", confirmButtonColor:"#C91A1A" });
      } else {
        Swal.fire({ title:"Sin citas hoy", text:"No hay citas registradas para hoy.", icon:"warning", confirmButtonText:"Ok", confirmButtonColor:"#C91A1A" });
      }
    } catch (e) {
      console.error(e);
      Swal.fire({ title:"Error", text:"No se pudo cargar la información de citas.", icon:"error", confirmButtonText:"Cerrar", confirmButtonColor:"#C91A1A" });
    }
  };

  // ====== Select de cliente (detalles) ======
  const select = document.getElementById("selectCliente");
  if (select && Array.isArray(clientes)) {
    clientes.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.idCliente || c.id;
      opt.textContent = `${c.nombre} ${c.apellido}`;
      select.appendChild(opt);
    });

    select.addEventListener("change", () => {
      const idCliente = parseInt(select.value, 10);
      if (!idCliente) return;

      const cliente = clientes.find(c => (c.idCliente || c.id) === idCliente);
      const vehiculosCliente = vehiculos.filter(v => (v.idCliente || v.cliente?.idCliente) === idCliente);
      const citasCliente     = citas.filter(c => c.idCliente === idCliente);
      const pagosCliente     = pagos.filter(p => p.idCliente === idCliente);

      const html = `
        <div style="text-align:left">
          <p><strong>Vehículos:</strong> ${vehiculosCliente.length}</p>
          <ul>${vehiculosCliente.map(v => `<li>${v.marca} ${v.modelo} (${v.placa || "sin placa"})</li>`).join("") || "<li>Ninguno</li>"}</ul>

          <p><strong>Citas:</strong> ${citasCliente.length}</p>
          <ul>${citasCliente.map(c => `<li>${c.fecha} - ${c.descripcion || "sin descripción"}</li>`).join("") || "<li>Ninguna</li>"}</ul>

          <p><strong>Pagos:</strong> ${pagosCliente.length}</p>
          <ul>${pagosCliente.map(p => `<li>Monto: $${p.monto} - ${p.fecha}</li>`).join("") || "<li>Ninguno</li>"}</ul>
        </div>
      `;
      Swal.fire({ title: `${cliente?.nombre || ""} ${cliente?.apellido || ""}`, html, icon:"info", confirmButtonColor:"#C91A1A", width:600 });
    });
  }
}

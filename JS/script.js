document.addEventListener("DOMContentLoaded", init);

async function init() {
  const fechaEl = byId("fechaActual");
  const horaEl  = byId("horaActual");
  const saludoEl = byId("saludo");
  tickDateTime(fechaEl, horaEl, saludoEl);
  setInterval(() => tickDateTime(fechaEl, horaEl, saludoEl), 60000);

  const BASE = "http://localhost:8080";
  const API_VEHICULOS = `${BASE}/apiVehiculo/consultar`;
  const API_CLIENTES  = `${BASE}/apiCliente/consultar?page=0&size=100`;
  const API_CITAS     = `${BASE}/apiCitas/listar`;
  const API_HISTORIAL = `${BASE}/api/historial/consultar?page=0&size=100`;
  const API_ORDENES   = `${BASE}/apiOrdenTrabajo/consultar`;

  const vehiculos = await totalizar(API_VEHICULOS, "vehiculosTotal");
  const clientes  = await totalizar(API_CLIENTES,  "clientesTotal");
  const citas     = await totalizar(API_CITAS,     "citasTotal");
  await totalizar(API_HISTORIAL, "historialTotal");
  await totalizar(API_ORDENES,   "ordenesTotal");

  hydrateClienteSelect(clientes, vehiculos, citas);

  buildCharts(vehiculos);

  revealOnScroll(".card-in,.card-pop", 80);
}

function byId(id){ return document.getElementById(id) }

function tickDateTime(fechaEl, horaEl, saludoEl) {
  const f = new Date();
  if (fechaEl) fechaEl.textContent = f.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  if (horaEl)  horaEl.textContent  = f.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  if (saludoEl) {
    const h = f.getHours();
    saludoEl.innerHTML = `${h < 12 ? "Buenos días" : (h < 18 ? "Buenas tardes" : "Buenas noches")}`;
  }
}

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

function fetchWithTimeout(resource, options={}) {
  const { timeout = 8000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(resource, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

function hydrateClienteSelect(clientes, vehiculos, citas) {
  const select = byId("selectCliente");
  if (!select || !Array.isArray(clientes)) return;
  const frag = document.createDocumentFragment();
  clientes.slice(0, 500).forEach(c => {
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
        <ul>${vehiculosCliente.map(v => `<li>${(v.marca||"").toString()} ${(v.modelo||"").toString()} (${v.placa || "sin placa"})</li>`).join("") || "<li>Ninguno</li>"}</ul>
        <p><strong>Citas:</strong> ${citasCliente.length}</p>
        <ul>${citasCliente.map(c => `<li>${c.fecha || ""} - ${(c.descripcion || "sin descripción")}</li>`).join("") || "<li>Ninguna</li>"}</ul>
      </div>
    `;
    Swal.fire({ title: `${(cliente?.nombre||"")} ${(cliente?.apellido||"")}`.trim(), html, icon:"info", confirmButtonColor:"#C91A1A", width:600 });
  });
}

function buildCharts(vehiculos) {
  const el1 = byId("graficaVehiculosMarca");
  const el2 = byId("graficaIngresosMensuales");
  if (el1) {
    const marcas = {};
    vehiculos.forEach(v => {
      const m = (v.marca || v.Marca || "Otra").toString().trim();
      marcas[m] = (marcas[m] || 0) + 1;
    });
    const labels = Object.keys(marcas);
    const data = Object.values(marcas);
    const ctx = el1.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, el1.height);
    grad.addColorStop(0, "rgba(201,26,26,0.9)");
    grad.addColorStop(1, "rgba(201,26,26,0.35)");
    new Chart(el1, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: labels.map((_,i)=> i%2===0?grad:"rgba(201,26,26,0.15)"),
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "60%",
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, usePointStyle: true, pointStyle: "circle" } },
          tooltip: { backgroundColor:"#111", padding:10, bodySpacing:4, displayColors:false }
        },
        animation: { animateRotate:true, animateScale:true, duration:900, easing:"easeOutQuart" }
      },
      plugins: [shadowPlugin()]
    });
  }
  if (el2) {
    const ctx = el2.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, el2.height);
    grad.addColorStop(0, "rgba(201,26,26,0.28)");
    grad.addColorStop(1, "rgba(201,26,26,0.02)");
    new Chart(el2, {
      type: "line",
      data: {
        labels: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],
        datasets: [{
          label:"Ingresos ($)",
          data:[8200,9400,10100,11300,9800,12500,11800,12100,12600,13300,12900,13800],
          borderColor:"#C91A1A",
          backgroundColor: grad,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointHitRadius: 12,
          fill:true,
          tension:0.35,
          borderWidth:2
        }]
      },
      options: {
        responsive:true,
        maintainAspectRatio:false,
        scales:{
          y:{ beginAtZero:true, grid:{ color:"rgba(0,0,0,.06)" } },
          x:{ grid:{ display:false } }
        },
        plugins:{
          legend:{ display:false },
          tooltip:{ backgroundColor:"#111", padding:10, bodySpacing:4, displayColors:false, callbacks:{ label: c => ` $${Number(c.parsed.y).toLocaleString()}` } }
        },
        animation:{ duration:800, easing:"easeOutQuart" }
      },
      plugins:[shadowPlugin()]
    });
  }
}

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
    afterDraw(c) { c.ctx.restore() }
  }
}

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

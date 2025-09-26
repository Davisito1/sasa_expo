import { listarOrdenes } from "./Services/OrdenTrabajoService.js";
import { listarDetalles } from "./Services/DetalleOrdenService.js";
import { listarMantenimientos } from "./Services/MantenimientosService.js";
import { obtenerFacturaPorOrden } from "./Services/FacturaService.js";

const $ = id => document.getElementById(id);
const qsa = s => Array.from(document.querySelectorAll(s));
const BS = typeof window !== "undefined" && window.bootstrap ? window.bootstrap : null;
const on = (id, ev, fn) => { const el = $(id); if (el) el.addEventListener(ev, fn); return !!el; };
const setText = (id, v) => { const el = $(id); if (el) el.textContent = v; };

document.addEventListener("DOMContentLoaded", init);

let page = 0, size = 10, cacheMants = {}, dataOrdenes = [];
let filtroTxt = "", fDesde = "", fHasta = "", fEstado = "";
let selected = null, modalFactura = null, pendingSelectId = null;

async function init() {
  initModal();
  tick(); setInterval(tick, 1000);

  on("pageSize", "change", () => { size = parseInt($("#pageSize").value, 10) || 10; page = 0; cargar(); });
  on("prevPage", "click", () => { if (page > 0) { page--; cargar(); } });
  on("nextPage", "click", () => { page++; cargar(); });
  on("btnAplicar", "click", aplicarFiltros);
  on("btnLimpiar", "click", limpiarFiltros);
  on("btnVerFactura", "click", () => { if (selected) abrirFactura(selected.idOrden); });
  on("btnAbrirEdicion", "click", e => { if (!selected) { e.preventDefault(); return; } e.currentTarget.href = `../Trabajos/trabajos.html?orden=${selected.idOrden}`; });

  const mres = await safeCall(listarMantenimientos());
  (mres?.data || mres || []).forEach(m => cacheMants[m.idMantenimiento] = { nombre: m.nombre, precio: m.precio });

  const qp = new URLSearchParams(location.search);
  pendingSelectId = Number(qp.get("orden")) || Number(sessionStorage.getItem("ordenActual")) || null;

  const filtro = $("#filtroTexto");
  if (filtro) filtro.addEventListener("keyup", e => { if (e.key === "Enter") aplicarFiltros(); });

  await cargar();
  trySelectAfterLoad();
}

function initModal() {
  const el = $("#modalFactura");
  if (BS && BS.Modal && el) modalFactura = BS.Modal.getOrCreateInstance(el);
}

function tick() {
  const f = new Date();
  setText("fechaActual", f.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
  setText("horaActual", f.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }));
}

async function cargar() {
  setLoading(true);
  const res = await safeCall(listarOrdenes({ page, size, filtro: filtroTxt }));
  const list = normalizeList(res);
  dataOrdenes = list.map(o => ({
    idOrden: o.idOrden,
    fecha: o.fecha,
    idVehiculo: o.idVehiculo,
    vehiculo: o.vehiculo?.placa || o.placa || "",
    cliente: o.vehiculo?.clienteNombre || o.clienteNombre || "",
    total: typeof o.montoTotal === "number" ? o.montoTotal : null,
    estado: o.estado || o.factura?.estado || null
  }));
  const filtrados = filtrarClienteSide(dataOrdenes);
  renderOrdenes(filtrados);
  setText("kpiTotalOrdenes", `${filtrados.length} órdenes`);
  setText("kpiPeriodo", periodBadge());
  setLoading(false);
}

function trySelectAfterLoad() {
  if (!pendingSelectId) return;
  const tr = [...qsa("#tablaOrdenes tbody tr")].find(r => Number(r.dataset.id) === pendingSelectId);
  if (tr) { tr.click(); pendingSelectId = null; }
}

function filtrarClienteSide(lista) {
  let r = [...lista];
  if (filtroTxt) {
    const t = filtroTxt.toLowerCase();
    r = r.filter(x =>
      String(x.idOrden).includes(t) ||
      String(x.vehiculo || "").toLowerCase().includes(t) ||
      String(x.cliente || "").toLowerCase().includes(t)
    );
  }
  if (fDesde) r = r.filter(x => !x.fecha || x.fecha.slice(0, 10) >= fDesde);
  if (fHasta) r = r.filter(x => !x.fecha || x.fecha.slice(0, 10) <= fHasta);
  if (fEstado) r = r.filter(x => x.estado === fEstado);
  return r;
}

function renderOrdenes(lista) {
  const tb = $("#tablaOrdenes tbody");
  if (!tb) return;
  tb.innerHTML = lista.map(x => `
    <tr data-id="${x.idOrden}">
      <td>${x.idOrden}</td>
      <td>${fmtFecha(x.fecha)}</td>
      <td>${x.vehiculo || "—"}</td>
      <td>${x.cliente || "—"}</td>
      <td class="text-end">${fmtMon(x.total)}</td>
      <td>${estadoPill(x.estado)}</td>
    </tr>
  `).join("");
  qsa("#tablaOrdenes tbody tr").forEach(tr => tr.addEventListener("click", () => selectOrden(Number(tr.dataset.id))));
  const vac = $("#vacioOrdenes");
  if (vac) vac.style.display = lista.length ? "none" : "flex";
  setText("pagInfo", `Página ${page + 1}`);
  setText("totalInfo", `${lista.length} registros`);
}

async function selectOrden(id) {
  qsa("#tablaOrdenes tbody tr").forEach(tr => tr.classList.toggle("active", Number(tr.dataset.id) === id));
  const base = dataOrdenes.find(x => x.idOrden === id) || { idOrden: id };
  selected = base;
  const btnEdit = $("#btnAbrirEdicion");
  const btnFac = $("#btnVerFactura");
  if (btnEdit) btnEdit.classList.toggle("disabled", !selected);
  if (btnFac) btnFac.classList.toggle("disabled", !selected);
  setText("detId", base.idOrden || "—");
  setText("detFecha", fmtFecha(base.fecha) || "—");
  setText("detVehiculo", base.vehiculo || "—");
  setText("detCliente", base.cliente || "—");
  const est = $("#estadoBadge");
  if (est) { est.textContent = base.estado || "—"; est.dataset.estado = base.estado || ""; }
  await cargarDetalle(id);
  if (base.total == null) await completarTotalesYEstado(id);
  sessionStorage.setItem("ordenActual", String(id));
}

async function cargarDetalle(idOrden) {
  const v = $("#vacioDetalle"), s = $("#spinDetalle");
  if (v) v.style.display = "none";
  if (s) s.style.display = "flex";
  const r = await safeCall(listarDetalles(idOrden));
  const detalles = (r?.data || r || []).map(d => ({
    idDetalle: d.idDetalle,
    idMantenimiento: d.idMantenimiento,
    nombre: cacheMants[d.idMantenimiento]?.nombre || d.mantenimiento?.nombre || `ID ${d.idMantenimiento}`,
    precio: typeof d.precio === "number" ? d.precio : (cacheMants[d.idMantenimiento]?.precio || 0)
  }));
  const tb = $("#tablaDetalle tbody");
  if (tb) tb.innerHTML = detalles.map(d => `
    <tr>
      <td>${d.idDetalle}</td>
      <td>${d.nombre}</td>
      <td class="text-end">${fmtMon(d.precio)}</td>
    </tr>
  `).join("");
  const sum = detalles.reduce((a, b) => a + (Number(b.precio) || 0), 0);
  setText("totalOrden", fmtMon(sum, true));
  if (v) v.style.display = detalles.length ? "none" : "flex";
  if (s) s.style.display = "none";
}

async function completarTotalesYEstado(idOrden) {
  const fac = await safeCall(obtenerFacturaPorOrden(idOrden));
  const f = fac?.data || fac;
  if (!f) return;
  const i = dataOrdenes.find(x => x.idOrden === idOrden);
  if (i) { i.total = Number(f.montoTotal) || i.total; i.estado = f.estado || i.estado; }
  const badge = $("#estadoBadge");
  if (badge) { badge.textContent = f?.estado || badge.textContent; badge.dataset.estado = f?.estado || ""; }
  if (Number(f?.montoTotal) > 0) setText("totalOrden", fmtMon(f.montoTotal, true));
}

async function abrirFactura(idOrden) {
  const fac = await safeCall(obtenerFacturaPorOrden(idOrden));
  const f = fac?.data || fac;
  if (!f || !f.idFactura) { Swal.fire("Sin factura", "Esta orden no tiene factura asociada.", "info"); return; }
  setText("facId", f.idFactura || "—");
  setText("facFecha", fmtFecha(f.fecha) || "—");
  setText("facEmpleado", String(f.empleadoNombre || f.idEmpleado || "—"));
  setText("facMetodo", String(f.metodoPago || f.idMetodoPago || "—"));
  setText("facDesc", f.descripcion || "—");
  const fe = $("#facEstado"); if (fe) { fe.textContent = f.estado || "—"; fe.dataset.estado = f.estado || ""; }
  setText("facMonto", fmtMon(f.montoTotal, true));
  if (modalFactura && modalFactura.show) modalFactura.show();
  else Swal.fire({ title: "Factura", html: document.querySelector("#modalFactura .modal-body").innerHTML, icon: "info" });
}

function aplicarFiltros() {
  const desde = ($("#fDesde")?.value || "");
  const hasta = ($("#fHasta")?.value || "");
  if (desde && hasta && desde > hasta) { Swal.fire("Rango inválido", "La fecha 'Desde' no puede ser mayor a 'Hasta'.", "warning"); return; }
  filtroTxt = ($("#filtroTexto")?.value || "").trim();
  fDesde = desde; fHasta = hasta; fEstado = ($("#fEstado")?.value || "");
  page = 0;
  cargar();
}

function limpiarFiltros() {
  if ($("#filtroTexto")) $("#filtroTexto").value = "";
  if ($("#fDesde")) $("#fDesde").value = "";
  if ($("#fHasta")) $("#fHasta").value = "";
  if ($("#fEstado")) $("#fEstado").value = "";
  filtroTxt = ""; fDesde = ""; fHasta = ""; fEstado = "";
  page = 0;
  cargar();
}

function setLoading(loading) {
  const spin = $("#spinOrdenes");
  const vac = $("#vacioOrdenes");
  if (spin) spin.style.display = loading ? "flex" : "none";
  if (vac) vac.style.display = loading ? "none" : ($("#tablaOrdenes tbody")?.children.length ? "none" : "flex");
}

function normalizeList(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.content)) return res.content;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  return [];
}

async function safeCall(p) {
  try { return await p; } catch { Swal.fire("Error", "No se pudo cargar la información.", "error"); return null; }
}

function fmtFecha(v) {
  if (!v) return "";
  const s = String(v).slice(0, 10);
  const d = new Date(s + "T00:00:00");
  return isNaN(d) ? s : d.toLocaleDateString();
}

function fmtMon(v, force) {
  const n = Number(v);
  if (!force && (!v && v !== 0)) return "—";
  if (isNaN(n)) return "—";
  return Number(n).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function estadoPill(estado) {
  if (!estado) return `<span class="badge rounded-pill">—</span>`;
  return `<span class="badge rounded-pill" data-estado="${estado}">${estado}</span>`;
}

function periodBadge() {
  const d1 = $("#fDesde")?.value, d2 = $("#fHasta")?.value;
  if (!d1 && !d2) return "Periodo actual";
  if (d1 && d2) return `${d1} a ${d2}`;
  if (d1) return `Desde ${d1}`;
  return `Hasta ${d2}`;
}

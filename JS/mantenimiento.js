/* =========================================================
 *  MANTENIMIENTO.JS — CRUD + paginación + combobox simple
 *  - Fecha no futura (max = hoy)
 *  - Código autogenerado (readonly)
 *  - Select de vehículos (con optgroups, SIN buscador)
 *  - Orden de campos según BD:
 *    idMantenimiento, descripcionTrabajo, fechaRealizacion, codigoMantenimiento, idVehiculo
 * =======================================================*/

// ======================= APIs =======================
const API_URL = 'https://retoolapi.dev/35dv6Q/data';                    // Mantenimientos
const VEHICULOS_API_URL = 'https://retoolapi.dev/4XQf28/anadirvehiculo'; // Vehículos

// ======================= DOM ========================
const tablaMantenimiento   = document.getElementById("tablaMantenimiento");
const frmAgregar           = document.getElementById("frmAgregarMantenimiento");
const frmEditar            = document.getElementById("frmEditarMantenimiento");

const modalAgregar         = document.getElementById("mdAgregarMantenimiento");
const modalEditar          = document.getElementById("mdEditarMantenimiento");

const selVehiculo          = document.getElementById("selVehiculo");
const selVehiculoEditar    = document.getElementById("selVehiculoEditar");

const inputBuscar          = document.getElementById("buscar");
const registrosSelect      = document.getElementById("registrosPorPagina");
const paginacionDiv        = document.getElementById("paginacion");

// =================== Estado (paginación) ===================
let vehiculosMap = {};
let vehiculosList = []; // {id, placa, marca, modelo, label}
let listaMantenimientos = [];
let filtrados = [];
let paginaActual = 1;
let porPagina = Number(registrosSelect?.value || 10);

// =================== Utilidades ===================
function toISODate(value) {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
    return iso.split("T")[0];
  } catch { return value; }
}

// Fecha: máximo hoy (no futura)
function setMaxHoy(input) {
  if (!input) return;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  input.max = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
}

// Generador de código: MT-YYYYMMDD-###
function generarCodigoAut() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const rnd = Math.floor(Math.random() * 900) + 100; // 100-999
  return `MT-${yyyy}${mm}${dd}-${rnd}`;
}

// =================== Validaciones ===================
function validarDescripcion(desc) {
  const val = String(desc ?? "").trim();
  if (val.length === 0) return true;                 // opcional
  return val.length >= 5 && val.length <= 500;
}
function validarFechaNoFutura(fecha) {
  const f = new Date(fecha);
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  if (isNaN(f.getTime())) return false;
  f.setHours(0, 0, 0, 0);
  return f <= hoy;
}
function validarIdVehiculo(id) {
  return id !== "" && id !== null && id !== undefined && !Number.isNaN(Number(id));
}
function validarCodigo(cod) {
  return /^[A-Z0-9\-_.]{3,50}$/.test(String(cod || ""));
}
function validarFormulario(m) {
  if (!validarIdVehiculo(m.idVehiculo)) {
    Swal.fire("Error", "Seleccione un vehículo.", "warning"); return false;
  }
  if (!m.codigoMantenimiento || !validarCodigo(m.codigoMantenimiento)) {
    Swal.fire("Error", "Código de mantenimiento inválido o vacío.", "warning"); return false;
  }
  if (!validarDescripcion(m.descripcionTrabajo)) {
    Swal.fire("Error", "Si escribe una descripción, debe tener entre 5 y 500 caracteres.", "warning"); return false;
  }
  if (!validarFechaNoFutura(m.fechaRealizacion)) {
    Swal.fire("Error", "La fecha no puede ser futura.", "warning"); return false;
  }
  return true;
}

// =============== Vehículos (normalización y rendering) ===============
function normalizaVehiculo(v) {
  const id     = v.id ?? v.idVehiculo ?? "";
  const placa  = v.placa || v.Placa || "";
  const modelo = v.modelo || v.Modelo || "";
  const marca  = v.marca  || v.Marca  || "";
  const label  = (placa || modelo || marca)
      ? `${placa}${placa && (modelo || marca) ? " - " : ""}${marca} ${modelo}`.trim()
      : `Vehículo #${id}`;
  return { id, placa, modelo, marca, label };
}
function ordenarVehiculos(a, b) {
  const byMarca  = (a.marca  || "").localeCompare(b.marca  || undefined, 'es', {sensitivity:'base'});
  if (byMarca !== 0) return byMarca;
  const byModelo = (a.modelo || "").localeCompare(b.modelo || undefined, 'es', {sensitivity:'base'});
  if (byModelo !== 0) return byModelo;
  return (a.placa || "").localeCompare(b.placa || undefined, 'es', {sensitivity:'base'});
}
function agruparPorMarca(list) {
  const grupos = {};
  list.forEach(v => {
    const key = v.marca || 'Sin marca';
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(v);
  });
  Object.keys(grupos).forEach(k => grupos[k].sort(ordenarVehiculos));
  return grupos;
}
function renderSelectConGrupos(selectEl, list) {
  if (!selectEl) return;
  const grupos = agruparPorMarca(list);
  let html = '<option value="" disabled selected>Seleccione un vehículo</option>';
  Object.keys(grupos).sort((a,b)=>a.localeCompare(b,'es',{sensitivity:'base'})).forEach(marca => {
    html += `<optgroup label="${marca}">`;
    grupos[marca].forEach(v => { html += `<option value="${v.id}">${v.label}</option>`; });
    html += `</optgroup>`;
  });
  selectEl.innerHTML = html;
}

// =================== Cargar Vehículos ===================
async function cargarVehiculos() {
  try {
    if (selVehiculo)       selVehiculo.innerHTML       = '<option disabled selected>Cargando vehículos…</option>';
    if (selVehiculoEditar) selVehiculoEditar.innerHTML = '<option disabled selected>Cargando vehículos…</option>';

    const res = await fetch(VEHICULOS_API_URL);
    if (!res.ok) throw new Error("No se pudo obtener vehículos");
    const listaRaw = await res.json();

    const seen = new Set();
    vehiculosList = listaRaw.map(normalizaVehiculo)
      .filter(v => v.id !== "" && !seen.has(v.id) && seen.add(v.id))
      .sort(ordenarVehiculos);

    vehiculosMap = {};
    vehiculosList.forEach(v => { vehiculosMap[v.id] = v.label; });

    renderSelectConGrupos(selVehiculo, vehiculosList);
    renderSelectConGrupos(selVehiculoEditar, vehiculosList);
  } catch (err) {
    console.error("Error al cargar vehículos:", err);
    vehiculosMap = {};
    vehiculosList = [];
    if (selVehiculo) selVehiculo.innerHTML = '<option value="" disabled selected>Sin vehículos</option>';
    if (selVehiculoEditar) selVehiculoEditar.innerHTML = '<option value="" disabled selected>Sin vehículos</option>';
  }
}

// =================== Modales ===================
async function abrirModalAgregar() {
  if (frmAgregar) frmAgregar.reset();
  await cargarVehiculos();

  const inputCodigo = document.getElementById("txtCodigoMantenimiento");
  if (inputCodigo) { inputCodigo.value = generarCodigoAut(); inputCodigo.readOnly = true; }

  setMaxHoy(document.getElementById("txtFechaRealizacion"));

  if (modalAgregar) modalAgregar.showModal();
}
function cerrarModalAgregar() {
  if (frmAgregar) frmAgregar.reset();
  if (modalAgregar) modalAgregar.close();
}
function cerrarModalEditar() {
  if (frmEditar) frmEditar.reset();
  if (modalEditar) modalEditar.close();
}

// =================== Render & Paginación ===================
function filaHTML(m) {
  const id = m.id ?? m.idMantenimiento ?? "";
  const descripcion = m.descripcionTrabajo ?? "";
  const fecha = toISODate(m.fechaRealizacion);
  const codigo = m.codigoMantenimiento ?? "";
  const idVehiculo = m.idVehiculo ?? "";
  const nombreVehiculo = vehiculosMap[idVehiculo] || `Vehículo #${idVehiculo}`;
  const placa = (vehiculosList.find(v=>String(v.id)===String(idVehiculo))?.placa) || '';

  return `
    <tr>
      <td>${id}</td>
      <td>${descripcion}</td>
      <td>${fecha}</td>
      <td>${codigo}</td>
      <td>
        ${nombreVehiculo}
        ${placa ? ` <span class="badge text-bg-light border ms-1">${placa}</span>` : ''}
      </td>
      <td>
        <button class="icon-btn btn-primary me-2" onclick="cargarParaEditarMantenimiento(${id})" title="Editar">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="icon-btn btn-danger" onclick="eliminarMantenimiento(${id})" title="Eliminar">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `;
}

function aplicarFiltro() {
  const q = (inputBuscar?.value || "").toLowerCase().trim();
  if (!q) { filtrados = [...listaMantenimientos]; }
  else {
    filtrados = listaMantenimientos.filter(m => {
      const texto = `${m.id ?? m.idMantenimiento ?? ""} ${m.descripcionTrabajo ?? ""} ${toISODate(m.fechaRealizacion)} ${m.codigoMantenimiento ?? ""} ${vehiculosMap[m.idVehiculo ?? ""] || ""}`.toLowerCase();
      return texto.includes(q);
    });
  }
  paginaActual = 1;
}

function renderizarTabla() {
  if (!tablaMantenimiento) return;
  aplicarFiltro();

  const total = filtrados.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  if (paginaActual > totalPaginas) paginaActual = totalPaginas;
  if (paginaActual < 1) paginaActual = 1;

  const start = (paginaActual - 1) * porPagina;
  const end = start + porPagina;
  const slice = filtrados.slice(start, end);

  if (!slice.length) {
    tablaMantenimiento.innerHTML = `<tr><td colspan="6" class="text-center">Sin resultados</td></tr>`;
  } else {
    tablaMantenimiento.innerHTML = slice.map(filaHTML).join("");
  }
  renderPaginacion();
}

function renderPaginacion(){
  if(!paginacionDiv) return;
  const total = filtrados.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

  const btn = (label, disabled, onClick, extra='') =>
    `<button class="btn ${extra}" ${disabled?'disabled':''} data-action="${onClick}">${label}</button>`;

  let html = "";
  html += btn("«", paginaActual===1, "prev");
  for(let p=1; p<=totalPaginas; p++){
    html += btn(p, false, `page-${p}`, ` ${p===paginaActual?'btn-primary':''} `);
  }
  html += btn("»", paginaActual===totalPaginas, "next");
  paginacionDiv.innerHTML = html;

  paginacionDiv.querySelectorAll("button[data-action]").forEach(b=>{
    const action = b.getAttribute("data-action");
    b.addEventListener("click", ()=>{
      if(action==="prev" && paginaActual>1){ paginaActual--; renderizarTabla(); }
      else if(action==="next"){
        const totalPag = Math.max(1, Math.ceil(filtrados.length / porPagina));
        if(paginaActual<totalPag){ paginaActual++; renderizarTabla(); }
      }else if(action?.startsWith("page-")){
        paginaActual = parseInt(action.split("-")[1],10) || 1;
        renderizarTabla();
      }
    });
  });
}

// =================== CRUD ===================
async function cargarMantenimiento() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Fetch mantenimientos falló");
    listaMantenimientos = await res.json();
    paginaActual = 1;
    renderizarTabla();
  } catch (error) {
    console.error("Error al cargar mantenimientos:", error);
    Swal.fire("Error", "No se pudieron cargar los mantenimientos.", "error");
  }
}

// Agregar
if (frmAgregar) {
  frmAgregar.addEventListener("submit", async (e) => {
    e.preventDefault();

    let codigo = (document.getElementById("txtCodigoMantenimiento")?.value || "").trim();
    if (!codigo) {
      codigo = generarCodigoAut();
      const codeInput = document.getElementById("txtCodigoMantenimiento");
      if (codeInput) codeInput.value = codigo;
    }

    const nuevo = {
      descripcionTrabajo: (document.getElementById("txtDescripcionTrabajo").value || "").trim(),
      fechaRealizacion: document.getElementById("txtFechaRealizacion").value,
      codigoMantenimiento: codigo,
      idVehiculo: Number(document.getElementById("selVehiculo").value)
    };

    if (!validarFormulario(nuevo)) return;

    try {
      const resp = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevo)
      });
      if (!resp.ok) throw new Error("POST falló");
      cerrarModalAgregar();
      await cargarMantenimiento();
      Swal.fire("Agregado", "El mantenimiento fue agregado correctamente.", "success");
    } catch (error) {
      console.error("Error al agregar:", error);
      Swal.fire("Error", "No se pudo agregar el mantenimiento.", "error");
    }
  });
}

// Cargar para editar
async function cargarParaEditarMantenimiento(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`);
    if (!res.ok) throw new Error("No se encontró mantenimiento");
    const data = await res.json();

    await cargarVehiculos();

    document.getElementById("txtIdEditarMantenimiento").value = data.id ?? data.idMantenimiento ?? "";
    document.getElementById("txtDescripcionTrabajoEditar").value = data.descripcionTrabajo ?? "";
    document.getElementById("txtFechaRealizacionEditar").value = toISODate(data.fechaRealizacion);
    document.getElementById("txtCodigoMantenimientoEditar").value = data.codigoMantenimiento ?? "";
    document.getElementById("selVehiculoEditar").value = (data.idVehiculo ?? "").toString();

    setMaxHoy(document.getElementById("txtFechaRealizacionEditar"));

    if (modalEditar) modalEditar.showModal();
  } catch (error) {
    console.error("Error al cargar mantenimiento:", error);
    Swal.fire("Error", "No se pudo cargar el mantenimiento para editar.", "error");
  }
}

// Editar
if (frmEditar) {
  frmEditar.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("txtIdEditarMantenimiento").value;

    const editado = {
      descripcionTrabajo: (document.getElementById("txtDescripcionTrabajoEditar").value || "").trim(),
      fechaRealizacion: document.getElementById("txtFechaRealizacionEditar").value,
      codigoMantenimiento: document.getElementById("txtCodigoMantenimientoEditar").value.trim(),
      idVehiculo: Number(document.getElementById("selVehiculoEditar").value)
    };

    if (!validarFormulario(editado)) return;

    try {
      const resp = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editado)
      });
      if (!resp.ok) throw new Error("PUT falló");
      cerrarModalEditar();
      await cargarMantenimiento();
      Swal.fire("Actualizado", "El mantenimiento fue actualizado correctamente.", "success");
    } catch (error) {
      console.error("Error al actualizar:", error);
      Swal.fire("Error", "No se pudo actualizar el mantenimiento.", "error");
    }
  });
}

// Eliminar
async function eliminarMantenimiento(id) {
  const result = await Swal.fire({
    title: '¿Eliminar?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      const resp = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error("DELETE falló");
      await cargarMantenimiento();
      Swal.fire("Eliminado", "El mantenimiento fue eliminado.", "success");
    } catch (error) {
      console.error("Error al eliminar:", error);
      Swal.fire("Error", "No se pudo eliminar el mantenimiento.", "error");
    }
  }
}

// =================== Búsqueda & Eventos ===================
function buscarMantenimiento() {
  paginaActual = 1;
  renderizarTabla();
}

// =================== Inicializar ===================
document.addEventListener("DOMContentLoaded", async () => {
  if (registrosSelect) {
    registrosSelect.addEventListener("change", () => {
      porPagina = Number(registrosSelect.value || 10);
      paginaActual = 1;
      renderizarTabla();
    });
  }
  if (inputBuscar) inputBuscar.addEventListener("input", buscarMantenimiento);

  await cargarVehiculos();
  await cargarMantenimiento();
});

// =================== Exponer globales ===================
window.cargarParaEditarMantenimiento = cargarParaEditarMantenimiento;
window.eliminarMantenimiento = eliminarMantenimiento;
window.buscarMantenimiento = buscarMantenimiento;
window.abrirModalAgregar = abrirModalAgregar;
window.cerrarModalAgregar = cerrarModalAgregar;
window.cerrarModalEditar = cerrarModalEditar;

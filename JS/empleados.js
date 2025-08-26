
const API_URL = "https://retoolapi.dev/mm42wr/empleados";

/* ============================================================
   ===============   1) CAPTURAR NODOS DEL DOM   ===============
   ============================================================ */
const tbody           = document.getElementById("tablaEmpleados");
const frmAgregar      = document.getElementById("frmAgregarEmpleado");
const frmEditar       = document.getElementById("frmEditarEmpleado");
const modalAgregar    = document.getElementById("mdAgregarEmpleado");
const modalEditar     = document.getElementById("mdEditarEmpleado");

const inputBuscar     = document.getElementById("buscar");
const selectPorPagina = document.getElementById("registrosPorPagina");
const paginacionWrap  = document.getElementById("paginacion");

/* Campos del form Agregar */
const inNomAdd   = frmAgregar?.querySelector("#txtNombre");
const inApeAdd   = frmAgregar?.querySelector("#txtApellido");
const selCargoAdd= frmAgregar?.querySelector("#selectCargo"); // <- COMBOBOX (necesario)
const inDuiAdd   = frmAgregar?.querySelector("#txtDUI");
const inTelAdd   = frmAgregar?.querySelector("#txtTelefono");
const inDirAdd   = frmAgregar?.querySelector("#txtDireccion");
const inFecAdd   = frmAgregar?.querySelector("#fechaContratacion");
const inMailAdd  = frmAgregar?.querySelector("#txtCorreo");
const inUserAdd  = frmAgregar?.querySelector("#txtUsuario");

/* Campos del form Editar */
const inIdEdit   = frmEditar?.querySelector("#txtIdEmpleado");
const inNomEdit  = frmEditar?.querySelector("#txtEditarNombre");
const inApeEdit  = frmEditar?.querySelector("#txtEditarApellido");
const selCargoEd = frmEditar?.querySelector("#selectEditarCargo"); // <- COMBOBOX (necesario)
const inDuiEdit  = frmEditar?.querySelector("#txtEditarDUI");
const inTelEdit  = frmEditar?.querySelector("#txtEditarTelefono");
const inDirEdit  = frmEditar?.querySelector("#txtEditarDireccion");
const inFecEdit  = frmEditar?.querySelector("#editarFechaContratacion");
const inMailEdit = frmEditar?.querySelector("#txtEditarCorreo");
const inUserEdit = frmEditar?.querySelector("#txtEditarUsuario");

/* ============================================================
   ====================   2) ESTADO APP   =====================
   ============================================================ */
let empleados = [];   // todos los registros traídos de la API
let filtrados = [];   // los que pasan el filtro de búsqueda
let paginaActual = 1; // la página que estoy viendo
let porPagina = (selectPorPagina && parseInt(selectPorPagina.value, 10)) || 10;

/* ============================================================
   ====================   3) MODALES   ========================
   ============================================================ */
function abrirModal(modal, form) {
  modal?.showModal?.();
  // Cuando abro un modal, limpio el form para evitar basura de antes
  if (form) form.reset();
}
function cerrarModal(modal, form) {
  modal?.close?.();
  if (form) form.reset();
}
function abrirModalAgregar(){ abrirModal(modalAgregar, frmAgregar); }
function cerrarModalAgregar(){ cerrarModal(modalAgregar, frmAgregar); }
function cerrarModalEditar(){  cerrarModal(modalEditar,  frmEditar);  }

/* ============================================================
   ==================   4) VALIDACIONES   =====================
   ============================================================ */
// DUI: formato ########-#
function validarDUI(dui) {
  return /^\d{8}-\d{1}$/.test((dui || "").trim());
}
// Teléfono: formato ####-####
function validarTelefono(t) {
  return /^\d{4}-\d{4}$/.test((t || "").trim());
}
// Nombre/Apellido: solo letras, espacios y tildes básicas
function validarNombreApe(txt) {
  return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]{2,60}$/.test((txt || "").trim());
}
// Email: patrón decente
function validarEmail(mail) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((mail || "").trim());
}
// Cargo: debe ser uno de los predefinidos del combobox
const CARGOS_VALIDOS = ["Administrador", "Mecánico", "Recepcionista"];
function validarCargo(cargo) {
  return CARGOS_VALIDOS.includes(cargo);
}
// Fecha de contratación: no futura y no antes de 2000-01-01
function validarFecha(fechaStr) {
  if (!fechaStr) return false;
  const f = new Date(fechaStr + "T00:00:00");
  const min = new Date("2000-01-01T00:00:00");
  const hoy = new Date();
  // Normalizo hoy a 00:00 para evitar falsos positivos por zona horaria
  hoy.setHours(0,0,0,0);
  return f >= min && f <= hoy;
}
// Dirección: que tenga algo razonable (mín 5 chars)
function validarDireccion(dir) {
  return (dir || "").trim().length >= 5;
}
// Usuario: no vacío (si existe en tu BD como FK, aquí solo validamos presencia)
function validarUsuario(u) {
  return (u || "").trim().length >= 3;
}

// Validador general del objeto empleado
function validarForm(e) {
  if (!validarNombreApe(e.nombre)) {
    Swal.fire("Error", "Nombre inválido (solo letras y espacios, 2-60).", "warning"); return false;
  }
  if (!validarNombreApe(e.apellido)) {
    Swal.fire("Error", "Apellido inválido (solo letras y espacios, 2-60).", "warning"); return false;
  }
  if (!validarCargo(e.cargo)) {
    Swal.fire("Error", "Seleccione un cargo válido.", "warning"); return false;
  }
  if (!validarDUI(e.dui)) {
    Swal.fire("Error", "El DUI debe tener el formato ########-#.", "warning"); return false;
  }
  if (!validarTelefono(e.telefono)) {
    Swal.fire("Error", "El teléfono debe tener el formato ####-####.", "warning"); return false;
  }
  if (!validarDireccion(e.direccion)) {
    Swal.fire("Error", "La dirección es muy corta.", "warning"); return false;
  }
  if (!validarFecha(e.fechaContratacion)) {
    Swal.fire("Error", "La fecha de contratación no puede ser futura ni menor a 2000-01-01.", "warning"); return false;
  }
  if (!validarEmail(e.correo)) {
    Swal.fire("Error", "Correo electrónico inválido.", "warning"); return false;
  }
  if (!validarUsuario(e.usuario)) {
    Swal.fire("Error", "Usuario inválido (mínimo 3 caracteres).", "warning"); return false;
  }
  return true;
}

/* ============================================================
   ==================   5) FORMATEADORES   ====================
   ============================================================ */
// Auto guiones para DUI (8-1)
function formatearDUIInput(el) {
  let v = (el.value || "").replace(/\D/g, "").slice(0, 9); // solo dígitos máx 9
  if (v.length > 8) el.value = v.slice(0, 8) + "-" + v.slice(8);
  else el.value = v;
}
// Auto guiones para teléfono (4-4)
function formatearTelInput(el) {
  let v = (el.value || "").replace(/\D/g, "").slice(0, 8);
  if (v.length > 4) el.value = v.slice(0, 4) + "-" + v.slice(4);
  else el.value = v;
}

/* Eventos de formateo tiempo real (Agregar) */
inDuiAdd?.addEventListener("input", () => formatearDUIInput(inDuiAdd));
inTelAdd?.addEventListener("input", () => formatearTelInput(inTelAdd));
/* Eventos de formateo tiempo real (Editar) */
inDuiEdit?.addEventListener("input", () => formatearDUIInput(inDuiEdit));
inTelEdit?.addEventListener("input", () => formatearTelInput(inTelEdit));

/* ============================================================
   ====================   6) DATA (API)   =====================
   ============================================================ */
async function obtenerEmpleados() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Error al cargar empleados");
    empleados = await res.json();

    // Normalizo nombres de campos por si la API devuelve otras keys:
    empleados = empleados.map(e => ({
      id: e.id ?? e.idEmpleado ?? e.ID ?? "",
      nombre: e.nombre ?? e.Nombre ?? "",
      apellido: e.apellido ?? e.Apellido ?? "",
      cargo: e.cargo ?? e.Cargo ?? "",
      dui: e.dui ?? e.DUI ?? "",
      telefono: e.telefono ?? e.Telefono ?? "",
      direccion: e.direccion ?? e.Direccion ?? "",
      fechaContratacion: e.fechaContratacion ?? e.FechaContratacion ?? e.fecha_contratacion ?? "",
      correo: e.correo ?? e.Correo ?? "",
      usuario: e.usuario ?? e.Usuario ?? ""   // si en tu BD es FK, acá mostramos su username/string
    }));

    aplicarFiltro();
    render();
  } catch (e) {
    console.error(e);
    empleados = [];
    aplicarFiltro();
    render();
    Swal.fire("Error", "No se pudieron cargar los empleados.", "error");
  }
}

/* ============================================================
   ===========   7) FILTRO (BUSCAR) + PAGINACIÓN   ============
   ============================================================ */
function aplicarFiltro() {
  const q = (inputBuscar?.value || "").trim().toLowerCase();
  if (!q) {
    filtrados = [...empleados];
  } else {
    filtrados = empleados.filter(e => {
      const campos = [
        e.id, e.nombre, e.apellido, e.cargo, e.dui, e.telefono,
        e.direccion, e.fechaContratacion, e.correo, e.usuario
      ];
      return campos.some(v => String(v ?? "").toLowerCase().includes(q));
    });
  }
  paginaActual = 1; // cada vez que filtro, regreso a la primera página
}

function setPorPagina() {
  porPagina = (selectPorPagina && parseInt(selectPorPagina.value, 10)) || 10;
  paginaActual = 1;
  render();
}

/* Expuesta para el onkeyup del HTML (opcional) */
function BuscarEmpleado() {
  aplicarFiltro();
  render();
}
window.BuscarEmpleado = BuscarEmpleado;

/* ============================================================
   =====================   8) RENDER UI   =====================
   ============================================================ */
function render() {
  renderTabla();
  renderPaginacion();
  rewireRowActions();
}

function renderTabla() {
  if (!tbody) return;

  const total = filtrados.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  // Evito que se vaya de rango
  if (paginaActual > totalPaginas) paginaActual = totalPaginas;
  if (paginaActual < 1) paginaActual = 1;

  const start = (paginaActual - 1) * porPagina;
  const end   = start + porPagina;
  const vista = filtrados.slice(start, end);

  if (vista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" class="text-center">Sin resultados</td></tr>`;
    return;
  }

  tbody.innerHTML = vista.map(empleado => `
    <tr>
      <td>${empleado.id ?? ""}</td>
      <td>${empleado.nombre ?? ""}</td>
      <td>${empleado.apellido ?? ""}</td>
      <td>${empleado.cargo ?? ""}</td>
      <td>${empleado.dui ?? ""}</td>
      <td>${empleado.telefono ?? ""}</td>
      <td>${empleado.direccion ?? ""}</td>
      <td>${empleado.fechaContratacion ?? ""}</td>
      <td>${empleado.correo ?? ""}</td>
      <td>${empleado.usuario ?? ""}</td>
      <td class="d-flex gap-1">
        <button class="icon-btn btn-primary btn-editar" data-id="${empleado.id}" title="Editar">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="icon-btn btn-danger btn-eliminar" data-id="${empleado.id}" title="Eliminar">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join("");
}

function renderPaginacion() {
  if (!paginacionWrap) return;

  const total = filtrados.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const btn = (label, disabled, onClick, extra='') =>
    `<button class="btn ${extra}" ${disabled?'disabled':''} data-action="${onClick}">${label}</button>`;

  // Paginador simple: Anterior | 1 2 3 | Siguiente
  let html = "";
  html += btn("Anterior", paginaActual === 1, "prev");
  for (let p = 1; p <= totalPaginas; p++) {
    html += btn(p, false, `page-${p}`, ` ${p===paginaActual?'btn-primary':''} `);
  }
  html += btn("Siguiente", paginaActual === totalPaginas, "next");

  paginacionWrap.innerHTML = html;

  // Agrego eventos a los botones del paginador
  paginacionWrap.querySelectorAll("button[data-action]").forEach(b => {
    const action = b.getAttribute("data-action");
    b.addEventListener("click", () => {
      if (action === "prev" && paginaActual > 1) {
        paginaActual--;
        render();
      } else if (action === "next") {
        const totalPag = Math.max(1, Math.ceil(filtrados.length / porPagina));
        if (paginaActual < totalPag) { paginaActual++; render(); }
      } else if (action?.startsWith("page-")) {
        paginaActual = parseInt(action.split("-")[1], 10) || 1;
        render();
      }
    });
  });
}

function rewireRowActions() {
  document.querySelectorAll(".btn-editar").forEach(btn => {
    btn.onclick = () => cargarParaEditar(btn.dataset.id);
  });
  document.querySelectorAll(".btn-eliminar").forEach(btn => {
    btn.onclick = () => eliminarEmpleado(btn.dataset.id);
  });
}

/* ============================================================
   ======================   9) CRUD   =========================
   ============================================================ */
// A) Agregar
frmAgregar?.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Armo el objeto empleado según el ORDEN de la BD
  const empleado = {
    nombre:   inNomAdd.value.trim(),
    apellido: inApeAdd.value.trim(),
    cargo:    selCargoAdd.value.trim(),  // <- combobox
    dui:      inDuiAdd.value.trim(),
    telefono: inTelAdd.value.trim(),
    direccion:inDirAdd.value.trim(),
    fechaContratacion: inFecAdd.value,
    correo:   inMailAdd.value.trim(),
    usuario:  inUserAdd.value.trim(),
  };

  if (!validarForm(empleado)) return;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(empleado)
    });
    if (!res.ok) throw new Error("Error al agregar empleado");
    cerrarModalAgregar();
    await obtenerEmpleados();
    Swal.fire("Éxito", "Empleado agregado correctamente.", "success");
  } catch (e) {
    console.error(e);
    Swal.fire("Error", "No se pudo agregar el empleado.", "error");
  }
});

// B) Cargar para editar (traigo 1 registro por id)
async function cargarParaEditar(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`);
    if (!res.ok) throw new Error("Error al cargar empleado");
    const data = await res.json();

    // Lleno el formulario de edición
    inIdEdit.value   = data.id ?? data.idEmpleado ?? data.ID ?? "";
    inNomEdit.value  = data.nombre ?? data.Nombre ?? "";
    inApeEdit.value  = data.apellido ?? data.Apellido ?? "";
    selCargoEd.value = (data.cargo ?? data.Cargo ?? "Administrador"); // si no hay, pongo Admin
    inDuiEdit.value  = data.dui ?? data.DUI ?? "";
    inTelEdit.value  = data.telefono ?? data.Telefono ?? "";
    inDirEdit.value  = data.direccion ?? data.Direccion ?? "";
    inFecEdit.value  = data.fechaContratacion ?? data.FechaContratacion ?? "";
    inMailEdit.value = data.correo ?? data.Correo ?? "";
    inUserEdit.value = data.usuario ?? data.Usuario ?? "";

    abrirModal(modalEditar);
  } catch (e) {
    console.error(e);
    Swal.fire("Error", "No se pudo cargar el empleado para editar.", "error");
  }
}

// C) Editar (PUT)
frmEditar?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = inIdEdit.value;
  const empleado = {
    nombre:   inNomEdit.value.trim(),
    apellido: inApeEdit.value.trim(),
    cargo:    selCargoEd.value.trim(),
    dui:      inDuiEdit.value.trim(),
    telefono: inTelEdit.value.trim(),
    direccion:inDirEdit.value.trim(),
    fechaContratacion: inFecEdit.value,
    correo:   inMailEdit.value.trim(),
    usuario:  inUserEdit.value.trim(),
  };

  if (!validarForm(empleado)) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(empleado)
    });
    if (!res.ok) throw new Error("Error al actualizar empleado");
    cerrarModalEditar();
    await obtenerEmpleados();
    Swal.fire("Éxito", "Empleado actualizado correctamente.", "success");
  } catch (e) {
    console.error(e);
    Swal.fire("Error", "No se pudo actualizar el empleado.", "error");
  }
});

// D) Eliminar (DELETE)
async function eliminarEmpleado(id) {
  const result = await Swal.fire({
    title: "¿Deseas eliminar este empleado?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  });
  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Error al eliminar empleado");
    await obtenerEmpleados();
    Swal.fire("Eliminado", "Empleado eliminado correctamente.", "success");
  } catch (e) {
    console.error(e);
    Swal.fire("Error", "No se pudo eliminar el empleado.", "error");
  }
}

/* ============================================================
   ====================   10) EVENTOS   =======================
   ============================================================ */
inputBuscar?.addEventListener("input", () => { aplicarFiltro(); render(); });
selectPorPagina?.addEventListener("change", setPorPagina);

/* ============================================================
   =====================   11) INICIO   =======================
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  // Pre-cargo opciones válidas de cargo por si quieres añadir más a futuro
  if (selCargoAdd && selCargoAdd.options.length <= 1) {
    CARGOS_VALIDOS.forEach(c => {
      const op = document.createElement("option");
      op.value = c; op.textContent = c;
      selCargoAdd.appendChild(op);
    });
  }
  if (selCargoEd && selCargoEd.options.length <= 2) {
    // En editar ya trae algunas, igual garantizo que estén todas
    const ya = new Set(Array.from(selCargoEd.options).map(o => o.value));
    CARGOS_VALIDOS.forEach(c => {
      if (!ya.has(c)) {
        const op = document.createElement("option");
        op.value = c; op.textContent = c;
        selCargoEd.appendChild(op);
      }
    });
  }

  // Cargo datos
  obtenerEmpleados();
});

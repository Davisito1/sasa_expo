/* ============================
 *  C I T A S   (citas.html)
 *  - Campos según BD: idCita, fecha, hora, estado, idCliente
 *  - Combobox de clientes (FK)
 *  - Fecha no pasada, hora entre 07:00 y 16:00
 *  - Paginación simple (cliente)
 * ============================ */

const API_CITAS = "https://retoolapi.dev/K3dg6S/citas";     // <- Ajusta si usas tu API Java
const API_CLIENTES = "https://retoolapi.dev/PifxKy/data";   // <- Ajusta si tu catálogo de clientes está en otro endpoint

// ====== DOM ======
const tablaBody        = document.getElementById("tablaCitas");
const frmAgregar       = document.getElementById("frmAgregarCita");
const frmEditar        = document.getElementById("frmEditarCita");
const modalAgregar     = document.getElementById("mdAgregarCita");
const modalEditar      = document.getElementById("mdEditarCita");
const selClienteAdd    = document.getElementById("selectCliente");
const selClienteEdit   = document.getElementById("selectEditarCliente");
const selEstadoAdd     = document.getElementById("selectEstado");
const selEstadoEdit    = document.getElementById("selectEditarEstado");
const fechaAdd         = document.getElementById("fechaCita");
const fechaEdit        = document.getElementById("editarFechaCita");
const horaAdd          = document.getElementById("horaCita");
const horaEdit         = document.getElementById("editarHoraCita");
const paginationUL     = document.getElementById("pagination");
const selectPageSize   = document.getElementById("registrosPorPagina");

// ====== Estado en memoria ======
let CLIENTES = [];             // array de clientes (para poblar combos)
let CLIENTE_MAP = new Map();   // idCliente -> nombre completo
let CITAS = [];                // todas las citas (lista completa)
let currentPage = 1;           // página actual
let pageSize = Number(selectPageSize?.value || 10);

// ====== Utilidades ======
const ESTADOS_PERMITIDOS = ["Pendiente", "Confirmada", "Cancelada"];
const HORA_MIN = "07:00";
const HORA_MAX = "16:00";

// Normaliza un cliente a {idCliente, nombreCompleto}
function normalizeCliente(c) {
  // Posibles campos en distintas APIs:
  const id = c.idCliente ?? c.id ?? c.ID ?? c.Id ?? null;
  const nombre = c.nombre ?? c.Nombre ?? c.nombres ?? c.Nombres ?? "";
  const apellido = c.apellido ?? c.Apellido ?? c.apellidos ?? c.Apellidos ?? "";
  const nombreCompleto = `${nombre || ""} ${apellido || ""}`.trim() || (c.nombreCompleto ?? c.fullname ?? "Sin nombre");
  return { idCliente: Number(id), nombreCompleto };
}

// Convierte una cita remota a tu modelo de BD
function normalizeCita(x) {
  // Algunas APIs Retool guardan "id" en vez de idCita, o "cliente" en vez de idCliente
  const idCita = x.idCita ?? x.id ?? x.ID ?? null;

  // Fecha se espera en YYYY-MM-DD; si viniera en otro formato aquí podrías convertir
  const fecha = x.fecha ?? x.Fecha ?? "";

  // Hora en 'HH:MM'
  const hora = x.hora ?? x.Hora ?? "";

  // Estado
  const estado = x.estado ?? x.Estado ?? "Pendiente";

  // Si ya viene idCliente, úsalo; si viene "cliente" como nombre, intenta mapearlo a ID
  let idCliente = x.idCliente ?? x.IdCliente ?? null;
  if (!idCliente && x.cliente) {
    // Buscar por nombre
    const target = String(x.cliente).toLowerCase();
    const encontrado = CLIENTES.find(c => c.nombreCompleto.toLowerCase() === target);
    if (encontrado) idCliente = encontrado.idCliente;
  }
  idCliente = idCliente != null ? Number(idCliente) : null;

  return { idCita: Number(idCita), fecha, hora, estado, idCliente };
}

// Formatea nombre de cliente desde id
function nombreCliente(idCliente) {
  if (!idCliente) return "—";
  return CLIENTE_MAP.get(Number(idCliente)) || `ID ${idCliente}`;
}

// Validaciones
function validarFechaHoyOposterior(valorISO) {
  if (!valorISO) return false;
  const [y, m, d] = valorISO.split("-").map(Number);
  const seleccionada = new Date(y, (m - 1), d);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  seleccionada.setHours(0, 0, 0, 0);
  return seleccionada >= hoy;
}

function validarHoraRango(hhmm) {
  if (!hhmm) return false;
  return (hhmm >= HORA_MIN && hhmm <= HORA_MAX);
}

function validarEstado(estado) {
  return ESTADOS_PERMITIDOS.includes(estado);
}

function validarClienteSeleccion(idCliente) {
  return !!idCliente && !Number.isNaN(Number(idCliente)) && Number(idCliente) > 0;
}

// ====== Carga inicial ======
document.addEventListener("DOMContentLoaded", async () => {
  // Fecha min hoy
  const hoyISO = new Date().toISOString().split("T")[0];
  if (fechaAdd)  fechaAdd.min  = hoyISO;
  if (fechaEdit) fechaEdit.min = hoyISO;

  // Rango de hora
  if (horaAdd)  { horaAdd.min = HORA_MIN;  horaAdd.max = HORA_MAX; }
  if (horaEdit) { horaEdit.min = HORA_MIN; horaEdit.max = HORA_MAX; }

  await cargarClientes();
  await ObtenerCitas();

  if (selectPageSize) {
    selectPageSize.addEventListener("change", () => {
      pageSize = Number(selectPageSize.value);
      currentPage = 1;
      renderTablaPaginada();
    });
  }
});

// ====== Fetch clientes (combos) ======
async function cargarClientes() {
  try {
    const res = await fetch(API_CLIENTES);
    if (!res.ok) throw new Error("No se pudieron cargar clientes");
    const data = await res.json();
    CLIENTES = data.map(normalizeCliente).filter(c => c.idCliente);
    CLIENTE_MAP = new Map(CLIENTES.map(c => [c.idCliente, c.nombreCompleto]));
    poblarCombosClientes();
  } catch (err) {
    console.error(err);
    Swal.fire("Advertencia", "No se pudieron cargar clientes. Verifica la API de clientes.", "warning");
  }
}

function poblarCombosClientes() {
  const options = ['<option disabled selected value="">Seleccionar Cliente</option>']
    .concat(CLIENTES
      .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto))
      .map(c => `<option value="${c.idCliente}">${c.nombreCompleto} (ID ${c.idCliente})</option>`));

  if (selClienteAdd)  selClienteAdd.innerHTML  = options.join("");
  if (selClienteEdit) selClienteEdit.innerHTML = options.join("");
}

// ====== Fetch citas ======
async function ObtenerCitas() {
  try {
    const res = await fetch(API_CITAS);
    if (!res.ok) throw new Error("Error al obtener citas");
    const raw = await res.json();
    CITAS = raw.map(normalizeCita).filter(c => c.idCita || c.fecha);
    currentPage = 1;
    renderTablaPaginada();
  } catch (e) {
    console.error(e);
    Swal.fire("Error", "No se pudieron cargar las citas.", "error");
  }
}

// ====== Render / Paginación ======
function paginate(array, pageNumber, size) {
  const start = (pageNumber - 1) * size;
  return array.slice(start, start + size);
}

function renderTablaPaginada() {
  const filtro = document.getElementById("buscar")?.value?.toLowerCase() || "";
  let datos = CITAS;

  if (filtro) {
    datos = CITAS.filter(c => {
      const texto = `${c.idCita ?? ""} ${c.fecha ?? ""} ${c.hora ?? ""} ${c.estado ?? ""} ${nombreCliente(c.idCliente)}`.toLowerCase();
      return texto.includes(filtro);
    });
  }

  const totalPages = Math.max(1, Math.ceil(datos.length / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;

  const page = paginate(datos, currentPage, pageSize);
  MostrarCitas(page);
  renderPagination(totalPages);
}

function MostrarCitas(datos) {
  tablaBody.innerHTML = datos.map(c => `
    <tr>
      <td>${c.idCita ?? "—"}</td>
      <td>${c.fecha || "—"}</td>
      <td>${c.hora || "—"}</td>
      <td>${c.estado || "—"}</td>
      <td>${nombreCliente(c.idCliente)}</td>
      <td>
        <button class="btn btn-sm icon-btn btn-primary" title="Editar" onclick="CargarParaEditar(${c.idCita})">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="btn btn-sm icon-btn btn-danger" title="Eliminar" onclick="EliminarCita(${c.idCita})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join("");
}

function renderPagination(totalPages) {
  if (!paginationUL) return;
  let html = "";

  html += `
    <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
      <a class="page-link" href="#" onclick="irPagina(${currentPage - 1}); return false;">«</a>
    </li>
  `;

  for (let p = 1; p <= totalPages; p++) {
    html += `
      <li class="page-item ${p === currentPage ? "active" : ""}">
        <a class="page-link" href="#" onclick="irPagina(${p}); return false;">${p}</a>
      </li>
    `;
  }

  html += `
    <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
      <a class="page-link" href="#" onclick="irPagina(${currentPage + 1}); return false;">»</a>
    </li>
  `;

  paginationUL.innerHTML = html;
}

function irPagina(p) {
  if (p < 1) return;
  const totalPages = Math.max(1, Math.ceil(CITAS.length / pageSize));
  if (p > totalPages) return;
  currentPage = p;
  renderTablaPaginada();
}

// ====== Modales ======
function abrirModalAgregar() {
  modalAgregar?.showModal();
}
function cerrarModalAgregar() {
  modalAgregar?.close();
  frmAgregar?.reset();
  // Reponer placeholder de cliente
  poblarCombosClientes();
}

function abrirModalEditar() {
  modalEditar?.showModal();
}
function cerrarModalEditar() {
  modalEditar?.close();
  frmEditar?.reset();
  poblarCombosClientes();
}

// ====== CRUD ======
frmAgregar?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fecha = fechaAdd.value;
  const hora = horaAdd.value;
  const estado = selEstadoAdd.value;
  const idCliente = selClienteAdd.value;

  // Validaciones
  if (!validarFechaHoyOposterior(fecha)) {
    return Swal.fire("Validación", "La fecha no puede ser anterior a hoy.", "warning");
  }
  if (!validarHoraRango(hora)) {
    return Swal.fire("Validación", `La hora debe estar entre ${HORA_MIN} y ${HORA_MAX}.`, "warning");
  }
  if (!validarEstado(estado)) {
    return Swal.fire("Validación", "Estado inválido.", "warning");
  }
  if (!validarClienteSeleccion(idCliente)) {
    return Swal.fire("Validación", "Selecciona un cliente válido.", "warning");
  }

  try {
    // Alineado a BD: enviamos idCliente (no el nombre)
    const body = { fecha, hora, estado, idCliente: Number(idCliente) };
    const res = await fetch(API_CITAS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Error al agregar cita");

    cerrarModalAgregar();
    await ObtenerCitas();
    Swal.fire("Agregado", "La cita se agregó correctamente.", "success");
  } catch (e2) {
    console.error(e2);
    Swal.fire("Error", "No se pudo agregar la cita.", "error");
  }
});

async function CargarParaEditar(idCita) {
  try {
    const res = await fetch(`${API_CITAS}/${idCita}`);
    if (!res.ok) throw new Error("Error al cargar cita");
    const raw = await res.json();
    const cita = normalizeCita(raw);

    document.getElementById("txtIdCita").value = cita.idCita ?? idCita;
    fechaEdit.value = cita.fecha || "";
    horaEdit.value = cita.hora || "";
    selEstadoEdit.value = validarEstado(cita.estado) ? cita.estado : "Pendiente";

    // Seleccionar cliente (si no hay id, tratamos de inferir)
    if (cita.idCliente && CLIENTE_MAP.has(Number(cita.idCliente))) {
      selClienteEdit.value = String(cita.idCliente);
    } else {
      // no hay idCliente: mostramos placeholder
      selClienteEdit.value = "";
    }

    abrirModalEditar();
  } catch (e) {
    console.error(e);
    Swal.fire("Error", "No se pudo cargar la cita.", "error");
  }
}

frmEditar?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("txtIdCita").value;
  const fecha = fechaEdit.value;
  const hora = horaEdit.value;
  const estado = selEstadoEdit.value;
  const idCliente = selClienteEdit.value;

  // Validaciones
  if (!validarFechaHoyOposterior(fecha)) {
    return Swal.fire("Validación", "La fecha no puede ser anterior a hoy.", "warning");
  }
  if (!validarHoraRango(hora)) {
    return Swal.fire("Validación", `La hora debe estar entre ${HORA_MIN} y ${HORA_MAX}.`, "warning");
  }
  if (!validarEstado(estado)) {
    return Swal.fire("Validación", "Estado inválido.", "warning");
  }
  if (!validarClienteSeleccion(idCliente)) {
    return Swal.fire("Validación", "Selecciona un cliente válido.", "warning");
  }

  try {
    const body = { fecha, hora, estado, idCliente: Number(idCliente) };
    const res = await fetch(`${API_CITAS}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Error al actualizar cita");

    cerrarModalEditar();
    await ObtenerCitas();
    Swal.fire("Actualizado", "La cita se actualizó correctamente.", "success");
  } catch (e2) {
    console.error(e2);
    Swal.fire("Error", "No se pudo actualizar la cita.", "error");
  }
});

async function EliminarCita(id) {
  const result = await Swal.fire({
    title: "¿Deseas eliminar esta cita?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  });

  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`${API_CITAS}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Error al eliminar cita");

    await ObtenerCitas();
    Swal.fire("Eliminado", "La cita fue eliminada correctamente.", "success");
  } catch (e) {
    console.error(e);
    Swal.fire("Error", "No se pudo eliminar la cita.", "error");
  }
}

// ====== Búsqueda instantánea ======
function BuscarCita() {
  currentPage = 1;
  renderTablaPaginada();
}

// ====== Exponer funciones a window (para llamados inline) ======
window.abrirModalAgregar = abrirModalAgregar;
window.cerrarModalAgregar = cerrarModalAgregar;
window.abrirModalEditar  = abrirModalEditar;
window.cerrarModalEditar = cerrarModalEditar;
window.CargarParaEditar  = CargarParaEditar;
window.EliminarCita      = EliminarCita;
window.BuscarCita        = BuscarCita;
window.irPagina          = irPagina;

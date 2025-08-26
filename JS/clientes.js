// === Endpoint ===
const API_URL = 'https://retoolapi.dev/PifxKy/data';

// === DOM ===
const tablaClientes = document.getElementById("tablaClientes");
const frmAgregar = document.getElementById("frmAgregarClientes");
const frmEditar = document.getElementById("frmEditarClientes");

const modalAgregar = document.getElementById("mdAgregarClientes");
const modalEditar = document.getElementById("mdEditarClientes");

const selectRegistros = document.getElementById("registrosPorPagina");
const contenedorPaginacion = document.getElementById("paginacion");
const inputBuscar = document.getElementById("buscar");

// === Estado (paginación) ===
let clientes = [];
let paginaActual = 1;
let registrosPorPagina = parseInt(selectRegistros?.value || 10, 10);

// ===============================
// Utilidades de normalización
// ===============================
const toId = (c) =>
  c.id ?? c.idCliente ?? c.ID ?? c.Id ?? c.id_cliente ?? null;

function normalizar(c) {
  return {
    id: toId(c),
    nombre:  c.nombre ?? c.Nombre ?? c.Nombres ?? c.nombres ?? "",
    apellido:c.apellido ?? c.Apellido ?? c.Apellidos ?? c.apellidos ?? "",
    dui:     c.dui ?? c.DUI ?? c.Dui ?? "",
    fechaNacimiento: c.fechaNacimiento ?? c.Fechadenacimiento ?? c.fecha_nacimiento ?? c.fecha ?? "",
    genero:  c.genero ?? c.Genero ?? "",
    correo:  c.correo ?? c.Correo ?? c.correoElectronico ?? c.correo_electronico ?? c.email ?? ""
  };
}

function buildPayloadFromForm({ nombre, apellido, dui, fechaNacimiento, genero, correo }) {
  // Asegurar exactamente los nombres de campos de la BD
  return { nombre, apellido, dui, fechaNacimiento, genero, correo };
}

// ===============================
// Modales
// ===============================
function abrirModalAgregar() { frmAgregar.reset(); modalAgregar.showModal(); }
function cerrarModalAgregar() { frmAgregar.reset(); modalAgregar.close(); }
function cerrarModalEditar() { frmEditar.reset(); modalEditar.close(); }

// ===============================
// Validaciones
// ===============================
function validarNombre(texto) { return /^[A-Za-zÁÉÍÓÚÑáéíóúñ\s]{2,100}$/.test((texto||"").trim()); }
function validarDUI(dui) { return /^\d{8}-\d{1}$/.test((dui||"").trim()); }
function validarFechaNacimiento(fecha) {
  if (!fecha) return false;
  const f = new Date(fecha), hoy = new Date(), minimo = new Date('1900-01-01');
  f.setHours(0,0,0,0); hoy.setHours(0,0,0,0); minimo.setHours(0,0,0,0);
  return f >= minimo && f <= hoy;
}
function validarGenero(genero) {
  const g = (genero || "").trim().toLowerCase();
  return g === "masculino" || g === "femenino" || g === "otro";
}
function validarCorreo(correo) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((correo || "").trim());
}
function validarFormulario(cli) {
  if (!validarNombre(cli.nombre)) { Swal.fire("Atención", "Nombre inválido.", "warning"); return false; }
  if (!validarNombre(cli.apellido)) { Swal.fire("Atención", "Apellido inválido.", "warning"); return false; }
  if (!validarDUI(cli.dui)) { Swal.fire("Atención", "DUI inválido. Formato: 12345678-9", "warning"); return false; }
  if (!validarFechaNacimiento(cli.fechaNacimiento)) { Swal.fire("Atención", "Fecha de nacimiento inválida.", "warning"); return false; }
  if (!validarGenero(cli.genero)) { Swal.fire("Atención", "Seleccione un género válido.", "warning"); return false; }
  if (!validarCorreo(cli.correo)) { Swal.fire("Atención", "Correo inválido.", "warning"); return false; }
  return true;
}

// ===============================
// Render de tabla + paginación
// ===============================
function mostrarClientes() {
  tablaClientes.innerHTML = "";

  const textoBuscar = (inputBuscar?.value || "").toLowerCase();
  const listaFiltrada = clientes.filter(c => {
    const cadena = `${c.nombre} ${c.apellido} ${c.dui} ${c.fechaNacimiento} ${c.genero} ${c.correo}`.toLowerCase();
    return cadena.includes(textoBuscar);
  });

  const inicio = (paginaActual - 1) * registrosPorPagina;
  const fin = inicio + registrosPorPagina;
  const listaPaginada = listaFiltrada.slice(inicio, fin);

  listaPaginada.forEach(c => {
    tablaClientes.innerHTML += `
      <tr>
        <td>${c.id ?? ""}</td>
        <td>${c.nombre}</td>
        <td>${c.apellido}</td>
        <td>${c.dui}</td>
        <td>${c.fechaNacimiento}</td>
        <td>${c.genero}</td>
        <td>${c.correo}</td>
        <td>
          <button class="btn btn-sm btn-primary me-2 icon-btn editar" data-id="${c.id}" title="Editar">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button class="btn btn-sm btn-danger icon-btn eliminar" data-id="${c.id}" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>`;
  });

  agregarEventosBotones();
  renderizarPaginacion(listaFiltrada.length);
}

function renderizarPaginacion(totalRegistros) {
  contenedorPaginacion.innerHTML = "";
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / registrosPorPagina));

  const crearBoton = (texto, pagina, disabled = false, isActive = false) => {
    const btn = document.createElement("button");
    btn.textContent = texto;
    btn.disabled = disabled;
    btn.classList.add("btn", "btn-sm", "me-1");
    btn.classList.add(isActive ? "btn-primary" : "btn-outline-primary");
    btn.addEventListener("click", () => {
      if (!disabled) {
        paginaActual = pagina;
        mostrarClientes();
      }
    });
    return btn;
  };

  contenedorPaginacion.appendChild(crearBoton("Anterior", Math.max(1, paginaActual - 1), paginaActual === 1));
  for (let i = 1; i <= totalPaginas; i++) {
    contenedorPaginacion.appendChild(crearBoton(String(i), i, false, i === paginaActual));
  }
  contenedorPaginacion.appendChild(crearBoton("Siguiente", Math.min(totalPaginas, paginaActual + 1), paginaActual === totalPaginas));
}

// ===============================
// Carga desde API
// ===============================
async function cargarClientes() {
  try {
    const res = await fetch(API_URL);
    const raw = await res.json();
    clientes = Array.isArray(raw) ? raw.map(normalizar) : [];
    paginaActual = 1;
    mostrarClientes();
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "No se pudieron cargar los clientes.", "error");
  }
}

// ===============================
// Eventos de botones acciones
// ===============================
function agregarEventosBotones() {
  document.querySelectorAll(".editar").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id);
      cargarParaEditar(id);
    });
  });
  document.querySelectorAll(".eliminar").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id);
      eliminarCliente(id);
    });
  });
}

// ===============================
// Crear
// ===============================
frmAgregar?.addEventListener("submit", async e => {
  e.preventDefault();

  const data = {
    nombre: document.getElementById("txtNombre").value.trim(),
    apellido: document.getElementById("txtApellido").value.trim(),
    dui: document.getElementById("txtDUI").value.trim(),
    fechaNacimiento: document.getElementById("txtFecha").value,
    genero: document.getElementById("txtGenero").value.trim(),
    correo: document.getElementById("txtCorreo").value.trim()
  };

  if (!validarFormulario(data)) return;

  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayloadFromForm(data))
    });
    cerrarModalAgregar();
    await cargarClientes();
    Swal.fire("Agregado", "El cliente fue agregado correctamente.", "success");
  } catch (error) {
    console.error(error);
    Swal.fire("Error", "No se pudo agregar el cliente.", "error");
  }
});

// ===============================
// Cargar para editar
// ===============================
function cargarParaEditar(id) {
  const cli = clientes.find(c => c.id === id);
  if (!cli) return;

  document.getElementById("txtIdEditarClientes").value = cli.id;
  document.getElementById("txtNombreEditar").value = cli.nombre;
  document.getElementById("txtApellidoEditar").value = cli.apellido;
  document.getElementById("txtDUIEditar").value = cli.dui;
  document.getElementById("txtFechaEditar").value = cli.fechaNacimiento;
  document.getElementById("txtGeneroEditar").value = cli.genero;
  document.getElementById("txtCorreoEditar").value = cli.correo;

  modalEditar.showModal();
}

// ===============================
// Editar
// ===============================
frmEditar?.addEventListener("submit", async e => {
  e.preventDefault();

  const id = document.getElementById("txtIdEditarClientes").value;
  const data = {
    nombre: document.getElementById("txtNombreEditar").value.trim(),
    apellido: document.getElementById("txtApellidoEditar").value.trim(),
    dui: document.getElementById("txtDUIEditar").value.trim(),
    fechaNacimiento: document.getElementById("txtFechaEditar").value,
    genero: document.getElementById("txtGeneroEditar").value.trim(),
    correo: document.getElementById("txtCorreoEditar").value.trim()
  };

  if (!validarFormulario(data)) return;

  try {
    await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayloadFromForm(data))
    });
    cerrarModalEditar();
    await cargarClientes();
    Swal.fire("Actualizado", "El cliente fue actualizado correctamente.", "success");
  } catch (error) {
    console.error(error);
    Swal.fire("Error", "No se pudo actualizar el cliente.", "error");
  }
});

// ===============================
// Eliminar
// ===============================
async function eliminarCliente(id) {
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
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      await cargarClientes();
      Swal.fire("Eliminado", "El cliente fue eliminado.", "success");
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo eliminar el cliente.", "error");
    }
  }
}

// ===============================
// Filtros y controles UI
// ===============================
inputBuscar?.addEventListener("input", () => {
  paginaActual = 1;
  mostrarClientes();
});

selectRegistros?.addEventListener("change", e => {
  registrosPorPagina = parseInt(e.target.value, 10);
  paginaActual = 1;
  mostrarClientes();
});

// ===============================
// Inicializar (max fecha = hoy)
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  // Limitar fecha de nacimiento a hoy
  const hoyStr = new Date().toISOString().split('T')[0];
  const inAdd = document.getElementById("txtFecha");
  const inEdit = document.getElementById("txtFechaEditar");
  if (inAdd) inAdd.max = hoyStr;
  if (inEdit) inEdit.max = hoyStr;

  cargarClientes();
});

// Exponer funciones por si se llaman desde HTML
window.abrirModalAgregar = abrirModalAgregar;
window.cerrarModalAgregar = cerrarModalAgregar;
window.cerrarModalEditar = cerrarModalEditar;
window.buscarClientes = () => { paginaActual = 1; mostrarClientes(); };

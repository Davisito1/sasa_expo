const API_URL = 'https://retoolapi.dev/PifxKy/data';

const tablaClientes = document.getElementById("tablaClientes");
const frmAgregar = document.getElementById("frmAgregarClientes");
const frmEditar = document.getElementById("frmEditarClientes");

const modalAgregar = document.getElementById("mdAgregarClientes");
const modalEditar = document.getElementById("mdEditarClientes");

const selectRegistros = document.getElementById("registrosPorPagina");
const contenedorPaginacion = document.getElementById("paginacion");
const inputBuscar = document.getElementById("buscar");

// === VARIABLES DE PAGINACIÓN ===
let clientes = [];
let paginaActual = 1;
let registrosPorPagina = parseInt(selectRegistros?.value || 5, 10);

// === MODALES ===
function abrirModalAgregar() { frmAgregar.reset(); modalAgregar.showModal(); }
function cerrarModalAgregar() { frmAgregar.reset(); modalAgregar.close(); }
function cerrarModalEditar() { frmEditar.reset(); modalEditar.close(); }

// === VALIDACIONES ===
function validarNombre(texto) { return /^[A-Za-zÁÉÍÓÚÑáéíóúñ\s]{2,40}$/.test(texto); }
function validarDUI(dui) { return /^\d{8}-\d{1}$/.test(dui); }
function validarFechaNacimiento(fecha) {
  const f = new Date(fecha), hoy = new Date(), minimo = new Date('1900-01-01');
  return f >= minimo && f <= hoy;
}
function validarGenero(genero) {
  const g = genero.trim().toLowerCase();
  return g === "masculino" || g === "femenino" || g === "otro";
}
function validarFormulario(cliente) {
  if (!validarNombre(cliente.Nombres)) { alert("Nombre inválido."); return false; }
  if (!validarNombre(cliente.Apellidos)) { alert("Apellido inválido."); return false; }
  if (!validarDUI(cliente.DUI)) { alert("DUI inválido."); return false; }
  if (!validarFechaNacimiento(cliente.Fechadenacimiento)) { alert("Fecha de nacimiento inválida."); return false; }
  if (!validarGenero(cliente.Genero)) { alert("Género debe ser Masculino, Femenino u Otro."); return false; }
  return true;
}

// === MOSTRAR CLIENTES CON PAGINACIÓN ===
function mostrarClientes() {
  tablaClientes.innerHTML = "";

  const textoBuscar = inputBuscar?.value.toLowerCase() || "";
  const listaFiltrada = clientes.filter(c =>
    `${c.Nombres} ${c.Apellidos} ${c.DUI} ${c.Fechadenacimiento} ${c.Genero}`.toLowerCase().includes(textoBuscar)
  );

  const inicio = (paginaActual - 1) * registrosPorPagina;
  const fin = inicio + registrosPorPagina;
  const listaPaginada = listaFiltrada.slice(inicio, fin);

  listaPaginada.forEach(c => {
    tablaClientes.innerHTML += `
      <tr>
        <td>${c.id}</td>
        <td>${c.Nombres}</td>
        <td>${c.Apellidos}</td>
        <td>${c.DUI}</td>
        <td>${c.Fechadenacimiento}</td>
        <td>${c.Genero}</td>
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

// === RENDERIZAR PAGINACIÓN ===
function renderizarPaginacion(totalRegistros) {
  contenedorPaginacion.innerHTML = "";
  const totalPaginas = Math.ceil(totalRegistros / registrosPorPagina);

  const crearBoton = (texto, pagina, disabled = false, isActive = false) => {
    const btn = document.createElement("button");
    btn.textContent = texto;
    btn.disabled = disabled;
    btn.classList.add("btn", "btn-sm", "me-1");

    if (isActive) btn.classList.add("btn-primary");
    else btn.classList.add("btn-outline-primary");

    btn.addEventListener("click", () => {
      if (!disabled) {
        paginaActual = pagina;
        mostrarClientes();
      }
    });
    return btn;
  };

  // Botón Anterior
  contenedorPaginacion.appendChild(crearBoton("Anterior", paginaActual - 1, paginaActual === 1));

  // Botones numéricos
  for (let i = 1; i <= totalPaginas; i++) {
    contenedorPaginacion.appendChild(crearBoton(i, i, false, i === paginaActual));
  }

  // Botón Siguiente
  contenedorPaginacion.appendChild(crearBoton("Siguiente", paginaActual + 1, paginaActual === totalPaginas));
}

// === CARGAR CLIENTES DESDE API ===
async function cargarClientes() {
  try {
    const res = await fetch(API_URL);
    clientes = await res.json();
    paginaActual = 1;
    mostrarClientes();
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "No se pudieron cargar los clientes.", "error");
  }
}

// === EVENTOS BOTONES ===
function agregarEventosBotones() {
  document.querySelectorAll(".editar").forEach(btn => {
    btn.addEventListener("click", () => cargarParaEditar(parseInt(btn.dataset.id)));
  });
  document.querySelectorAll(".eliminar").forEach(btn => {
    btn.addEventListener("click", () => eliminarCliente(parseInt(btn.dataset.id)));
  });
}

// === AGREGAR CLIENTE ===
frmAgregar.addEventListener("submit", async e => {
  e.preventDefault();
  const nuevo = {
    Nombres: document.getElementById("txtNombres").value.trim(),
    Apellidos: document.getElementById("txtApellidos").value.trim(),
    DUI: document.getElementById("txtDUI").value.trim(),
    Fechadenacimiento: document.getElementById("txtFecha").value,
    Genero: document.getElementById("txtGenero").value.trim(),
  };
  if (!validarFormulario(nuevo)) return;

  try {
    await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nuevo) });
    cerrarModalAgregar();
    cargarClientes();
    Swal.fire("Agregado", "El cliente fue agregado correctamente.", "success");
  } catch (error) {
    console.error(error);
    Swal.fire("Error", "No se pudo agregar el cliente.", "error");
  }
});

// === CARGAR CLIENTE PARA EDITAR ===
function cargarParaEditar(id) {
  const cliente = clientes.find(c => c.id === id);
  if (!cliente) return;

  document.getElementById("txtIdEditarClientes").value = cliente.id;
  document.getElementById("txtNombreEditar").value = cliente.Nombres;
  document.getElementById("txtApellidoEditar").value = cliente.Apellidos;
  document.getElementById("txtDUIEditar").value = cliente.DUI;
  document.getElementById("txtFechaEditar").value = cliente.Fechadenacimiento;
  document.getElementById("txtGeneroEditar").value = cliente.Genero;

  modalEditar.showModal();
}

// === EDITAR CLIENTE ===
frmEditar.addEventListener("submit", async e => {
  e.preventDefault();
  const id = document.getElementById("txtIdEditarClientes").value;
  const editado = {
    Nombres: document.getElementById("txtNombreEditar").value.trim(),
    Apellidos: document.getElementById("txtApellidoEditar").value.trim(),
    DUI: document.getElementById("txtDUIEditar").value.trim(),
    Fechadenacimiento: document.getElementById("txtFechaEditar").value,
    Genero: document.getElementById("txtGeneroEditar").value.trim(),
  };
  if (!validarFormulario(editado)) return;

  try {
    await fetch(`${API_URL}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editado) });
    cerrarModalEditar();
    cargarClientes();
    Swal.fire("Actualizado", "El cliente fue actualizado correctamente.", "success");
  } catch (error) {
    console.error(error);
    Swal.fire("Error", "No se pudo actualizar el cliente.", "error");
  }
});

// === ELIMINAR CLIENTE ===
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
      cargarClientes();
      Swal.fire("Eliminado", "El cliente fue eliminado.", "success");
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo eliminar el cliente.", "error");
    }
  }
}

// === EVENTO: BUSCAR ===
inputBuscar?.addEventListener("input", () => {
  paginaActual = 1;
  mostrarClientes();
});

// === EVENTO: CAMBIAR REGISTROS POR PÁGINA ===
selectRegistros?.addEventListener("change", e => {
  registrosPorPagina = parseInt(e.target.value, 10);
  paginaActual = 1;
  mostrarClientes();
});

// === INICIALIZAR ===
document.addEventListener("DOMContentLoaded", cargarClientes);

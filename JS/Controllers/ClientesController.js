// ===============================
// ClientesController.js
// ===============================
import {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente
} from "../Services/ClientesService.js";

// ===============================
// ELEMENTOS DOM
// ===============================
const tablaClientes   = document.getElementById("tablaClientes");
const pagWrap         = document.getElementById("paginacion");
const selectPageSize  = document.getElementById("registrosPorPagina");
const inputBuscar     = document.getElementById("buscar");

const frmCliente      = document.getElementById("clienteForm");
const modalCliente    = new bootstrap.Modal(document.getElementById("clienteModal"));
const modalTitle      = document.getElementById("clienteModalLabel");

const inputId         = document.getElementById("clienteId");
const inputNombre     = document.getElementById("nombre");
const inputApellido   = document.getElementById("apellido");
const inputDui        = document.getElementById("dui");
const inputFecha      = document.getElementById("fechaNacimiento");
const inputGenero     = document.getElementById("genero");
const inputCorreo     = document.getElementById("correo");

// ===============================
// VARIABLES GLOBALES
// ===============================
let paginaActual = 0;
let tamPagina    = parseInt(selectPageSize.value, 10);
let filtroTexto  = "";

// ===============================
// CARGAR CLIENTES
// ===============================
async function cargarClientes(page = 0) {
  try {
    const { content, totalPages } = await getClientes(
      page,
      tamPagina,
      filtroTexto,
      "idCliente",   // 👈 siempre ordena por ID
      "asc"          // 👈 siempre en ascendente
    );

    renderClientes(content);
    renderPaginacion(totalPages, page);
  } catch (err) {
    console.error("Error cargando clientes:", err);
    Swal.fire("Error", "No se pudieron cargar los clientes", "error");
  }
}

// ===============================
// RENDERIZAR TABLA
// ===============================
function renderClientes(clientes) {
  tablaClientes.innerHTML = "";
  if (!clientes || clientes.length === 0) {
    tablaClientes.innerHTML = `<tr><td colspan="8" class="text-center">No hay clientes</td></tr>`;
    return;
  }

  clientes.forEach(cli => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cli.id}</td>
      <td>${cli.nombre}</td>
      <td>${cli.apellido}</td>
      <td>${cli.dui}</td>
      <td>${cli.fechaNacimiento}</td>
      <td>${cli.genero}</td>
      <td>${cli.correo}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-primary me-2 icon-btn" data-id="${cli.id}" data-action="edit">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="btn btn-sm btn-danger icon-btn" data-id="${cli.id}" data-action="delete">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tablaClientes.appendChild(tr);
  });
}

// ===============================
// RENDERIZAR PAGINACIÓN
// ===============================
function renderPaginacion(totalPages, currentPage) {
  pagWrap.innerHTML = "";
  for (let i = 0; i < totalPages; i++) {
    const btn = document.createElement("button");
    btn.className = `btn btn-sm ${i === currentPage ? "btn-primary" : "btn-outline-primary"}`;
    btn.textContent = i + 1;
    btn.addEventListener("click", () => {
      paginaActual = i;
      cargarClientes(paginaActual);
    });
    pagWrap.appendChild(btn);
  }
}

// ===============================
// FORMULARIO (CREAR / ACTUALIZAR)
// ===============================
frmCliente.addEventListener("submit", async (e) => {
  e.preventDefault();

  const cliente = {
    id: inputId.value || null,
    nombre: inputNombre.value.trim(),
    apellido: inputApellido.value.trim(),
    dui: inputDui.value.trim(),
    fechaNacimiento: inputFecha.value,
    genero: inputGenero.value,
    correo: inputCorreo.value.trim()
  };

  try {
    if (cliente.id) {
      await updateCliente(cliente.id, cliente);
      Swal.fire("Actualizado", "Cliente actualizado correctamente", "success");
    } else {
      await createCliente(cliente);
      Swal.fire("Creado", "Cliente creado correctamente", "success");
    }

    modalCliente.hide();
    frmCliente.reset();
    cargarClientes(paginaActual);
  } catch (err) {
    console.error("Error guardando cliente:", err);
    Swal.fire("Error", "No se pudo guardar el cliente", "error");
  }
});

// ===============================
// EVENTOS TABLA (EDITAR/ELIMINAR)
// ===============================
tablaClientes.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === "edit") {
    modalTitle.textContent = "Editar Cliente";
    try {
      const cliente = await getClienteById(id);
      if (cliente) {
        inputId.value       = cliente.id;
        inputNombre.value   = cliente.nombre;
        inputApellido.value = cliente.apellido;
        inputDui.value      = cliente.dui;
        inputFecha.value    = cliente.fechaNacimiento;
        inputGenero.value   = cliente.genero;
        inputCorreo.value   = cliente.correo;
        modalCliente.show();
      }
    } catch (err) {
      console.error("Error cargando cliente:", err);
      Swal.fire("Error", "No se pudo cargar el cliente", "error");
    }
  } else if (action === "delete") {
    Swal.fire({
      title: "¿Eliminar cliente?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await deleteCliente(id);
          Swal.fire("Eliminado", "Cliente eliminado correctamente", "success");
          cargarClientes(paginaActual);
        } catch (err) {
          console.error("Error eliminando cliente:", err);
          Swal.fire("Error", "No se pudo eliminar el cliente", "error");
        }
      }
    });
  }
});

// ===============================
// EVENTOS EXTRA
// ===============================
selectPageSize.addEventListener("change", () => {
  tamPagina = parseInt(selectPageSize.value, 10);
  paginaActual = 0;
  cargarClientes(paginaActual);
});

inputBuscar.addEventListener("input", () => {
  filtroTexto = inputBuscar.value.trim();
  paginaActual = 0;
  cargarClientes(paginaActual);
});

// ===============================
// INICIO
// ===============================
cargarClientes(paginaActual);

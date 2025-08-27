// ==================== IMPORTAR SERVICIOS ====================
import {
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente
} from "../Services/ClientesService.js";

// ==================== DOM ====================
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

let paginaActual = 0;
let tamPagina    = parseInt(selectPageSize.value, 10);
let filtroTexto  = "";

// ==================== CARGAR CLIENTES ====================
async function cargarClientes(page = 0) {
  try {
    const { content, totalPages } = await getClientes(page, tamPagina, filtroTexto);

    renderClientes(content);
    renderPaginacion(totalPages, page);

  } catch (error) {
    console.error("Error cargando clientes:", error);
  }
}

// ==================== RENDERIZAR CLIENTES ====================
function renderClientes(clientes) {
  tablaClientes.innerHTML = "";

  clientes.forEach(cliente => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cliente.id}</td>
      <td>${cliente.nombre}</td>
      <td>${cliente.apellido}</td>
      <td>${cliente.dui}</td>
      <td>${cliente.fechaNacimiento}</td>
      <td>${cliente.genero}</td>
      <td>${cliente.correo}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-primary me-2 icon-btn" data-id="${cliente.id}" data-action="edit">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="btn btn-sm btn-danger icon-btn" data-id="${cliente.id}" data-action="delete">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tablaClientes.appendChild(tr);
  });
}

// ==================== RENDERIZAR PAGINACIÓN ====================
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

// ==================== FORMULARIO ====================
frmCliente.addEventListener("submit", async (e) => {
  e.preventDefault();

  const clienteData = {
    id: inputId.value || null,
    nombre: inputNombre.value.trim(),
    apellido: inputApellido.value.trim(),
    dui: inputDui.value.trim(),
    fechaNacimiento: inputFecha.value,
    genero: inputGenero.value,
    correo: inputCorreo.value.trim()
    // 🔹 No enviamos contrasena en la web
  };

  try {
    if (clienteData.id) {
      await updateCliente(clienteData.id, clienteData);
      Swal.fire("Actualizado", "Cliente actualizado correctamente", "success");
    } else {
      await createCliente(clienteData);
      Swal.fire("Creado", "Cliente creado correctamente", "success");
    }

    modalCliente.hide();
    frmCliente.reset();
    cargarClientes(paginaActual);

  } catch (error) {
    console.error("Error guardando cliente:", error);
    Swal.fire("Error", "No se pudo guardar el cliente", "error");
  }
});

// ==================== TABLA EVENTOS ====================
tablaClientes.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === "edit") {
    modalTitle.textContent = "Editar Cliente";
    const { content } = await getClientes(paginaActual, tamPagina, filtroTexto);
    const cliente = content.find(c => c.id == id);

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

  } else if (action === "delete") {
    Swal.fire({
      title: "¿Eliminar cliente?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteCliente(id);
          Swal.fire("Eliminado", "Cliente eliminado correctamente", "success");
          cargarClientes(paginaActual);
        } catch (error) {
          console.error("Error eliminando cliente:", error);
          Swal.fire("Error", "No se pudo eliminar el cliente", "error");
        }
      }
    });
  }
});

// ==================== EVENTOS DE BUSCAR Y SELECT ====================
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

// ==================== INICIO ====================
cargarClientes(paginaActual);

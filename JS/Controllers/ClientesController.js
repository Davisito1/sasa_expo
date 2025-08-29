// ==================== IMPORTAR SERVICIOS ====================
// Importamos funciones CRUD desde el servicio de clientes
import {
  getClientes,    // obtiene clientes paginados (con filtro y tamaño de página)
  createCliente,  // crea un nuevo cliente
  updateCliente,  // actualiza un cliente existente
  deleteCliente   // elimina un cliente
} from "../Services/ClientesService.js";

// ==================== DOM ====================
// Referencias a elementos de la interfaz
const tablaClientes   = document.getElementById("tablaClientes");      // tabla donde se muestran los clientes
const pagWrap         = document.getElementById("paginacion");         // contenedor de botones de paginación
const selectPageSize  = document.getElementById("registrosPorPagina"); // select para elegir cantidad por página
const inputBuscar     = document.getElementById("buscar");             // input para filtrar clientes

// Modal y formulario
const frmCliente      = document.getElementById("clienteForm");
const modalCliente    = new bootstrap.Modal(document.getElementById("clienteModal"));
const modalTitle      = document.getElementById("clienteModalLabel");

// Inputs del formulario
const inputId         = document.getElementById("clienteId");
const inputNombre     = document.getElementById("nombre");
const inputApellido   = document.getElementById("apellido");
const inputDui        = document.getElementById("dui");
const inputFecha      = document.getElementById("fechaNacimiento");
const inputGenero     = document.getElementById("genero");
const inputCorreo     = document.getElementById("correo");

// ==================== VARIABLES GLOBALES ====================
// Controlan paginación y filtros
let paginaActual = 0;                               // página actual
let tamPagina    = parseInt(selectPageSize.value, 10); // registros por página
let filtroTexto  = "";                              // texto de búsqueda

// ==================== CARGAR CLIENTES ====================
// Consulta clientes a la API y actualiza tabla + paginación
async function cargarClientes(page = 0) {
  try {
    const { content, totalPages } = await getClientes(page, tamPagina, filtroTexto);
    renderClientes(content);             // dibuja tabla
    renderPaginacion(totalPages, page);  // dibuja botones de páginas
  } catch (error) {
    console.error("Error cargando clientes:", error);
  }
}

// ==================== RENDERIZAR CLIENTES ====================
// Dibuja las filas de la tabla de clientes
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
        <!-- Botón editar -->
        <button class="btn btn-sm btn-primary me-2 icon-btn" data-id="${cliente.id}" data-action="edit">
          <i class="bi bi-pencil-square"></i>
        </button>
        <!-- Botón eliminar -->
        <button class="btn btn-sm btn-danger icon-btn" data-id="${cliente.id}" data-action="delete">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tablaClientes.appendChild(tr);
  });
}

// ==================== RENDERIZAR PAGINACIÓN ====================
// Genera botones para cambiar de página
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
// Maneja creación y edición de clientes
frmCliente.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Construcción del objeto cliente
  const clienteData = {
    id: inputId.value || null,
    nombre: inputNombre.value.trim(),
    apellido: inputApellido.value.trim(),
    dui: inputDui.value.trim(),
    fechaNacimiento: inputFecha.value,
    genero: inputGenero.value,
    correo: inputCorreo.value.trim()
    // 🔹 Nota: no enviamos contraseña desde esta interfaz
  };

  try {
    if (clienteData.id) {
      // Si hay ID → actualizar
      await updateCliente(clienteData.id, clienteData);
      Swal.fire("Actualizado", "Cliente actualizado correctamente", "success");
    } else {
      // Si no hay ID → crear
      await createCliente(clienteData);
      Swal.fire("Creado", "Cliente creado correctamente", "success");
    }

    modalCliente.hide();   // cerrar modal
    frmCliente.reset();    // limpiar formulario
    cargarClientes(paginaActual); // recargar tabla
  } catch (error) {
    console.error("Error guardando cliente:", error);
    Swal.fire("Error", "No se pudo guardar el cliente", "error");
  }
});

// ==================== TABLA EVENTOS ====================
// Detecta clicks en botones de la tabla (editar / eliminar)
tablaClientes.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === "edit") {
    // ----------- Editar Cliente -----------
    modalTitle.textContent = "Editar Cliente";
    const { content } = await getClientes(paginaActual, tamPagina, filtroTexto);
    const cliente = content.find(c => c.id == id);

    if (cliente) {
      // Cargar datos en formulario
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
    // ----------- Eliminar Cliente -----------
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
// Cambio de cantidad de registros por página
selectPageSize.addEventListener("change", () => {
  tamPagina = parseInt(selectPageSize.value, 10);
  paginaActual = 0;
  cargarClientes(paginaActual);
});

// Filtro en buscador
inputBuscar.addEventListener("input", () => {
  filtroTexto = inputBuscar.value.trim();
  paginaActual = 0;
  cargarClientes(paginaActual);
});

// ==================== INICIO ====================
// Al cargar la página, inicializa la tabla de clientes
cargarClientes(paginaActual);

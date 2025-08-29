// ======================= IMPORTACIONES =======================
// Funciones del servicio de Citas (CRUD + paginado)
import {
  getCitasPaginado,  // obtiene citas con paginación
  getCitaById,       // obtiene una cita específica por ID
  createCita,        // crea una nueva cita
  updateCita,        // actualiza una cita existente
  deleteCita         // elimina una cita
} from "../Services/CitasService.js";

// Función del servicio de Clientes (para asociar cliente a cita)
import { getClientes } from "../Services/ClientesService.js";

// ======================= REFERENCIAS AL DOM =======================
const tablaCitas = document.getElementById("tablaCitas");        // tabla donde se muestran citas
const pagWrap = document.getElementById("paginacion");           // contenedor de paginación
const selectPageSize = document.getElementById("registrosPorPagina"); // select con tamaño de página

const citaForm = document.getElementById("citaForm");            // formulario del modal
const citaModal = new bootstrap.Modal(document.getElementById("citaModal")); // modal Bootstrap
const modalLabel = document.getElementById("citaModalLabel");    // título del modal

// Inputs dentro del formulario del modal
const inputId = document.getElementById("citaId");
const inputFecha = document.getElementById("fecha");
const inputHora = document.getElementById("hora");
const selectEstado = document.getElementById("estado");
const selectCliente = document.getElementById("cliente");

// ======================= VARIABLES GLOBALES =======================
let citasCache = [];     // almacena citas en memoria temporal
let clientesCache = [];  // almacena clientes cargados en memoria
let paginaActual = 1;    // página actual para paginación
let tamPagina = parseInt(selectPageSize.value, 10); // tamaño de página elegido

// ======================= FUNCIONES AUXILIARES =======================
// Normaliza la respuesta de la API (dependiendo cómo venga la data)
function parseResponse(apiResponse) {
  if (Array.isArray(apiResponse)) return apiResponse;
  if (apiResponse?.data?.content) return apiResponse.data.content;
  if (apiResponse?.content) return apiResponse.content;
  if (apiResponse?.data) return apiResponse.data;
  return [];
}

// Carga clientes y los coloca en el select del formulario
async function cargarClientes() {
  try {
    const res = await getClientes(0, 100); // pide hasta 100 clientes
    clientesCache = parseResponse(res);

    // Resetea las opciones y agrega placeholder
    selectCliente.innerHTML = '<option disabled selected value="">Seleccione cliente</option>';

    // Recorre clientes y los agrega como opción
    clientesCache.forEach(cli => {
      const opt = document.createElement("option");
      opt.value = cli.id || cli.idCliente;
      opt.textContent = `${cli.nombre} ${cli.apellido}`;
      selectCliente.appendChild(opt);
    });
  } catch (err) {
    console.error("Error al cargar clientes:", err);
    Swal.fire("Error", "No se pudieron cargar los clientes", "error");
  }
}

// Renderiza las filas de la tabla con citas
function renderTabla(citas) {
  tablaCitas.innerHTML = "";

  // Si no hay registros, muestra mensaje
  if (!citas || citas.length === 0) {
    tablaCitas.innerHTML = `<tr><td colspan="6" class="text-center">No hay registros</td></tr>`;
    return;
  }

  // Recorre cada cita y crea su fila
  citas.forEach(cita => {
    let nombreCliente = "—";

    // Intenta obtener nombre del cliente desde objeto o cache
    if (cita.cliente?.nombre) {
      nombreCliente = `${cita.cliente.nombre} ${cita.cliente.apellido ?? ""}`;
    } else if (cita.idCliente) {
      const c = clientesCache.find(cli => (cli.id || cli.idCliente) === cita.idCliente);
      if (c) nombreCliente = `${c.nombre} ${c.apellido}`;
    }

    // Crear fila
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cita.id}</td>
      <td>${cita.fecha}</td>
      <td>${cita.hora}</td>
      <td>${cita.estado}</td>
      <td>${nombreCliente}</td>
      <td class="text-center">
        <!-- Botón Editar -->
        <button class="btn btn-sm btn-primary me-2 icon-btn" onclick="editarCita(${cita.id})">
          <i class="bi bi-pencil-square"></i>
        </button>
        <!-- Botón Eliminar -->
        <button class="btn btn-sm btn-danger icon-btn" onclick="eliminarCita(${cita.id})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tablaCitas.appendChild(tr);
  });
}

// Renderiza los botones de paginación
function renderPaginacion(totalPaginas) {
  pagWrap.innerHTML = "";
  for (let p = 1; p <= totalPaginas; p++) {
    const btn = document.createElement("button");
    btn.className = `btn btn-sm ${p === paginaActual ? "btn-primary" : "btn-outline-primary"}`;
    btn.textContent = p;
    btn.onclick = () => {
      paginaActual = p;
      cargarTabla();
    };
    pagWrap.appendChild(btn);
  }
}

// Carga citas en la tabla con paginación
async function cargarTabla(reset = false) {
  const res = await getCitasPaginado(paginaActual - 1, tamPagina); // la API empieza en 0
  citasCache = parseResponse(res);
  if (reset) paginaActual = 1;
  renderTabla(citasCache);
  renderPaginacion(res.totalPages ?? 1);
}

// ======================= FUNCIONES CRUD =======================
// Abrir modal en modo "Agregar"
window.abrirModalAgregar = async function () {
  citaForm.reset();         // limpia formulario
  inputId.value = "";       // ID vacío (nuevo)
  modalLabel.textContent = "Agregar Cita";
  const hoy = new Date().toISOString().split("T")[0];
  inputFecha.setAttribute("min", hoy); // no se puede elegir fecha pasada
  await cargarClientes();   // carga clientes en select
  citaModal.show();         // muestra modal
};

// Abrir modal en modo "Editar"
window.editarCita = async function (id) {
  try {
    const cita = await getCitaById(id); // busca cita por ID
    if (!cita) return Swal.fire("Error","No se encontró la cita","error");

    citaForm.reset();
    modalLabel.textContent = "Editar Cita";
    inputId.value = cita.id;

    // Controla fecha mínima
    const hoy = new Date().toISOString().split("T")[0];
    inputFecha.setAttribute("min", hoy);
    inputFecha.value = (cita.fecha < hoy) ? hoy : cita.fecha;

    // Rellena el resto de campos
    inputHora.value = cita.hora;
    selectEstado.value = cita.estado;

    await cargarClientes();
    selectCliente.value = cita.idCliente ?? cita.cliente?.idCliente;

    citaModal.show();
  } catch (err) {
    console.error("Error al cargar cita:", err);
    Swal.fire("Error", "No se pudo cargar la cita", "error");
  }
};

// Eliminar una cita
window.eliminarCita = async function (id) {
  // Confirmación con SweetAlert
  const ok = await Swal.fire({
    title: "¿Eliminar cita?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  }).then(r => r.isConfirmed);

  if (!ok) return;

  try {
    await deleteCita(id); // elimina
    Swal.fire("Eliminada", "Cita borrada", "success");
    cargarTabla(true);    // recarga tabla
  } catch (err) {
    console.error("Error al eliminar cita:", err);
    Swal.fire("Error", "No se pudo eliminar", "error");
  }
};

// ======================= GUARDAR (CREAR / EDITAR) =======================
citaForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const hoy = new Date().toISOString().split("T")[0];

  // Validaciones de campos obligatorios
  if (!inputFecha.value || inputFecha.value < hoy) 
    return Swal.fire("Error", "Seleccione una fecha válida", "error");
  
  if (!inputHora.value) 
    return Swal.fire("Error", "Seleccione una hora", "error");

  const horaNum = parseInt(inputHora.value.split(":")[0], 10);
  if (horaNum < 7 || horaNum > 16) 
    return Swal.fire("Error", "La hora debe estar entre 07:00 y 16:00", "error");

  if (!selectEstado.value) 
    return Swal.fire("Error", "Seleccione un estado", "error");

  if (!selectCliente.value) 
    return Swal.fire("Error", "Seleccione un cliente", "error");

  // Objeto DTO que se manda al backend
  const dto = {
    fecha: inputFecha.value,
    hora: inputHora.value,
    estado: selectEstado.value,
    idCliente: parseInt(selectCliente.value, 10)
  };

  try {
    if (inputId.value) {
      // Si hay ID → actualizar
      await updateCita(parseInt(inputId.value, 10), dto);
      Swal.fire("Éxito", "Cita actualizada", "success");
    } else {
      // Si no hay ID → crear
      await createCita(dto);
      Swal.fire("Éxito", "Cita registrada", "success");
    }
    citaModal.hide();       // cierra modal
    await cargarClientes(); // recarga clientes
    await cargarTabla(true);// recarga tabla
  } catch (err) {
    console.error("Error al guardar cita:", err);
    Swal.fire("Error", "No se pudo guardar la cita", "error");
  }
});

// ======================= EVENTOS EXTRA =======================
// Cambiar tamaño de página
selectPageSize.addEventListener("change", () => {
  tamPagina = parseInt(selectPageSize.value, 10);
  paginaActual = 1;
  cargarTabla(true);
});

// Inicializar al cargar la página
document.addEventListener("DOMContentLoaded", async () => {
  await cargarClientes();
  await cargarTabla(true);
});

import {
  getCitasPaginado,
  getCitaById,
  createCita,
  updateCita,
  deleteCita
} from "../Services/CitasService.js";
import { getClientes } from "../Services/ClientesService.js";

// ======================= REFERENCIAS AL DOM =======================
const tablaCitas = document.getElementById("tablaCitas");
const pagWrap = document.getElementById("paginacion");
const selectPageSize = document.getElementById("registrosPorPagina");

const citaForm = document.getElementById("citaForm");
const citaModal = new bootstrap.Modal(document.getElementById("citaModal"));
const modalLabel = document.getElementById("citaModalLabel");

const inputId = document.getElementById("citaId");
const inputFecha = document.getElementById("fecha");
const inputHora = document.getElementById("hora");
const selectEstado = document.getElementById("estado");
const selectCliente = document.getElementById("cliente");

// ======================= VARIABLES =======================
let citasCache = [];
let clientesCache = [];
let paginaActual = 1;
let tamPagina = parseInt(selectPageSize.value, 10);

// ======================= FUNCIONES AUXILIARES =======================
function parseResponse(apiResponse) {
  if (Array.isArray(apiResponse)) return apiResponse;
  if (apiResponse?.data?.content) return apiResponse.data.content;
  if (apiResponse?.content) return apiResponse.content;
  if (apiResponse?.data) return apiResponse.data;
  return [];
}

async function cargarClientes() {
  try {
    const res = await getClientes(0, 100);
    clientesCache = parseResponse(res);
    selectCliente.innerHTML = '<option disabled selected value="">Seleccione cliente</option>';
    clientesCache.forEach(cli => {
      const opt = document.createElement("option");
      opt.value = cli.id || cli.idCliente;
      opt.textContent = `${cli.nombre} ${cli.apellido}`;
      selectCliente.appendChild(opt);
    });
  } catch (err) {
    console.error("Error al cargar clientes:", err);
    Swal.fire("Error", "No se pudieron cargar las citas", "error");
  }
}

function renderTabla(citas) {
  tablaCitas.innerHTML = "";
  if (!citas || citas.length === 0) {
    tablaCitas.innerHTML = `<tr><td colspan="6" class="text-center">No hay registros</td></tr>`;
    return;
  }
  citas.forEach(cita => {
    let nombreCliente = "—";
    if (cita.cliente?.nombre) {
      nombreCliente = `${cita.cliente.nombre} ${cita.cliente.apellido ?? ""}`;
    } else if (cita.idCliente) {
      const c = clientesCache.find(cli => (cli.id || cli.idCliente) === cita.idCliente);
      if (c) nombreCliente = `${c.nombre} ${c.apellido}`;
    }
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cita.id}</td>
      <td>${cita.fecha}</td>
      <td>${cita.hora}</td>
      <td>${cita.estado}</td>
      <td>${nombreCliente}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-primary me-2 icon-btn" onclick="editarCita(${cita.id})">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="btn btn-sm btn-danger icon-btn" onclick="eliminarCita(${cita.id})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tablaCitas.appendChild(tr);
  });
}

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

async function cargarTabla(reset = false) {
  const res = await getCitasPaginado(paginaActual - 1, tamPagina);
  citasCache = parseResponse(res);
  if (reset) paginaActual = 1;
  renderTabla(citasCache);
  renderPaginacion(res.totalPages ?? 1);
}

// ======================= CRUD =======================
window.abrirModalAgregar = async function () {
  citaForm.reset();
  inputId.value = "";
  modalLabel.textContent = "Agregar Cita";
  const hoy = new Date().toISOString().split("T")[0];
  inputFecha.setAttribute("min", hoy);
  await cargarClientes();
  citaModal.show();
};

window.editarCita = async function (id) {
  try {
    const cita = await getCitaById(id);
    if (!cita) return Swal.fire("Error", "No se encontró la cita", "error");

    citaForm.reset();
    modalLabel.textContent = "Editar Cita";
    inputId.value = cita.id;

    const hoy = new Date().toISOString().split("T")[0];
    inputFecha.setAttribute("min", hoy);
    inputFecha.value = (cita.fecha < hoy) ? hoy : cita.fecha;

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

window.eliminarCita = async function (id) {
  const ok = await Swal.fire({
    title: "¿Eliminar cita?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  }).then(r => r.isConfirmed);
  if (!ok) return;

  try {
    await deleteCita(id);
    Swal.fire("Eliminada", "Cita borrada", "success");
    cargarTabla(true);
  } catch (err) {
    console.error("Error al eliminar cita:", err);
    Swal.fire("Error", "No se pudo eliminar", "error");
  }
};

// ======================= GUARDAR (CREAR / EDITAR) =======================
citaForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const hoy = new Date().toISOString().split("T")[0];

  if (!inputFecha.value || inputFecha.value < hoy) 
    return Swal.fire("Error", "Seleccione una fecha válida", "error");

  if (!inputHora.value) 
    return Swal.fire("Error", "Seleccione una hora", "error");

  // ✅ Validación robusta de hora
  const [h, m] = inputHora.value.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) {
    return Swal.fire("Error", "Formato de hora inválido", "error");
  }
  if (h < 7 || h > 16 || (h === 16 && m > 0)) {
    return Swal.fire("Error", "La hora debe estar entre 07:00 y 16:00", "error");
  }
  if (m !== 0 && m !== 30) {
    return Swal.fire("Error", "La hora debe estar en intervalos de 30 minutos (ej: 07:00, 07:30, 08:00...)", "error");
  }

  if (!selectEstado.value) 
    return Swal.fire("Error", "Seleccione un estado", "error");

  if (!selectCliente.value) 
    return Swal.fire("Error", "Seleccione un cliente", "error");

  const dto = {
    fecha: inputFecha.value,
    hora: inputHora.value,
    estado: selectEstado.value,
    idCliente: parseInt(selectCliente.value, 10)
  };

  try {
    if (inputId.value) {
      await updateCita(parseInt(inputId.value, 10), dto);
      Swal.fire("Éxito", "Cita actualizada", "success");
    } else {
      await createCita(dto);
      Swal.fire("Éxito", "Cita registrada", "success");
    }
    citaModal.hide();
    await cargarClientes();
    await cargarTabla(true);
  } catch (err) {
    console.error("Error al guardar cita:", err);
    Swal.fire("Error", "No se pudo guardar la cita", "error");
  }
});

// ======================= EVENTOS EXTRA =======================
selectPageSize.addEventListener("change", () => {
  tamPagina = parseInt(selectPageSize.value, 10);
  paginaActual = 1;
  cargarTabla(true);
});

document.addEventListener("DOMContentLoaded", async () => {
  await cargarClientes();
  await cargarTabla(true);
});

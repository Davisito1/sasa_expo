// ===============================
// CitasController.js
// ===============================
import {
  getCitasPaginado,
  getCitaById,
  createCita,
  updateCita,
  deleteCita
} from "../Services/CitasService.js";

import { getClientes } from "../Services/ClientesService.js";
import { getVehiculos } from "../Services/VehiculosServices.js";

// ======================= DOM =======================
const tablaCitas = document.getElementById("tablaCitas");
const pagWrap = document.getElementById("paginacion");
const selectPageSize = document.getElementById("registrosPorPagina");

const citaModal = new bootstrap.Modal(document.getElementById("citaModal"));
const modalLabel = document.getElementById("citaModalLabel");

const citaForm = document.getElementById("citaForm"); // ✅ formulario global

const inputId = document.getElementById("citaId");
const inputFecha = document.getElementById("fecha");
const inputHora = document.getElementById("hora");
const selectEstado = document.getElementById("estado");
const selectCliente = document.getElementById("cliente");
const selectVehiculo = document.getElementById("vehiculo");
const selectServicio = document.getElementById("tipoServicio");
const inputDescripcion = document.getElementById("descripcion");

// ======================= VARIABLES =======================
let citasCache = [];
let clientesCache = [];
let vehiculosCache = [];
let paginaActual = 1;
let tamPagina = parseInt(selectPageSize.value, 10);

// ======================= HELPERS =======================
function toAmPm(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function to24h(time12) {
  if (!time12) return "";
  const match = time12.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return "";
  let [_, hh, mm, ampm] = match;
  hh = parseInt(hh, 10);
  if (ampm.toUpperCase() === "PM" && hh < 12) hh += 12;
  if (ampm.toUpperCase() === "AM" && hh === 12) hh = 0;
  return `${hh.toString().padStart(2, "0")}:${mm}`;
}

function parseResponse(apiResponse) {
  if (Array.isArray(apiResponse)) return apiResponse;
  if (apiResponse?.data?.content) return apiResponse.data.content;
  if (apiResponse?.content) return apiResponse.content;
  if (apiResponse?.data) return apiResponse.data;
  return [];
}

// ======================= COMBOS =======================
async function cargarClientes(selectedId = null) {
  const res = await getClientes(0, 100);
  clientesCache = parseResponse(res);
  selectCliente.innerHTML = '<option disabled value="">Seleccione cliente</option>';
  clientesCache.forEach(cli => {
    const opt = document.createElement("option");
    opt.value = cli.idCliente ?? cli.id;
    opt.textContent = `${cli.nombre} ${cli.apellido}`;
    if (selectedId && opt.value == selectedId) opt.selected = true;
    selectCliente.appendChild(opt);
  });
}

async function cargarVehiculos(selectedId = null) {
  const res = await getVehiculos(0, 100, "idVehiculo", "asc");
  vehiculosCache = parseResponse(res);
  selectVehiculo.innerHTML = '<option disabled value="">Seleccione vehículo</option>';
  vehiculosCache.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.idVehiculo ?? v.id;
    opt.textContent = `${v.marca} ${v.modelo} - ${v.placa}`;
    if (selectedId && opt.value == selectedId) opt.selected = true;
    selectVehiculo.appendChild(opt);
  });
}

// ======================= TABLA =======================
function renderTabla(citas) {
  tablaCitas.innerHTML = "";
  if (!citas || citas.length === 0) {
    tablaCitas.innerHTML = `<tr><td colspan="9" class="text-center">No hay registros</td></tr>`;
    return;
  }

  citas.forEach(cita => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cita.id}</td>
      <td>${cita.fecha}</td>
      <td>${cita.hora}</td>
      <td>${cita.estado}</td>
      <td>${cita.clienteNombre ?? "—"}</td>
      <td>${cita.vehiculoNombre ?? "—"}</td>
      <td>${cita.tipoServicio}</td>
      <td>${cita.descripcion ?? "—"}</td>
      <td class="text-center">
        <button class="btn btn-outline-primary btn-sm me-2" onclick="editarCita(${cita.id})">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="btn btn-outline-danger btn-sm" onclick="eliminarCita(${cita.id})">
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
  inputId.value = "";
  modalLabel.textContent = "Agregar Cita";
  if (citaForm) citaForm.reset();

  const hoy = new Date().toISOString().split("T")[0];
  inputFecha.setAttribute("min", hoy);

  await cargarClientes();
  await cargarVehiculos();
  citaModal.show();
};

window.editarCita = async function (id) {
  try {
    const res = await getCitaById(id);
    const cita = res?.data ?? res;
    if (!cita) return Swal.fire("Error", "No se encontró la cita", "error");

    modalLabel.textContent = "Editar Cita";
    if (citaForm) citaForm.reset();
    inputId.value = cita.id;

    const hoy = new Date().toISOString().split("T")[0];
    inputFecha.setAttribute("min", hoy);

    await cargarClientes(cita.idCliente);
    await cargarVehiculos(cita.idVehiculo);

    inputFecha.value = cita.fecha ?? "";
    inputHora.value = to24h(cita.hora) || cita.hora || "";
    selectEstado.value = cita.estado ?? "";
    selectServicio.value = cita.tipoServicio ?? "";
    inputDescripcion.value = cita.descripcion ?? "";

    citaModal.show();
  } catch (err) {
    console.error("❌ Error al editar cita:", err);
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
  await deleteCita(id);
  Swal.fire("Eliminada", "Cita borrada", "success");
  cargarTabla(true);
};

// ======================= FORMULARIO =======================
if (citaForm) {
  citaForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const hoy = new Date().toISOString().split("T")[0];
    if (!inputFecha.value || inputFecha.value < hoy)
      return Swal.fire("Error", "Seleccione una fecha válida", "error");

    if (!inputHora.value)
      return Swal.fire("Error", "Seleccione una hora", "error");

    const dto = {
      fecha: inputFecha.value,
      hora: toAmPm(inputHora.value),
      estado: selectEstado.value,
      idCliente: parseInt(selectCliente.value, 10),
      idVehiculo: parseInt(selectVehiculo.value, 10),
      tipoServicio: selectServicio.value,
      descripcion: inputDescripcion.value
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
      await cargarTabla(true);
    } catch (err) {
      console.error("❌ Error al guardar cita:", err);
      Swal.fire("Error", "No se pudo guardar la cita", "error");
    }
  });
}

// ======================= BOTONES =======================
const btnNueva = document.getElementById("btnNuevaCita");
if (btnNueva) {
  btnNueva.addEventListener("click", () => {
    abrirModalAgregar();
  });
}

// 🔹 Botón Ver Calendario
const btnVerCalendario = document.getElementById("btnVerCalendario");
if (btnVerCalendario) {
  btnVerCalendario.addEventListener("click", () => {
    window.location.href = "calendario.html";
  });
}

selectPageSize.addEventListener("change", () => {
  tamPagina = parseInt(selectPageSize.value, 10);
  paginaActual = 1;
  cargarTabla(true);
});

// ======================= INIT =======================
cargarClientes();
cargarVehiculos();
cargarTabla(true);

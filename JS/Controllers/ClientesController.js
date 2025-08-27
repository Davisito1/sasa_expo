import {
  getCitas,
  getCitasPaginado,
  getCitaById,
  createCita,
  updateCita,
  deleteCita
} from "../Services/CitasService.js";

import { getClientes } from "../Services/ClientesService.js";

// ======================= DOM =======================
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

let citasCache = [];
let clientesCache = [];
let paginaActual = 1;
let tamPagina = parseInt(selectPageSize.value, 10);

// ======================= HELPERS =======================
const getIdCliente = c => c.id ?? c.idCliente;

// ======================= CARGA CLIENTES =======================
async function cargarClientes() {
  try {
    const res = await getClientes(0, 100); // traemos primera página con 100 clientes
    clientesCache = res?.content ?? res?.data?.content ?? res?.data ?? [];
    selectCliente.innerHTML = '<option value="" disabled selected>Seleccione cliente</option>';
    clientesCache.forEach(c => {
      const opt = document.createElement("option");
      opt.value = getIdCliente(c);
      opt.textContent = `${c.nombre} ${c.apellido}`;
      selectCliente.appendChild(opt);
    });
  } catch (err) {
    console.error("Error al cargar clientes:", err);
    Swal.fire("Error","No se pudieron cargar los clientes","error");
  }
}

// ======================= RENDER TABLA =======================
function renderTabla(citas) {
  tablaCitas.innerHTML = "";
  if (!citas || citas.length === 0) {
    tablaCitas.innerHTML = `<tr><td colspan="6" class="text-center">No hay registros</td></tr>`;
    return;
  }

  citas.forEach(cita => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cita.id}</td>
      <td>${cita.fecha}</td>
      <td>${cita.hora}</td>
      <td>${cita.estado}</td>
      <td>${cita.cliente?.nombre ?? "—"}</td>
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

// ======================= PAGINACIÓN =======================
function renderPaginacion(totalPaginas) {
  pagWrap.innerHTML = "";
  for (let p = 1; p <= totalPaginas; p++) {
    const btn = document.createElement("button");
    btn.className = `btn btn-sm ${p === paginaActual ? "btn-primary" : "btn-outline-primary"}`;
    btn.textContent = p;
    btn.onclick = () => {
      paginaActual = p;
      loadCitas();
    };
    pagWrap.appendChild(btn);
  }
}

// ======================= CARGA DE CITAS =======================
async function loadCitas(reset = false) {
  try {
    const res = await getCitasPaginado(paginaActual - 1, tamPagina);
    const data = res?.content ?? res?.data?.content ?? res?.data ?? [];
    citasCache = Array.isArray(data) ? data : [];
    if (reset) paginaActual = 1;
    renderTabla(citasCache);
    renderPaginacion(res.totalPages ?? 1);
  } catch (err) {
    console.error("Error al cargar citas:", err);
    Swal.fire("Error","No se pudieron cargar las citas","error");
  }
}

// ======================= CRUD =======================

// 🔹 Abrir modal en modo AGREGAR
window.abrirModalAgregar = async () => {
  citaForm.reset();
  inputId.value = "";
  modalLabel.textContent = "Agregar Cita";
  await cargarClientes();
  citaModal.show();
};

// 🔹 Editar cita
window.editarCita = async (id) => {
  try {
    const cita = await getCitaById(id);
    if (!cita) {
      Swal.fire("Error","No se encontró la cita","error");
      return;
    }
    modalLabel.textContent = "Editar Cita";
    inputId.value = cita.id;
    inputFecha.value = cita.fecha;
    inputHora.value = cita.hora;
    selectEstado.value = cita.estado;
    await cargarClientes();
    if (cita.cliente) {
      selectCliente.value = getIdCliente(cita.cliente);
    }
    citaModal.show();
  } catch (err) {
    console.error("Error en editarCita:", err);
    Swal.fire("Error","No se pudo cargar la cita","error");
  }
};

// 🔹 Eliminar cita
window.eliminarCita = async (id) => {
  const ok = await Swal.fire({
    title:"¿Eliminar cita?",
    icon:"warning",
    showCancelButton:true,
    confirmButtonText:"Sí, eliminar",
    cancelButtonText:"Cancelar",
    confirmButtonColor:"#d33"
  }).then(r=>r.isConfirmed);
  if (!ok) return;
  try {
    await deleteCita(id);
    Swal.fire("Eliminada","Cita borrada","success");
    loadCitas();
  } catch (err) {
    console.error("Error al eliminar cita:", err);
    Swal.fire("Error","No se pudo eliminar","error");
  }
};

// 🔹 Guardar (Agregar/Editar)
citaForm.addEventListener("submit", async e => {
  e.preventDefault();
  const dto = {
    fecha: inputFecha.value,
    hora: inputHora.value,
    estado: selectEstado.value,
    cliente: { id: parseInt(selectCliente.value,10) }
  };
  try {
    if (inputId.value) {
      await updateCita(parseInt(inputId.value,10), dto);
      Swal.fire("Éxito","Cita actualizada","success");
    } else {
      await createCita(dto);
      Swal.fire("Éxito","Cita registrada","success");
    }
    citaModal.hide();
    loadCitas(true);
  } catch (err) {
    console.error("Error al guardar cita:", err);
    Swal.fire("Error","No se pudo guardar la cita","error");
  }
});

// ======================= EVENTOS =======================
selectPageSize.addEventListener("change", () => {
  tamPagina = parseInt(selectPageSize.value, 10);
  paginaActual = 1;
  loadCitas(true);
});

// ======================= INIT =======================
document.addEventListener("DOMContentLoaded", async () => {
  await loadCitas(true);
});

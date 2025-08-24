// 📌 VehiculosController.js
// Conecta la UI con los servicios y maneja modal, tabla, paginación y búsqueda.

import {
  getVehiculos,
  createVehiculo,
  updateVehiculo,
  deleteVehiculo,
  getClientes,
  getEstados,
} from "../Services/VehiculosServices.js";

// ——————————————————————————————————————————————
// DOM
// ——————————————————————————————————————————————
const tablaVehiculos      = document.getElementById("vehiculosTable");
const vehiculoForm        = document.getElementById("vehiculoForm");
const btnAddVehiculo      = document.getElementById("btnAddVehiculo");
const modalVehiculo       = new bootstrap.Modal(document.getElementById("vehiculoModal"));

const inputBuscar         = document.getElementById("buscar");
const selectRegistros     = document.getElementById("registrosPorPagina");
const paginacionContainer = document.getElementById("paginacion");

// Campos del formulario
const fId       = document.getElementById("vehiculoId");
const fMarca    = document.getElementById("marca");
const fModelo   = document.getElementById("modelo");
const fAnio     = document.getElementById("anio");
const fPlaca    = document.getElementById("placa");
const fVin      = document.getElementById("vin");
const fCliente  = document.getElementById("idCliente");
const fEstado   = document.getElementById("idEstado");

// ——————————————————————————————————————————————
// Estado en memoria (para paginación + búsqueda)
// ——————————————————————————————————————————————
let allVehiculos = [];
let filteredVehiculos = [];
let currentPage = 1;
let perPage = parseInt(selectRegistros?.value || "10", 10);
let clientesCache = [];
let estadosCache  = [];

// ——————————————————————————————————————————————
// Utilidades
// ——————————————————————————————————————————————
const onlyLetters = (s) => /^[a-zA-ZÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test((s || "").trim());
const validYear = (y) => {
  const n = Number(y);
  const max = new Date().getFullYear() + 1;
  return /^\d{4}$/.test(String(y)) && n >= 1900 && n <= max;
};
const validPlaca = (p) => /^[A-Z0-9-]{5,10}$/i.test((p || "").trim());
// VIN opcional: si está vacío no valida; si trae valor, debe cumplir 17.
const validVin = (v) => (v || "").trim() === "" || /^[A-HJ-NPR-Z0-9]{17}$/i.test(v.trim());

function renderOptions(select, list, valueField, labelBuilder) {
  select.innerHTML = '<option value="">Seleccione…</option>';
  list.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = item[valueField];
    opt.textContent = labelBuilder(item);
    select.appendChild(opt);
  });
}

function nombreCliente(c) {
  return [c.nombre, c.apellido].filter(Boolean).join(" ").trim() || `ID ${c.id}`;
}

// ——————————————————————————————————————————————
// Carga inicial
// ——————————————————————————————————————————————
document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([cargarClientes(), cargarEstados()]);
  await reloadVehiculos();

  // Buscar
  if (inputBuscar) {
    inputBuscar.addEventListener("input", () => {
      aplicarFiltro();
      currentPage = 1;
      pintarTabla();
      pintarPaginacion();
    });
  }

  // Registros por página
  if (selectRegistros) {
    selectRegistros.addEventListener("change", (e) => {
      perPage = parseInt(e.target.value, 10);
      currentPage = 1;
      pintarTabla();
      pintarPaginacion();
    });
  }

  // Botón Nuevo
  btnAddVehiculo?.addEventListener("click", () => abrirCrear());

  // Delegación de eventos en la tabla (editar/eliminar)
  tablaVehiculos?.addEventListener("click", onTablaClick);
});

// ——————————————————————————————————————————————
// Cargar listas auxiliares
// ——————————————————————————————————————————————
async function cargarClientes() {
  try {
    clientesCache = await getClientes();
    renderOptions(fCliente, clientesCache, "id", (c) => nombreCliente(c));
  } catch (e) {
    console.error("Clientes:", e);
    // Dejar el combo vacío pero usable
  }
}

async function cargarEstados() {
  try {
    estadosCache = await getEstados();
    renderOptions(fEstado, estadosCache, "id", (e) => e.nombreEstado || `Estado ${e.id}`);
  } catch (e) {
    console.error("Estados:", e);
  }
}

// ——————————————————————————————————————————————
// CRUD Vehículos
// ——————————————————————————————————————————————
async function reloadVehiculos() {
  try {
    allVehiculos = await getVehiculos();
    aplicarFiltro();
    currentPage = 1;
    pintarTabla();
    pintarPaginacion();
  } catch (e) {
    console.error("Vehículos:", e);
    Swal.fire("Error", "No se pudieron cargar los vehículos.", "error");
  }
}

function abrirCrear() {
  vehiculoForm.reset();
  document.getElementById("vehiculoModalLabel").innerText = "Agregar Vehículo";
  fId.value = "";
  modalVehiculo.show();
}

function abrirEditar(v) {
  document.getElementById("vehiculoModalLabel").innerText = "Editar Vehículo";
  fId.value     = v.id;
  fMarca.value  = v.marca ?? "";
  fModelo.value = v.modelo ?? "";
  fAnio.value   = v.anio ?? "";
  fPlaca.value  = v.placa ?? "";
  fVin.value    = v.vin ?? "";
  fCliente.value = v.idCliente ?? "";
  fEstado.value  = v.idEstado ?? "";
  modalVehiculo.show();
}

function onTablaClick(ev) {
  const btn = ev.target.closest("button[data-action]");
  if (!btn) return;

  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;

  if (action === "edit") {
    const v = allVehiculos.find((x) => Number(x.id) === id);
    if (v) abrirEditar(v);
  }
  if (action === "delete") {
    eliminarVehiculo(id);
  }
}

// Guardar (crear/editar)
vehiculoForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Validaciones
  if (!onlyLetters(fMarca.value))  return Swal.fire("Validación", "Marca inválida.", "warning");
  if (!onlyLetters(fModelo.value)) return Swal.fire("Validación", "Modelo inválido.", "warning");
  if (!validYear(fAnio.value))     return Swal.fire("Validación", "Año inválido.", "warning");
  if (!validPlaca(fPlaca.value))   return Swal.fire("Validación", "Placa inválida.", "warning");
  if (!validVin(fVin.value))       return Swal.fire("Validación", "VIN debe tener 17 caracteres (o dejar vacío).", "warning");
  if (!fCliente.value)             return Swal.fire("Validación", "Seleccione un cliente.", "warning");
  if (!fEstado.value)              return Swal.fire("Validación", "Seleccione un estado.", "warning");

  const payload = {
    marca:   fMarca.value.trim(),
    modelo:  fModelo.value.trim(),
    anio:    Number(fAnio.value),
    placa:   fPlaca.value.trim(),
    vin:     fVin.value.trim() || null,
    idCliente: Number(fCliente.value),
    idEstado:  Number(fEstado.value),
  };

  try {
    if (fId.value) {
      await updateVehiculo(Number(fId.value), payload);
      Swal.fire("Éxito", "Vehículo actualizado correctamente.", "success");
    } else {
      await createVehiculo(payload);
      Swal.fire("Éxito", "Vehículo agregado correctamente.", "success");
    }
    modalVehiculo.hide();
    await reloadVehiculos();
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "No se pudo guardar el vehículo.", "error");
  }
});

async function eliminarVehiculo(id) {
  const result = await Swal.fire({
    title: "¿Eliminar vehículo?",
    text: "Esta acción no se puede deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  });
  if (!result.isConfirmed) return;

  try {
    await deleteVehiculo(id);
    Swal.fire("Eliminado", "Vehículo eliminado correctamente.", "success");
    await reloadVehiculos();
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "No se pudo eliminar el vehículo.", "error");
  }
}

// ——————————————————————————————————————————————
// Búsqueda + Paginación
// ——————————————————————————————————————————————
function aplicarFiltro() {
  const q = (inputBuscar?.value || "").toLowerCase();
  if (!q) {
    filteredVehiculos = [...allVehiculos];
    return;
  }
  filteredVehiculos = allVehiculos.filter((v) => {
    const cliente = clientesCache.find((c) => c.id === v.idCliente);
    const estado  = estadosCache.find((e) => e.id === v.idEstado);
    const texto = [
      v.id, v.marca, v.modelo, v.anio, v.placa, v.vin,
      cliente ? nombreCliente(cliente) : v.idCliente,
      estado ? (estado.nombreEstado || estado.id) : v.idEstado,
    ]
      .join(" ")
      .toLowerCase();

    return texto.includes(q);
  });
}

function getPagedItems() {
  const start = (currentPage - 1) * perPage;
  return filteredVehiculos.slice(start, start + perPage);
}

function pintarTabla() {
  tablaVehiculos.innerHTML = "";

  const pageItems = getPagedItems();
  pageItems.forEach((v) => {
    const cliente = clientesCache.find((c) => c.id === v.idCliente);
    const estado  = estadosCache.find((e) => e.id === v.idEstado);

    const tdCliente = cliente ? nombreCliente(cliente) : v.idCliente;
    const tdEstado  = estado ? (estado.nombreEstado || estado.id) : v.idEstado;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${v.id}</td>
      <td>${v.marca ?? "-"}</td>
      <td>${v.modelo ?? "-"}</td>
      <td>${v.anio ?? "-"}</td>
      <td>${v.placa ?? "-"}</td>
      <td>${v.vin ?? "-"}</td>
      <td>${tdCliente}</td>
      <td>${tdEstado}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-primary me-2 icon-btn" data-action="edit" data-id="${v.id}" title="Editar">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="btn btn-sm btn-danger icon-btn" data-action="delete" data-id="${v.id}" title="Eliminar">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tablaVehiculos.appendChild(tr);
  });
}

function pintarPaginacion() {
  if (!paginacionContainer) return;
  paginacionContainer.innerHTML = "";

  const total = filteredVehiculos.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const btnPrev = document.createElement("button");
  btnPrev.className = "btn btn-outline-secondary btn-sm";
  btnPrev.textContent = "Anterior";
  btnPrev.disabled = currentPage === 1;
  btnPrev.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      pintarTabla();
      pintarPaginacion();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
  paginacionContainer.appendChild(btnPrev);

  // Números (máx 7 botones para no saturar)
  const maxButtons = 7;
  let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let end = Math.min(totalPages, start + maxButtons - 1);
  if (end - start + 1 < maxButtons) {
    start = Math.max(1, end - maxButtons + 1);
  }

  for (let i = start; i <= end; i++) {
    const b = document.createElement("button");
    b.className = `btn btn-sm ${i === currentPage ? "btn-primary" : "btn-outline-primary"}`;
    b.textContent = i;
    b.addEventListener("click", () => {
      currentPage = i;
      pintarTabla();
      pintarPaginacion();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    paginacionContainer.appendChild(b);
  }

  const btnNext = document.createElement("button");
  btnNext.className = "btn btn-outline-secondary btn-sm";
  btnNext.textContent = "Siguiente";
  btnNext.disabled = currentPage === totalPages;
  btnNext.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      pintarTabla();
      pintarPaginacion();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
  paginacionContainer.appendChild(btnNext);
}

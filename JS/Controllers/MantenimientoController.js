// ==================== IMPORTAR SERVICIOS ====================
// CRUD de mantenimientos desde el servicio
import {
  getMantenimientos,   // obtiene mantenimientos paginados
  createMantenimiento, // crea un mantenimiento
  updateMantenimiento, // actualiza un mantenimiento
  deleteMantenimiento  // elimina un mantenimiento
} from "../Services/MantenimientoService.js";

// Importar loginService para el token
import { getToken } from "../Services/LoginService.js";

// Endpoint directo para vehículos (se usa en combo)
const VEHICULOS_API = "http://localhost:8080/apiVehiculo/consultar";

// ==================== DOM ====================
// Tabla, paginación, búsqueda y select tamaño
const tabla       = document.getElementById("tablaMantenimiento");
const pagWrap     = document.getElementById("paginacion");
const inputBuscar = document.getElementById("buscar");
const selectSize  = document.getElementById("registrosPorPagina");

// Modal y formulario
const mantenimientoModal = new bootstrap.Modal(document.getElementById("mantenimientoModal"));
const form = document.getElementById("mantenimientoForm");

// Campos del formulario
const txtId     = document.getElementById("mantenimientoId");
const txtDesc   = document.getElementById("descripcionTrabajo");
const txtFecha  = document.getElementById("fechaRealizacion");
const txtCodigo = document.getElementById("codigoMantenimiento");
const selVeh    = document.getElementById("idVehiculo");

// ==================== VARIABLES GLOBALES ====================
// Caches y control de paginación
let vehiculosCache      = [];
let mantenimientosCache = [];
let paginaActual        = 1;
let tamPagina           = parseInt(selectSize?.value ?? "10", 10);
let totalPaginas        = 1;

// ==================== HELPERS ====================
// Devuelve un texto legible para mostrar vehículo en la tabla
function getVehiculoTexto(idVehiculo) {
  const v = vehiculosCache.find(v => v.id === idVehiculo || v.idVehiculo === idVehiculo);
  return v ? `${v.marca} - ${v.modelo} (${v.anio})` : "—";
}

// Devuelve texto válido para descripción
function getDescripcionTexto(desc) {
  return desc && desc.trim() !== "" ? desc : "Sin descripción";
}

// ==================== CARGAR VEHÍCULOS ====================
// Trae vehículos de la API y llena el select
async function cargarVehiculos() {
  try {
    const token = getToken();
    const res = await fetch(`${VEHICULOS_API}?page=0&size=100`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error(`Error ${res.status}`);
    const json = await res.json();
    vehiculosCache = Array.isArray(json?.data?.content) ? json.data.content : [];

    selVeh.innerHTML = '<option value="" disabled selected>Seleccione vehículo</option>';
    vehiculosCache.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v.id || v.idVehiculo;
      opt.textContent = `${v.marca} - ${v.modelo} (${v.anio})`;
      selVeh.appendChild(opt);
    });
  } catch (err) {
    console.error("Error al cargar vehículos:", err);
    Swal.fire("Error", "No se pudieron cargar los vehículos", "error");
  }
}

// ==================== RENDERIZAR TABLA ====================
// Construye filas de la tabla de mantenimientos
function renderTabla(data) {
  tabla.innerHTML = "";
  if (!data || data.length === 0) {
    tabla.innerHTML = `<tr><td colspan="6" class="text-center">No hay registros</td></tr>`;
    return;
  }

  data.forEach(m => {
    const id = m.id ?? m.idMantenimiento;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${id}</td>
      <td>${getDescripcionTexto(m.descripcion ?? m.descripcionTrabajo)}</td>
      <td>${m.fechaRealizacion ?? "—"}</td>
      <td>${m.codigoMantenimiento ?? "—"}</td>
      <td>${getVehiculoTexto(m.idVehiculo ?? m.vehiculo?.idVehiculo)}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-primary me-2 icon-btn" onclick="editarMantenimiento(${id})">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="btn btn-sm btn-danger icon-btn" onclick="eliminarMantenimiento(${id})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tabla.appendChild(tr);
  });
}

// ==================== RENDERIZAR PAGINACIÓN ====================
// Dibuja botones para cambiar página
function renderPaginacion() {
  pagWrap.innerHTML = "";
  for (let p = 1; p <= totalPaginas; p++) {
    const btn = document.createElement("button");
    btn.className = `btn btn-sm ${p === paginaActual ? "btn-primary" : "btn-outline-primary"}`;
    btn.textContent = p;
    btn.onclick = () => {
      paginaActual = p;
      loadMantenimientos();
    };
    pagWrap.appendChild(btn);
  }
}

// ==================== CARGAR MANTENIMIENTOS ====================
// Llama al servicio y actualiza tabla + paginación
async function loadMantenimientos(reset = false) {
  try {
    const res = await getMantenimientos(paginaActual - 1, tamPagina, inputBuscar.value);
    const data = res?.content ?? res?.data?.content ?? res?.data ?? [];

    mantenimientosCache = Array.isArray(data) ? data : [];
    totalPaginas        = res?.totalPages ?? 1;

    if (reset) paginaActual = 1;

    renderTabla(mantenimientosCache);
    renderPaginacion();
  } catch (err) {
    console.error("Error al cargar mantenimientos:", err);
    Swal.fire("Error", "No se pudieron cargar los mantenimientos", "error");
  }
}

// ==================== ABRIR MODAL AGREGAR ====================
window.abrirModalAgregar = async () => {
  form.reset();
  txtId.value    = "";
  txtCodigo.value = "MTN-" + new Date().getFullYear() + "-" + Math.floor(Math.random() * 1000);
  await cargarVehiculos();
  mantenimientoModal.show();
};

// ==================== EDITAR MANTENIMIENTO ====================
window.editarMantenimiento = async (id) => {
  try {
    const m = mantenimientosCache.find(x => (x.id ?? x.idMantenimiento) === id);
    if (!m) {
      Swal.fire("Error", "No se encontró el mantenimiento", "error");
      return;
    }

    txtId.value     = m.id ?? m.idMantenimiento;
    txtDesc.value   = m.descripcion ?? m.descripcionTrabajo;
    txtFecha.value  = m.fechaRealizacion;
    txtCodigo.value = m.codigoMantenimiento;

    await cargarVehiculos();
    selVeh.value = m.idVehiculo ?? m.vehiculo?.idVehiculo;

    mantenimientoModal.show();
  } catch (err) {
    console.error("Error en editarMantenimiento:", err);
    Swal.fire("Error", "No se pudo cargar el mantenimiento", "error");
  }
};

// ==================== ELIMINAR MANTENIMIENTO ====================
window.eliminarMantenimiento = async (id) => {
  const ok = await Swal.fire({
    title: "¿Eliminar mantenimiento?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#d33"
  }).then(r => r.isConfirmed);

  if (!ok) return;

  try {
    await deleteMantenimiento(id);
    Swal.fire("Eliminado", "Mantenimiento borrado", "success");
    loadMantenimientos();
  } catch (err) {
    console.error("Error al eliminar mantenimiento:", err);
    Swal.fire("Error", "No se pudo eliminar", "error");
  }
};

// ==================== GUARDAR MANTENIMIENTO ====================
// Se usa tanto para agregar como para actualizar
form.addEventListener("submit", async e => {
  e.preventDefault();

  // --------- Validaciones ---------
  if (!txtDesc.value || txtDesc.value.trim().length < 5) {
    return Swal.fire("Error", "La descripción debe tener al menos 5 caracteres", "error");
  }
  if (/^\d+$/.test(txtDesc.value.trim())) {
    return Swal.fire("Error", "La descripción no puede ser solo números", "error");
  }
  if (!txtFecha.value) {
    return Swal.fire("Error", "Debe seleccionar una fecha", "error");
  }
  const hoy = new Date().toISOString().split("T")[0];
  if (txtFecha.value < hoy) {
    return Swal.fire("Error", "La fecha no puede ser anterior a hoy", "error");
  }
  if (!txtCodigo.value) {
    return Swal.fire("Error", "El código es obligatorio", "error");
  }
  if (!selVeh.value) {
    return Swal.fire("Error", "Debe seleccionar un vehículo", "error");
  }

  // DTO a enviar
  const dto = {
    descripcion: txtDesc.value.trim(),
    fechaRealizacion: txtFecha.value,
    codigoMantenimiento: txtCodigo.value.trim(),
    idVehiculo: parseInt(selVeh.value, 10)
  };

  try {
    if (txtId.value) {
      await updateMantenimiento(parseInt(txtId.value, 10), dto);
      Swal.fire("Éxito", "Mantenimiento actualizado", "success");
    } else {
      await createMantenimiento(dto);
      Swal.fire("Éxito", "Mantenimiento creado", "success");
    }
    mantenimientoModal.hide();
    loadMantenimientos(true);
  } catch (err) {
    console.error("Error al guardar mantenimiento:", err);
    Swal.fire("Error", "No se pudo guardar", "error");
  }
});

// ==================== EVENTOS EXTRA ====================
// Búsqueda
inputBuscar.addEventListener("input", () => {
  paginaActual = 1;
  loadMantenimientos(true);
});

// Cambio de tamaño de página
selectSize.addEventListener("change", () => {
  tamPagina = parseInt(selectSize.value, 10);
  paginaActual = 1;
  loadMantenimientos(true);
});

// ==================== INICIO ====================
// Se ejecuta al cargar la página
document.addEventListener("DOMContentLoaded", async () => {
  await cargarVehiculos();
  await loadMantenimientos(true);
});

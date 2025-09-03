// ==================== IMPORTAR SERVICIOS ====================
// CRUD de vehículos
import { getVehiculos, createVehiculo, updateVehiculo, deleteVehiculo } from "../Services/VehiculosServices.js";

// Endpoints auxiliares para combos
const CLIENTES_API = "http://localhost:8080/apiCliente";
const ESTADOS_API  = "http://localhost:8080/api/estadoVehiculo";

// ==================== DOM ====================
// Tabla y modal
const tablaVehiculos  = document.getElementById("vehiculosTable");
const vehiculoForm    = document.getElementById("vehiculoForm");
const btnAddVehiculo  = document.getElementById("btnAddVehiculo");
const modalVehiculo   = new bootstrap.Modal(document.getElementById("vehiculoModal"));

// Búsqueda, paginación y select tamaño
const inputBuscar     = document.getElementById("buscar");
const paginacionWrap  = document.getElementById("paginacion");
const selectPageSize  = document.getElementById("registrosPorPagina");

// ==================== VARIABLES GLOBALES ====================
// Cache y control de paginación
let clientesCache   = [];
let estadosCache    = [];
let vehiculosCache  = [];
let paginaActual    = 0;
let tamPagina       = parseInt(selectPageSize.value, 10);
let totalPaginas    = 1;

// ==================== PARSE RESPONSE ====================
// Normaliza distintas respuestas de la API
function parseResponse(apiResponse) {
  if (Array.isArray(apiResponse)) return apiResponse;
  if (apiResponse?.data?.content) return apiResponse.data.content;
  if (apiResponse?.content) return apiResponse.content;
  if (apiResponse?.data) return apiResponse.data;
  return [];
}

// ==================== INICIO ====================
// Al cargar la página, traer combos y lista inicial
document.addEventListener("DOMContentLoaded", async () => {
  await cargarClientes();
  await cargarEstados();
  await loadVehiculos(true);
});

// ==================== ABRIR MODAL AGREGAR ====================
btnAddVehiculo.addEventListener("click", () => {
  vehiculoForm.reset();
  document.getElementById("vehiculoId").value = "";
  document.getElementById("vehiculoModalLabel").innerText = "Agregar Vehículo";
  modalVehiculo.show();
});

// ==================== GUARDAR VEHÍCULO ====================
vehiculoForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Campos del formulario
  const id        = document.getElementById("vehiculoId").value;
  const marca     = document.getElementById("marca").value.trim();
  const modelo    = document.getElementById("modelo").value.trim();
  const anio      = document.getElementById("anio").value.trim();
  const placa     = document.getElementById("placa").value.trim();
  const vinValue  = document.getElementById("vin").value.trim();
  const idCliente = document.getElementById("idCliente").value;
  const idEstado  = document.getElementById("idEstado").value;

  // -------- Validaciones --------
  if (!marca || marca.length < 2) return Swal.fire("Error", "La marca debe tener al menos 2 caracteres", "error");
  if (!modelo || modelo.length < 2) return Swal.fire("Error", "El modelo debe tener al menos 2 caracteres", "error");
  if (!anio || isNaN(anio) || anio < 1900 || anio > new Date().getFullYear()) return Swal.fire("Error", "Ingrese un año válido", "error");
  if (!placa || placa.length < 5) return Swal.fire("Error", "La placa debe tener al menos 5 caracteres", "error");
  if (vinValue && vinValue.length !== 17) return Swal.fire("Error", "El VIN debe tener 17 caracteres o dejarse vacío", "error");
  if (!idCliente) return Swal.fire("Error", "Debe seleccionar un cliente", "error");
  if (!idEstado) return Swal.fire("Error", "Debe seleccionar un estado", "error");

  // Objeto a enviar
  const vehiculo = {
    marca,
    modelo,
    anio: parseInt(anio),
    placa,
    vin: vinValue === "" ? null : vinValue,
    idCliente: parseInt(idCliente),
    idEstado: parseInt(idEstado)
  };

  try {
    if (id) {
      // Editar
      await updateVehiculo(id, vehiculo);
      Swal.fire("Éxito", "Vehículo actualizado correctamente", "success");
    } else {
      // Crear
      await createVehiculo(vehiculo);
      Swal.fire("Éxito", "Vehículo agregado correctamente", "success");
    }
    modalVehiculo.hide();
    loadVehiculos(true);
  } catch (error) {
    console.error("Error al guardar vehículo:", error);
    Swal.fire("Error", "No se pudo guardar el vehículo", "error");
  }
});

// ==================== LISTAR VEHÍCULOS ====================
async function loadVehiculos(reset = false) {
  try {
    if (reset) paginaActual = 0;
    const result = await getVehiculos(paginaActual, tamPagina, "idVehiculo", "asc");

    vehiculosCache = result.content ?? [];
    totalPaginas   = result.totalPages ?? 1;

    renderListaYPaginacion();
  } catch (err) {
    console.error("Error al cargar vehículos:", err);
    Swal.fire("Error", "No se pudieron cargar los vehículos", "error");
  }
}

// ==================== RENDERIZAR TABLA ====================
function renderVehiculos(lista) {
  tablaVehiculos.innerHTML = "";

  lista.forEach(v => {
    const clienteCache = clientesCache.find(c => (c.id || c.idCliente) === (v.idCliente ?? v.cliente?.idCliente));
    const estadoCache  = estadosCache.find(e => (e.id || e.idEstado) === (v.idEstado ?? v.estado?.idEstado));

    // Nombre cliente y estado
    const nombreCliente =
      (v.nombreCliente || v.cliente?.nombre || clienteCache?.nombre || "") +
      (v.apellidoCliente || v.cliente?.apellido || clienteCache?.apellido ? " " + (v.apellidoCliente || v.cliente?.apellido || clienteCache?.apellido) : "");

    const nombreEstado =
      v.nombreEstado || v.estado?.nombreEstado || estadoCache?.nombreEstado || "";

    const row = `
      <tr>
        <td>${v.id || v.idVehiculo || ""}</td>
        <td>${v.marca ?? ""}</td>
        <td>${v.modelo ?? ""}</td>
        <td>${v.anio ?? ""}</td>
        <td>${v.placa ?? ""}</td>
        <td>${v.vin || "-"}</td>
        <td>${nombreCliente.trim() || (v.idCliente ?? "")}</td>
        <td>${nombreEstado || (v.idEstado ?? "")}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-primary me-2 icon-btn" onclick="editVehiculo(${v.id || v.idVehiculo})">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button class="btn btn-sm btn-danger icon-btn" onclick="removeVehiculo(${v.id || v.idVehiculo})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
    tablaVehiculos.insertAdjacentHTML("beforeend", row);
  });
}

// ==================== RENDER PAGINACIÓN ====================
function renderPaginacion() {
  paginacionWrap.innerHTML = "";
  for (let p = 0; p < totalPaginas; p++) {
    const btn = document.createElement("button");
    btn.className = `btn btn-sm ${p === paginaActual ? "btn-primary" : "btn-outline-primary"}`;
    btn.textContent = (p + 1);
    btn.onclick = () => { paginaActual = p; loadVehiculos(); };
    paginacionWrap.appendChild(btn);
  }
}

function renderListaYPaginacion() {
  renderVehiculos(vehiculosCache);
  renderPaginacion();
}

// ==================== EDITAR VEHÍCULO ====================
window.editVehiculo = (id) => {
  const v = vehiculosCache.find(veh => (veh.id || veh.idVehiculo) === id);
  if (!v) return Swal.fire("Error", "Vehículo no encontrado", "error");

  document.getElementById("vehiculoId").value   = v.id || v.idVehiculo;
  document.getElementById("marca").value       = v.marca ?? "";
  document.getElementById("modelo").value      = v.modelo ?? "";
  document.getElementById("anio").value        = v.anio ?? "";
  document.getElementById("placa").value       = v.placa ?? "";
  document.getElementById("vin").value         = v.vin || "";
  document.getElementById("idCliente").value   = v.idCliente ?? v.cliente?.idCliente ?? "";
  document.getElementById("idEstado").value    = v.idEstado  ?? v.estado?.idEstado  ?? "";
  document.getElementById("vehiculoModalLabel").innerText = "Editar Vehículo";

  modalVehiculo.show();
};

// ==================== ELIMINAR VEHÍCULO ====================
window.removeVehiculo = async (id) => {
  Swal.fire({
    title: "¿Estás seguro?",
    text: "Este vehículo se eliminará permanentemente",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Sí, eliminar"
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await deleteVehiculo(id);
        Swal.fire("Eliminado", "Vehículo eliminado correctamente", "success");
        loadVehiculos();
      } catch (error) {
        console.error("Error al eliminar vehículo:", error);
        Swal.fire("Error", "No se pudo eliminar el vehículo", "error");
      }
    }
  });
};

// ==================== CARGAR CLIENTES Y ESTADOS ====================
async function cargarClientes() {
  try {
    const res = await fetch(`${CLIENTES_API}/consultar?page=0&size=50`);
    const data = await res.json();
    clientesCache = parseResponse(data);

    const selectCliente = document.getElementById("idCliente");
    selectCliente.innerHTML = '<option value="">Seleccione un Cliente</option>';
    clientesCache.forEach(c => {
      const option = document.createElement("option");
      option.value = c.id || c.idCliente;
      option.textContent = `${c.nombre} ${c.apellido}`;
      selectCliente.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar clientes:", error);
    Swal.fire("Error", "No se pudieron cargar los clientes", "error");
  }
}

async function cargarEstados() {
  try {
    const res = await fetch(`${ESTADOS_API}/consultar?page=0&size=50`);
    const data = await res.json();
    estadosCache = parseResponse(data);

    const selectEstado = document.getElementById("idEstado");
    selectEstado.innerHTML = '<option value="">Seleccione un Estado</option>';
    estadosCache.forEach(e => {
      const option = document.createElement("option");
      option.value = e.id || e.idEstado;
      option.textContent = e.nombreEstado;
      selectEstado.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar estados:", error);
    Swal.fire("Error", "No se pudieron cargar los estados", "error");
  }
}

// ==================== EVENTOS EXTRA ====================
// Buscar
inputBuscar.addEventListener("input", () => {
  paginaActual = 0;
  loadVehiculos(true);
});

// Cambiar tamaño de página
selectPageSize.addEventListener("change", () => {
  tamPagina = parseInt(selectPageSize.value, 10);
  paginaActual = 0;
  loadVehiculos(true);
});

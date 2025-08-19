// 📌 VehiculosController.js
import { getVehiculos, createVehiculo, updateVehiculo, deleteVehiculo } from "../Services/VehiculosServices.js";

// 🔹 APIs relacionadas
const CLIENTES_API = "http://localhost:8080/apiCliente";
const ESTADOS_API  = "http://localhost:8080/apiEstadoVehiculo";

const tablaVehiculos = document.getElementById("vehiculosTable");
const vehiculoForm = document.getElementById("vehiculoForm");
const btnAddVehiculo = document.getElementById("btnAddVehiculo");
const modalVehiculo = new bootstrap.Modal(document.getElementById("vehiculoModal"));

let clientesCache = [];
let estadosCache = [];

// =====================================================
// 🔹 Cargar datos iniciales
// =====================================================
document.addEventListener("DOMContentLoaded", async () => {
  await cargarClientes();
  await cargarEstados();
  await loadVehiculos();
});

// =====================================================
// 🔹 Botón abrir modal
// =====================================================
btnAddVehiculo.addEventListener("click", () => {
  vehiculoForm.reset();
  document.getElementById("vehiculoId").value = "";
  document.getElementById("vehiculoModalLabel").innerText = "Agregar Vehículo";
  modalVehiculo.show();
});

// =====================================================
// 🔹 Guardar Vehículo
// =====================================================
vehiculoForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("vehiculoId").value;

  const vehiculo = {
    marca: document.getElementById("marca").value.trim(),
    modelo: document.getElementById("modelo").value.trim(),
    anio: parseInt(document.getElementById("anio").value),
    placa: document.getElementById("placa").value.trim(),
    vin: document.getElementById("vin").value.trim(),
    idCliente: parseInt(document.getElementById("idCliente").value), // ⚡ debe ser 1
    idEstado: parseInt(document.getElementById("idEstado").value)    // ⚡ debe ser 2
  };

  console.log("Vehículo a enviar:", vehiculo);

  try {
    if (id) {
      await updateVehiculo(id, vehiculo);
      Swal.fire("Éxito", "Vehículo actualizado correctamente", "success");
    } else {
      await createVehiculo(vehiculo);
      Swal.fire("Éxito", "Vehículo agregado correctamente", "success");
    }
    modalVehiculo.hide();
    loadVehiculos();
  } catch (error) {
    console.error("Error al guardar vehículo:", error);
    Swal.fire("Error", "No se pudo guardar el vehículo", "error");
  }
});

// =====================================================
// 🔹 Mostrar vehículos en la tabla
// =====================================================
async function loadVehiculos() {
  try {
    const vehiculos = await getVehiculos();
    tablaVehiculos.innerHTML = "";

    vehiculos.forEach(v => {
      const cliente = clientesCache.find(c => c.id === v.idCliente);
      const estado = estadosCache.find(e => e.id === v.idEstado);

      const row = `
        <tr>
          <td>${v.id}</td>
          <td>${v.marca}</td>
          <td>${v.modelo}</td>
          <td>${v.anio}</td>
          <td>${v.placa}</td>
          <td>${v.vin || "-"}</td>
          <td>${cliente ? cliente.nombre + " " + cliente.apellido : v.idCliente}</td>
          <td>${estado ? estado.nombreEstado : v.idEstado}</td>
          <td class="text-center">
            <button class="btn btn-sm btn-primary me-2 icon-btn" onclick="editVehiculo(${v.id})">
              <i class="bi bi-pencil-square"></i>
            </button>
            <button class="btn btn-sm btn-danger icon-btn" onclick="removeVehiculo(${v.id})">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
      tablaVehiculos.innerHTML += row;
    });
  } catch (err) {
    console.error("Error al cargar vehículos:", err);
    Swal.fire("Error", "No se pudieron cargar los vehículos", "error");
  }
}

// =====================================================
// 🔹 Editar
// =====================================================
window.editVehiculo = async (id) => {
  try {
    const vehiculos = await getVehiculos();
    const v = vehiculos.find(veh => veh.id === id);

    if (!v) return;

    document.getElementById("vehiculoId").value = v.id;
    document.getElementById("marca").value = v.marca;
    document.getElementById("modelo").value = v.modelo;
    document.getElementById("anio").value = v.anio;
    document.getElementById("placa").value = v.placa;
    document.getElementById("vin").value = v.vin || "";
    document.getElementById("idCliente").value = v.idCliente;
    document.getElementById("idEstado").value = v.idEstado;

    document.getElementById("vehiculoModalLabel").innerText = "Editar Vehículo";
    modalVehiculo.show();
  } catch (error) {
    console.error("Error al editar vehículo:", error);
  }
};

// =====================================================
// 🔹 Eliminar
// =====================================================
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

// =====================================================
// 🔹 Cargar clientes
// =====================================================
async function cargarClientes() {
  try {
    const res = await fetch(`${CLIENTES_API}/consultar?page=0&size=50`);
    const data = await res.json();

    console.log("Respuesta API clientes:", data);

    clientesCache = data.data?.content || [];  
    console.log("Clientes cache cargados:", clientesCache);

    const selectCliente = document.getElementById("idCliente");
    selectCliente.innerHTML = '<option value="">Seleccione un Cliente</option>';

    clientesCache.forEach(c => {
      const option = document.createElement("option");
      option.value = c.id; // ✅ se asegura que mande el ID real
      option.textContent = `${c.nombre} ${c.apellido}`;
      selectCliente.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar clientes:", error);
  }
}

// =====================================================
// 🔹 Cargar estados
// =====================================================
async function cargarEstados() {
  try {
    const res = await fetch(`${ESTADOS_API}/consultar?page=0&size=50`);
    const data = await res.json();

    console.log("Respuesta API estados:", data);

    estadosCache = data.content || [];  
    console.log("Estados cache cargados:", estadosCache);

    const selectEstado = document.getElementById("idEstado");
    selectEstado.innerHTML = '<option value="">Seleccione un Estado</option>';

    estadosCache.forEach(e => {
      const option = document.createElement("option");
      option.value = e.id; // ✅ debe coincidir con IDESTADO real
      option.textContent = e.nombreEstado;
      selectEstado.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar estados:", error);
  }
}

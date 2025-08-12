const API_URL = 'https://retoolapi.dev/1nB30q/data';

const tablaVehiculos = document.getElementById("tablaVehiculos");
const frmAgregar = document.getElementById("frmAgregarVehiculo");
const frmEditar = document.getElementById("frmEditarVehiculo");

const modalAgregar = document.getElementById("mdAgregarVehiculo");
const modalEditar = document.getElementById("mdEditarVehiculo");

function abrirModalAgregar() {
  modalAgregar.showModal();
}
function cerrarModalAgregar() {
  frmAgregar.reset();
  modalAgregar.close();
}
function cerrarModalEditar() {
  frmEditar.reset();
  modalEditar.close();
}

function validarTextoSoloLetras(texto) {
  return /^[a-zA-Z\s]+$/.test(texto.trim());
}
function validarAnio(anio) {
  const anioNum = Number(anio);
  const anioActual = new Date().getFullYear() + 1;
  return /^\d{4}$/.test(anio) && anioNum >= 1900 && anioNum <= anioActual;
}
function validarPlaca(placa) {
  return /^[A-Z0-9-]{5,8}$/i.test(placa.trim());
}
function validarVIN(vin) {
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin.trim());
}

function mostrarVehiculos(lista) {
  tablaVehiculos.innerHTML = "";
  lista.forEach((vehiculo) => {
    tablaVehiculos.innerHTML += `
      <tr>
        <td>${vehiculo.id}</td>
        <td>${vehiculo.Marca}</td>
        <td>${vehiculo.Modelo}</td>
        <td>${vehiculo.Anio}</td>
        <td>${vehiculo.Placa}</td>
        <td>${vehiculo.VIN}</td>
        <td>${vehiculo.Cliente}</td>
        <td>
          <button class="btn btn-sm btn-primary me-2 icon-btn editar" data-id="${vehiculo.id}" title="Editar">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button class="btn btn-sm btn-danger icon-btn eliminar" data-id="${vehiculo.id}" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });
  agregarEventosBotones();
}

function agregarEventosBotones() {
  document.querySelectorAll(".editar").forEach(btn => {
    btn.addEventListener("click", () => cargarParaEditar(btn.dataset.id));
  });
  document.querySelectorAll(".eliminar").forEach(btn => {
    btn.addEventListener("click", () => eliminarVehiculo(btn.dataset.id));
  });
}

async function cargarVehiculos() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    mostrarVehiculos(data);
  } catch (error) {
    console.error("Error al cargar vehículos:", error);
    Swal.fire("Error", "No se pudieron cargar los vehículos.", "error");
  }
}

function validarFormulario(vehiculo) {
  if (!validarTextoSoloLetras(vehiculo.Marca)) return alert("Marca inválida."), false;
  if (!validarAnio(vehiculo.Anio)) return alert("Año inválido."), false;
  if (!validarPlaca(vehiculo.Placa)) return alert("Placa inválida."), false;
  if (!validarVIN(vehiculo.VIN)) return alert("VIN inválido."), false;
  if (!validarTextoSoloLetras(vehiculo.Cliente)) return alert("Cliente inválido."), false;
  return true;
}

frmAgregar.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nuevo = {
    Marca: txtMarca.value.trim(),
    Modelo: txtModelo.value.trim(),
    Anio: txtAnio.value.trim(),
    Placa: txtPlaca.value.trim(),
    VIN: txtVIN.value.trim(),
    Cliente: txtCliente.value.trim()
  };
  if (!validarFormulario(nuevo)) return;
  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevo)
    });
    cerrarModalAgregar();
    cargarVehiculos();
    Swal.fire("Agregado", "El vehículo fue agregado correctamente.", "success");
  } catch (error) {
    console.error("Error al agregar:", error);
    Swal.fire("Error", "No se pudo agregar el vehículo.", "error");
  }
});

async function cargarParaEditar(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`);
    const data = await res.json();
    txtIdEditarVehiculo.value = data.id;
    txtMarcaEditar.value = data.Marca;
    txtModeloEditar.value = data.Modelo;
    txtAnioEditar.value = data.Anio;
    txtPlacaEditar.value = data.Placa;
    txtVINEditar.value = data.VIN;
    txtClienteEditar.value = data.Cliente;
    modalEditar.showModal();
  } catch (error) {
    console.error("Error al cargar vehículo:", error);
    Swal.fire("Error", "No se pudo cargar el vehículo.", "error");
  }
}

frmEditar.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = txtIdEditarVehiculo.value;
  const editado = {
    Marca: txtMarcaEditar.value.trim(),
    Modelo: txtModeloEditar.value.trim(),
    Anio: txtAnioEditar.value.trim(),
    Placa: txtPlacaEditar.value.trim(),
    VIN: txtVINEditar.value.trim(),
    Cliente: txtClienteEditar.value.trim()
  };
  if (!validarFormulario(editado)) return;
  try {
    await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editado)
    });
    cerrarModalEditar();
    cargarVehiculos();
    Swal.fire("Actualizado", "El vehículo fue actualizado correctamente.", "success");
  } catch (error) {
    console.error("Error al actualizar vehículo:", error);
    Swal.fire("Error", "No se pudo actualizar el vehículo.", "error");
  }
});

async function eliminarVehiculo(id) {
  const result = await Swal.fire({
    title: '¿Eliminar vehículo?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });
  if (result.isConfirmed) {
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      cargarVehiculos();
      Swal.fire("Eliminado", "El vehículo fue eliminado correctamente.", "success");
    } catch (error) {
      console.error("Error al eliminar:", error);
      Swal.fire("Error", "No se pudo eliminar el vehículo.", "error");
    }
  }
}

function buscarVehiculo() {
  const texto = document.getElementById("buscar").value.toLowerCase();
  const filas = tablaVehiculos.getElementsByTagName("tr");
  Array.from(filas).forEach((fila) => {
    const contenido = fila.textContent.toLowerCase();
    fila.style.display = contenido.includes(texto) ? "" : "none";
  });
}

document.addEventListener("DOMContentLoaded", cargarVehiculos);
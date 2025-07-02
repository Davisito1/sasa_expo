const API_URL = 'https://retoolapi.dev/1nB30q/data';

// Elementos del DOM
const tablaVehiculos = document.getElementById("tablaVehiculos");
const frmAgregar = document.getElementById("frmAgregarVehiculo");
const frmEditar = document.getElementById("frmEditarVehiculo");

// Modales
const modalAgregar = document.getElementById("mdAgregarVehiculo");
const modalEditar = document.getElementById("mdEditarVehiculo");

// Funciones para abrir/cerrar modales
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

// Validaciones generales
function validarTextoSoloLetras(texto) {
  return /^[a-zA-Z\s]+$/.test(texto.trim());
}

function validarAnio(anio) {
  const anioNum = Number(anio);
  const anioActual = new Date().getFullYear() + 1; // permitir año actual + 1
  return /^\d{4}$/.test(anio) && anioNum >= 1900 && anioNum <= anioActual;
}

function validarPlaca(placa) {
  return /^[A-Z0-9-]{5,8}$/i.test(placa.trim());
}

function validarVIN(vin) {
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin.trim());
}

// Mostrar datos en la tabla
function mostrarVehiculos(lista) {
  tablaVehiculos.innerHTML = ""; // vaciar tabla
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
          <button class="btn btn-sm btn-primary" onclick="cargarParaEditar(${vehiculo.id})">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarVehiculo(${vehiculo.id})">Eliminar</button>
        </td>
      </tr>
    `;
  });
}

// Cargar datos de API
async function cargarVehiculos() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    mostrarVehiculos(data);
  } catch (error) {
    console.error("Error al cargar vehículos:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron cargar los vehículos."
    });
  }
}

//Validaciones
function validarFormulario(vehiculo) {
  if (!validarTextoSoloLetras(vehiculo.Marca)) {
    alert("La Marca debe contener solo letras y espacios.");
    return false;
  }
  
  if (!validarAnio(vehiculo.Anio)) {
    alert("El Año debe ser un número de 4 dígitos  y no puede ser negativo debe ser válido entre 1900 y el próximo año.");
    return false;
  }
  if (!validarPlaca(vehiculo.Placa)) {
    alert("La Placa debe tener entre 5 y 8 caracteres alfanuméricos (letras, números o guiones).");
    return false;
  }
  if (!validarVIN(vehiculo.VIN)) {
    alert("El VIN debe tener 17 caracteres alfanuméricos válidos (sin I, O, Q).");
    return false;
  }
  if (!validarTextoSoloLetras(vehiculo.Cliente)) {
    alert("El Cliente debe contener solo letras y espacios.");
    return false;
  }
  return true;
}

// Agregar vehículo
frmAgregar.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nuevoVehiculo = {
    Marca: document.getElementById("txtMarca").value.trim(),
    Modelo: document.getElementById("txtModelo").value.trim(),
    Anio: document.getElementById("txtAnio").value.trim(),
    Placa: document.getElementById("txtPlaca").value.trim(),
    VIN: document.getElementById("txtVIN").value.trim(),
    Cliente: document.getElementById("txtCliente").value.trim()
  };

  if (!validarFormulario(nuevoVehiculo)) return;

  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevoVehiculo)
    });
    cerrarModalAgregar();
    cargarVehiculos();
    Swal.fire({
      icon: 'success',
      title: 'Vehículo agregado',
      text: 'El vehículo se agregó correctamente.',
      timer: 1800,
      showConfirmButton: false
    });
  } catch (error) {
    console.error("Error al agregar vehículo:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo agregar el vehículo."
    });
  }
});

// Cargar datos en modal de edición
async function cargarParaEditar(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`);
    const data = await res.json();
    document.getElementById("txtIdEditarVehiculo").value = data.id;
    document.getElementById("txtMarcaEditar").value = data.Marca;
    document.getElementById("txtModeloEditar").value = data.Modelo;
    document.getElementById("txtAnioEditar").value = data.Anio;
    document.getElementById("txtPlacaEditar").value = data.Placa;
    document.getElementById("txtVINEditar").value = data.VIN;
    document.getElementById("txtClienteEditar").value = data.Cliente;

    modalEditar.showModal();

  } catch (error) {
    console.error("Error al cargar vehículo para editar:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo cargar el vehículo."
    });
  }
}

// Guardar edición
frmEditar.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("txtIdEditarVehiculo").value;
  const vehiculoEditado = {
    Marca: document.getElementById("txtMarcaEditar").value.trim(),
    Modelo: document.getElementById("txtModeloEditar").value.trim(),
    Anio: document.getElementById("txtAnioEditar").value.trim(),
    Placa: document.getElementById("txtPlacaEditar").value.trim(),
    VIN: document.getElementById("txtVINEditar").value.trim(),
    Cliente: document.getElementById("txtClienteEditar").value.trim()
  };

  if (!validarFormulario(vehiculoEditado)) return;

  try {
    await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vehiculoEditado)
    });
    cerrarModalEditar();
    cargarVehiculos();
    Swal.fire({
      icon: 'success',
      title: 'Vehículo actualizado',
      text: 'Los cambios se guardaron correctamente.',
      timer: 1800,
      showConfirmButton: false
    });
  } catch (error) {
    console.error("Error al actualizar vehículo:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo actualizar el vehículo."
    });
  }
});

// Eliminar vehículo con SweetAlert confirmación
async function eliminarVehiculo(id) {
  const result = await Swal.fire({
    title: '¿Deseas eliminar este vehículo?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }); 

  if (result.isConfirmed) {
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      cargarVehiculos();

      Swal.fire({
        icon: 'success',
        title: 'Eliminado',
        text: 'El vehículo fue eliminado.',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error("Error al eliminar vehículo:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar el vehículo."
      });
    }
  }
}

// Buscar en tabla (opcional)
function buscarVehiculo() {
  const texto = document.getElementById("buscar").value.toLowerCase();
  const filas = tablaVehiculos.getElementsByTagName("tr");
  Array.from(filas).forEach((fila) => {
    const contenido = fila.textContent.toLowerCase();
    fila.style.display = contenido.includes(texto) ? "" : "none";
  });
}

// Cargar al iniciar
document.addEventListener("DOMContentLoaded", cargarVehiculos);

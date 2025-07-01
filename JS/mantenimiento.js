const API_URL = 'https://retoolapi.dev/35dv6Q/data';

// Elementos del DOM
const tablaMantenimiento = document.getElementById("tablaMantenimiento");
const frmAgregar = document.getElementById("frmAgregarMantenimiento");
const frmEditar = document.getElementById("frmEditarMantenimiento");

// Modales
const modalAgregar = document.getElementById("mdAgregarMantenimiento");
const modalEditar = document.getElementById("mdEditarMantenimiento");

// Funciones para abrir/cerrar modales
function abrirModalAgregar() {
  frmAgregar.reset();
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

// Validaciones
function validarTextoVehiculo(texto) {
  return /^[\w\s\-]{2,30}$/.test(texto);
}

function validarDescripcion(desc) {
  return desc.length >= 5 && desc.length <= 100;
}

function validarFecha(fecha) {
  const fechaIngresada = new Date(fecha);
  const hoy = new Date();
  return !isNaN(fechaIngresada) && fechaIngresada <= hoy;
}

function validarEstado(estado) {
  const estadosValidos = ["pendiente", "en proceso", "completado"];
  return estadosValidos.includes(estado.toLowerCase());
}

function validarFormulario(m) {
  if (!validarTextoVehiculo(m.Vehiculo)) {
    alert( "El campo Vehículo debe tener entre 2 y 30 caracteres.");
    return false;
  }
  if (!validarDescripcion(m.Descripcion)) {
    alert("La descripción debe tener entre 5 y 100 caracteres.");
    return false;
  }
  if (!validarFecha(m.Fecha)) {
    alert("La fecha debe ser válida y no puede ser futura.");
    return false;
  }
  if (!validarEstado(m.Estado)) {
    alert("El estado debe ser: Pendiente, En Proceso o Completado.");
    return false;
  }
  return true;
}

// Mostrar datos en tabla
function mostrarMantenimientos(lista) {
  tablaMantenimiento.innerHTML = "";
  lista.forEach((mantenimiento) => {
    tablaMantenimiento.innerHTML += `
      <tr>
        <td>${mantenimiento.id}</td>
        <td>${mantenimiento.Vehiculo}</td>
        <td>${mantenimiento.Descripcion}</td>
        <td>${mantenimiento.Fecha}</td>
        <td>${mantenimiento.Estado}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="cargarParaEditarMantenimiento(${mantenimiento.id})">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarMantenimiento(${mantenimiento.id})">Eliminar</button>
        </td>
      </tr>
    `;
  });
}

// Cargar mantenimientos desde API
async function cargarMantenimiento() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    mostrarMantenimientos(data);
  } catch (error) {
    console.error("Error al cargar mantenimientos:", error);
    Swal.fire("Error", "No se pudieron cargar los mantenimientos.", "error");
  }
}

// Agregar mantenimiento
frmAgregar.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nuevo = {
    Vehiculo: document.getElementById("txtVehiculo").value.trim(),
    Descripcion: document.getElementById("txtDescripcion").value.trim(),
    Fecha: document.getElementById("txtFecha").value,
    Estado: document.getElementById("txtEstado").value.trim(),
  };

  if (!validarFormulario(nuevo)) return;

  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevo)
    });
    cerrarModalAgregar();
    cargarMantenimiento();
    Swal.fire("Agregado", "El mantenimiento fue agregado correctamente.", "success");
  } catch (error) {
    console.error("Error al agregar:", error);
    Swal.fire("Error", "No se pudo agregar el mantenimiento.", "error");
  }
});

// Cargar datos en modal de edición
async function cargarParaEditarMantenimiento(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`);
    const data = await res.json();

    document.getElementById("txtIdEditarMantenimiento").value = data.id;
    document.getElementById("txtVehiculoEditar").value = data.Vehiculo;
    document.getElementById("txtDescripcionEditar").value = data.Descripcion;
    document.getElementById("txtFechaEditar").value = data.Fecha;
    document.getElementById("txtEstadoEditar").value = data.Estado;

    modalEditar.showModal();
  } catch (error) {
    console.error("Error al cargar mantenimiento:", error);
    Swal.fire("Error", "No se pudo cargar el mantenimiento para editar.", "error");
  }
}

// Editar mantenimiento
frmEditar.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("txtIdEditarMantenimiento").value;
  const editado = {
    Vehiculo: document.getElementById("txtVehiculoEditar").value.trim(),
    Descripcion: document.getElementById("txtDescripcionEditar").value.trim(),
    Fecha: document.getElementById("txtFechaEditar").value,
    Estado: document.getElementById("txtEstadoEditar").value.trim(),
  };

  if (!validarFormulario(editado)) return;

  try {
    await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editado)
    });
    cerrarModalEditar();
    cargarMantenimiento();
    Swal.fire("Actualizado", "El mantenimiento fue actualizado correctamente.", "success");
  } catch (error) {
    console.error("Error al actualizar:", error);
    Swal.fire("Error", "No se pudo actualizar el mantenimiento.", "error");
  }
});

// Eliminar mantenimiento
async function eliminarMantenimiento(id) {
  const result = await Swal.fire({
    title: '¿Eliminar?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      cargarMantenimiento();
      Swal.fire("Eliminado", "El mantenimiento fue eliminado.", "success");
    } catch (error) {
      console.error("Error al eliminar:", error);
      Swal.fire("Error", "No se pudo eliminar el mantenimiento.", "error");
    }
  }
}

// Buscar
function buscarMantenimiento() {
  const texto = document.getElementById("buscar").value.toLowerCase();
  const filas = tablaMantenimiento.getElementsByTagName("tr");
  Array.from(filas).forEach((fila) => {
    const contenido = fila.textContent.toLowerCase();
    fila.style.display = contenido.includes(texto) ? "" : "none";
  });
}

// Inicializar
document.addEventListener("DOMContentLoaded", cargarMantenimiento);

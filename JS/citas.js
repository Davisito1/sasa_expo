const API_URL = "https://retoolapi.dev/K3dg6S/citas";

const tabla = document.getElementById("tablaCitas");
const frmAgregar = document.getElementById("frmAgregarCita");
const frmEditar = document.getElementById("frmEditarCita");
const modalAgregar = document.getElementById("mdAgregarCita");
const modalEditar = document.getElementById("mdEditarCita");

document.addEventListener("DOMContentLoaded", () => {
  const fechaHoy = new Date().toISOString().split("T")[0];
  document.getElementById("fechaCita").min = fechaHoy;
  document.getElementById("editarFechaCita").min = fechaHoy;

  ObtenerCitas();
});

function abrirModalAgregar() {
  modalAgregar.showModal();
}

function cerrarModalAgregar() {
  modalAgregar.close();
  frmAgregar.reset();
  limpiarErrores();
}

function abrirModalEditar() {
  modalEditar.showModal();
}

function cerrarModalEditar() {
  modalEditar.close();
  frmEditar.reset();
  limpiarErrores();
}

function limpiarErrores() {
  ["errorCliente", "errorFecha", "errorClienteEditar", "errorFechaEditar"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = "none";
      el.textContent = "";
    }
  });
}

async function ObtenerCitas() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Error al obtener citas");
    const data = await res.json();
    MostrarCitas(data);
  } catch (e) {
    console.error(e);
    Swal.fire("Error", "No se pudieron cargar las citas.", "error");
  }
}

function MostrarCitas(datos) {
  tabla.innerHTML = datos.map(cita => `
    <tr>
      <td>${cita.id}</td>
      <td>${cita.cliente}</td>
      <td>${cita.fecha}</td>
      <td>${cita.hora}</td>
      <td>${cita.estado}</td>
      <td>
        <button class="btn btn-sm icon-btn btn-primary" title="Editar" onclick="CargarParaEditar(${cita.id})">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="btn btn-sm icon-btn btn-danger" title="Eliminar" onclick="EliminarCita(${cita.id})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join("");
}

function validarCliente(cliente, errorId) {
  const regexNombre = /^[A-Za-zÁÉÍÓÚÑáéíóúñ\s]+$/;
  const errorEl = document.getElementById(errorId);
  if (!regexNombre.test(cliente.trim())) {
    errorEl.style.display = "block";
    errorEl.textContent = "El nombre solo puede contener letras y espacios.";
    return false;
  }
  errorEl.style.display = "none";
  return true;
}

function validarFecha(fecha, errorId) {
  const errorEl = document.getElementById(errorId);

  if (!fecha) {
    errorEl.style.display = "block";
    errorEl.textContent = "La fecha es obligatoria.";
    return false;
  }

  // Convertir a Date correctamente si viene en formato DD/MM/YYYY
  let [anio, mes, dia] = fecha.split("-");
  const fechaSeleccionada = new Date(anio, mes - 1, dia);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fechaSeleccionada.setHours(0, 0, 0, 0);

  if (fechaSeleccionada < hoy) {
    errorEl.style.display = "block";
    errorEl.textContent = "La fecha no puede ser anterior al día de hoy.";
    return false;
  }

  errorEl.style.display = "none";
  return true;
}


frmAgregar.addEventListener("submit", async (e) => {
  e.preventDefault();

  const cliente = document.getElementById("txtCliente").value;
  const fecha = document.getElementById("fechaCita").value;
  const hora = document.getElementById("horaCita").value;
  const estado = document.getElementById("selectEstado").value;

  if (!validarCliente(cliente, "errorCliente") || !validarFecha(fecha, "errorFecha")) return;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente, fecha, hora, estado }),
    });

    if (!res.ok) throw new Error("Error al agregar cita");

    cerrarModalAgregar();
    ObtenerCitas();
    Swal.fire("Agregado", "La cita se agregó correctamente.", "success");
  } catch (e) {
    console.error(e);
    Swal.fire("Error", "No se pudo agregar la cita.", "error");
  }
});

async function CargarParaEditar(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`);
    if (!res.ok) throw new Error("Error al cargar cita");
    const data = await res.json();

    document.getElementById("txtIdCita").value = data.id;
    document.getElementById("txtEditarCliente").value = data.cliente;
    document.getElementById("editarFechaCita").value = data.fecha;
    document.getElementById("editarHoraCita").value = data.hora;
    document.getElementById("selectEditarEstado").value = data.estado;

    abrirModalEditar();
  } catch (e) {
    console.error(e);
    Swal.fire("Error", "No se pudo cargar la cita.", "error");
  }
}

frmEditar.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("txtIdCita").value;
  const cliente = document.getElementById("txtEditarCliente").value;
  const fecha = document.getElementById("editarFechaCita").value;
  const hora = document.getElementById("editarHoraCita").value;
  const estado = document.getElementById("selectEditarEstado").value;

  if (!validarCliente(cliente, "errorClienteEditar") || !validarFecha(fecha, "errorFechaEditar")) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente, fecha, hora, estado }),
    });

    if (!res.ok) throw new Error("Error al actualizar cita");

    cerrarModalEditar();
    ObtenerCitas();
    Swal.fire("Actualizado", "La cita se actualizó correctamente.", "success");
  } catch (e) {
    console.error(e);
    Swal.fire("Error", "No se pudo actualizar la cita.", "error");
  }
});

async function EliminarCita(id) {
  const result = await Swal.fire({
    title: "¿Deseas eliminar esta cita?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  });

  if (result.isConfirmed) {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar cita");

      ObtenerCitas();
      Swal.fire("Eliminado", "La cita fue eliminada correctamente.", "success");
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "No se pudo eliminar la cita.", "error");
    }
  }
}

function BuscarCita() {
  const texto = document.getElementById("buscar").value.toLowerCase();
  const filas = tabla.getElementsByTagName("tr");
  Array.from(filas).forEach((fila) => {
    const contenido = fila.textContent.toLowerCase();
    fila.style.display = contenido.includes(texto) ? "" : "none";
  });
}

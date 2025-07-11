const API_URL = "https://retoolapi.dev/mm42wr/empleados";

const tabla = document.getElementById("tablaEmpleados");
const frmAgregar = document.getElementById("frmAgregarEmpleado");
const frmEditar = document.getElementById("frmEditarEmpleado");
const modalAgregar = document.getElementById("mdAgregarEmpleado");
const modalEditar = document.getElementById("mdEditarEmpleado");

function abrirModal(modal, form) {
  modal.showModal();
  if (form) form.reset();
}

function cerrarModal(modal, form) {
  modal.close();
  if (form) form.reset();
}

function abrirModalAgregar() {
  abrirModal(modalAgregar, frmAgregar);
}
function cerrarModalAgregar() {
  cerrarModal(modalAgregar, frmAgregar);
}
function cerrarModalEditar() {
  cerrarModal(modalEditar, frmEditar);
}

// Validaciones
function validarDUI(dui) {
  return /^\d{8}-\d{1}$/.test(dui.trim());
}

function validarTelefono(telefono) {
  return /^\d{4}-\d{4}$/.test(telefono.trim());
}

function validarForm(empleado) {
  if (!validarDUI(empleado.dui)) {
    Swal.fire("Error", "El DUI debe tener el formato ########-#.", "warning");
    return false;
  }
  if (!validarTelefono(empleado.telefono)) {
    Swal.fire("Error", "El teléfono debe tener el formato ####-####.", "warning");
    return false;
  }
  return true;
}

// Mostrar empleados
function mostrarEmpleados(datos) {
  tabla.innerHTML = "";
  datos.forEach(empleado => {
    tabla.innerHTML += `
      <tr>
        <td>${empleado.id}</td>
        <td>${empleado.nombre}</td>
        <td>${empleado.apellido}</td>
        <td>${empleado.cargo}</td>
        <td>${empleado.dui}</td>
        <td>${empleado.telefono}</td>
        <td>${empleado.direccion}</td>
        <td>${empleado.fechaContratacion}</td>
        <td>${empleado.correo}</td>
        <td>${empleado.usuario}</td>
        <td>
          <button class="icon-btn btn-primary btn-editar" data-id="${empleado.id}" title="Editar">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button class="icon-btn btn-danger btn-eliminar" data-id="${empleado.id}" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });

  // Listeners para editar y eliminar
  document.querySelectorAll(".btn-editar").forEach(btn => {
    btn.addEventListener("click", () => cargarParaEditar(btn.dataset.id));
  });
  document.querySelectorAll(".btn-eliminar").forEach(btn => {
    btn.addEventListener("click", () => eliminarEmpleado(btn.dataset.id));
  });
}

async function obtenerEmpleados() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Error al cargar empleados");
    const data = await res.json();
    mostrarEmpleados(data);
  } catch (e) {
    console.error(e);
    Swal.fire("Error", "No se pudieron cargar los empleados.", "error");
  }
}

// Agregar empleado
frmAgregar.addEventListener("submit", async e => {
  e.preventDefault();

  const empleado = {
    nombre: frmAgregar.txtNombre.value.trim(),
    apellido: frmAgregar.txtApellido.value.trim(),
    cargo: frmAgregar.selectCargo.value.trim(),
    dui: frmAgregar.txtDUI.value.trim(),
    telefono: frmAgregar.txtTelefono.value.trim(),
    direccion: frmAgregar.txtDireccion.value.trim(),
    fechaContratacion: frmAgregar.fechaContratacion.value,
    correo: frmAgregar.txtCorreo.value.trim(),
    usuario: frmAgregar.txtUsuario.value.trim(),
  };

  if (!validarForm(empleado)) return;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(empleado),
    });
    if (!res.ok) throw new Error("Error al agregar empleado");
    cerrarModalAgregar();
    await obtenerEmpleados();
    Swal.fire("Éxito", "Empleado agregado correctamente.", "success");
  } catch (e) {
    console.error(e);
    Swal.fire("Error", "No se pudo agregar el empleado.", "error");
  }
});

// Cargar para editar
async function cargarParaEditar(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`);
    if (!res.ok) throw new Error("Error al cargar empleado");
    const data = await res.json();

    frmEditar.txtIdEmpleado.value = data.id;
    frmEditar.txtEditarNombre.value = data.nombre;
    frmEditar.txtEditarApellido.value = data.apellido;
    frmEditar.selectEditarCargo.value = data.cargo;
    frmEditar.txtEditarDUI.value = data.dui;
    frmEditar.txtEditarTelefono.value = data.telefono;
    frmEditar.txtEditarDireccion.value = data.direccion;
    frmEditar.editarFechaContratacion.value = data.fechaContratacion;
    frmEditar.txtEditarCorreo.value = data.correo;
    frmEditar.txtEditarUsuario.value = data.usuario;

    abrirModal(modalEditar);
  } catch (e) {
    console.error(e);
    Swal.fire("Error", "No se pudo cargar el empleado para editar.", "error");
  }
}

// Editar empleado
frmEditar.addEventListener("submit", async e => {
  e.preventDefault();

  const id = frmEditar.txtIdEmpleado.value;

  const empleado = {
    nombre: frmEditar.txtEditarNombre.value.trim(),
    apellido: frmEditar.txtEditarApellido.value.trim(),
    cargo: frmEditar.selectEditarCargo.value.trim(),
    dui: frmEditar.txtEditarDUI.value.trim(),
    telefono: frmEditar.txtEditarTelefono.value.trim(),
    direccion: frmEditar.txtEditarDireccion.value.trim(),
    fechaContratacion: frmEditar.editarFechaContratacion.value,
    correo: frmEditar.txtEditarCorreo.value.trim(),
    usuario: frmEditar.txtEditarUsuario.value.trim(),
  };

  if (!validarForm(empleado)) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(empleado),
    });
    if (!res.ok) throw new Error("Error al actualizar empleado");
    cerrarModalEditar();
    await obtenerEmpleados();
    Swal.fire("Éxito", "Empleado actualizado correctamente.", "success");
  } catch (e) {
    console.error(e);
    Swal.fire("Error", "No se pudo actualizar el empleado.", "error");
  }
});

// Eliminar empleado
async function eliminarEmpleado(id) {
  const result = await Swal.fire({
    title: "¿Deseas eliminar este empleado?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  });

  if (result.isConfirmed) {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar empleado");
      await obtenerEmpleados();
      Swal.fire("Eliminado", "Empleado eliminado correctamente.", "success");
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "No se pudo eliminar el empleado.", "error");
    }
  }
}

// Búsqueda en tabla
document.getElementById("buscar")?.addEventListener("input", () => {
  const texto = document.getElementById("buscar").value.toLowerCase();
  const filas = tabla.getElementsByTagName("tr");
  Array.from(filas).forEach(fila => {
    fila.style.display = fila.textContent.toLowerCase().includes(texto) ? "" : "none";
  });
});

// Carga inicial
document.addEventListener("DOMContentLoaded", obtenerEmpleados);

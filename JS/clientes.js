const API_URL = 'https://retoolapi.dev/PifxKy/data';

// Elementos del DOM
const tablaClientes = document.getElementById("tablaClientes");
const frmAgregar = document.getElementById("frmAgregarClientes");
const frmEditar = document.getElementById("frmEditarClientes");

// Modales
const modalAgregar = document.getElementById("mdAgregarClientes");
const modalEditar = document.getElementById("mdEditarClientes");

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
function validarNombre(texto) {
  return /^[A-Za-zÁÉÍÓÚÑáéíóúñ\s]{2,40}$/.test(texto);
}

function validarDUI(dui) {
  return /^\d{8}-\d{1}$/.test(dui);
}

function validarFechaNacimiento(fecha) {
  const f = new Date(fecha);
  const hoy = new Date();
  const minimo = new Date('1900-01-01');
  return f >= minimo && f <= hoy;
}

function validarGenero(genero) {
  const g = genero.trim().toLowerCase();
  return g === "masculino" || g === "femenino" || g === "otro";
}

function validarFormulario(cliente) {
  if (!validarNombre(cliente.Nombres)) {
    alert("Nombre inválido. Solo letras, mínimo 2 caracteres.");
    return false;
  }
  if (!validarNombre(cliente.Apellidos)) {
    alert("Apellido inválido. Solo letras, mínimo 2 caracteres.");
    return false;
  }
  if (!validarDUI(cliente.DUI)) {
    alert("DUI inválido. Formato correcto: ########-#");
    return false;
  }
  if (!validarFechaNacimiento(cliente.Fechadenacimiento)) {
    alert("Fecha de nacimiento inválida.");
    return false;
  }
  if (!validarGenero(cliente.Genero)) {
    alert("Género debe ser Masculino, Femenino u Otro.");
    return false;
  }
  return true;
}

// Mostrar datos
function mostrarClientes(lista) {
  tablaClientes.innerHTML = "";
  lista.forEach((c) => {
    tablaClientes.innerHTML += `
      <tr>
        <td>${c.id}</td>
        <td>${c.Nombres}</td>
        <td>${c.Apellidos}</td>
        <td>${c.DUI}</td>
        <td>${c.Fechadenacimiento}</td>
        <td>${c.Genero}</td>
        <td>
          <button class="btn btn-sm icon-btn btn-primary" onclick="cargarParaEditar(${c.id})">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button class="btn btn-sm icon-btn btn-danger" onclick="eliminarCliente(${c.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });
}


// Cargar clientes
async function cargarClientes() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    mostrarClientes(data);
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "No se pudieron cargar los clientes.", "error");
  }
}

// Agregar cliente
frmAgregar.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nuevo = {
    Nombres: document.getElementById("txtNombres").value.trim(),
    Apellidos: document.getElementById("txtApellidos").value.trim(),
    DUI: document.getElementById("txtDUI").value.trim(),
    Fechadenacimiento: document.getElementById("txtFecha").value,
    Genero: document.getElementById("txtGenero").value.trim(),
  };

  if (!validarFormulario(nuevo)) return;

  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevo)
    });
    cerrarModalAgregar();
    cargarClientes();
    Swal.fire("Agregado", "El cliente fue agregado correctamente.", "success");
  } catch (error) {
    console.error("Error al agregar:", error);
    Swal.fire("Error", "No se pudo agregar el cliente.", "error");
  }
});

// Cargar datos en modal editar
async function cargarParaEditar(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`);
    const data = await res.json();

    document.getElementById("txtIdEditarClientes").value = data.id;
    document.getElementById("txtNombreEditar").value = data.Nombres;
    document.getElementById("txtApellidoEditar").value = data.Apellidos;
    document.getElementById("txtDUIEditar").value = data.DUI;
    document.getElementById("txtFechaEditar").value = data.Fechadenacimiento;
    document.getElementById("txtGeneroEditar").value = data.Genero;

    modalEditar.showModal();
  } catch (error) {
    console.error("Error al cargar cliente:", error);
    Swal.fire("Error", "No se pudo cargar el cliente para editar.", "error");
  }
}

// Editar cliente
frmEditar.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("txtIdEditarClientes").value;
  const editado = {
    Nombres: document.getElementById("txtNombreEditar").value.trim(),
    Apellidos: document.getElementById("txtApellidoEditar").value.trim(),
    DUI: document.getElementById("txtDUIEditar").value.trim(),
    Fechadenacimiento: document.getElementById("txtFechaEditar").value,
    Genero: document.getElementById("txtGeneroEditar").value.trim(),
  };

  if (!validarFormulario(editado)) return;

  try {
    await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editado)
    });
    cerrarModalEditar();
    cargarClientes();
    Swal.fire("Actualizado", "El cliente fue actualizado correctamente.", "success");
  } catch (error) {
    console.error("Error al actualizar:", error);
    Swal.fire("Error", "No se pudo actualizar el cliente.", "error");
  }
});

// Eliminar cliente
async function eliminarCliente(id) {
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
      cargarClientes();
      Swal.fire("Eliminado", "El cliente fue eliminado.", "success");
    } catch (error) {
      console.error("Error al eliminar:", error);
      Swal.fire("Error", "No se pudo eliminar el cliente.", "error");
    }
  }
}

// Buscar cliente
function buscarClientes() {
  const texto = document.getElementById("buscar").value.toLowerCase();
  const filas = tablaClientes.getElementsByTagName("tr");
  Array.from(filas).forEach((fila) => {
    const contenido = fila.textContent.toLowerCase();
    fila.style.display = contenido.includes(texto) ? "" : "none";
  });
}


document.addEventListener("DOMContentLoaded", cargarClientes);

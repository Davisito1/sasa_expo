// ==================== IMPORTAR SERVICIOS ====================
// Funciones CRUD para empleados
import {
  getEmpleados,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado
} from "../Services/EmpleadosService.js";

// ==================== DOM ====================
const tbody         = document.getElementById("tablaEmpleados");
const pagWrap       = document.getElementById("paginacion");
const inputBuscar   = document.getElementById("buscar");
const selectSize    = document.getElementById("registrosPorPagina");
const frmAdd        = document.getElementById("empleadoForm");

// Campos del formulario
const txtNombre     = document.getElementById("txtNombre");
const txtApellido   = document.getElementById("txtApellido");
const selectCargo   = document.getElementById("selectCargo");
const txtDui        = document.getElementById("txtDUI");
const txtTelefono   = document.getElementById("txtTelefono");
const txtDireccion  = document.getElementById("txtDireccion");
const txtFecha      = document.getElementById("fechaContratacion");
const txtCorreo     = document.getElementById("txtCorreo");
const selectUsuario = document.getElementById("selectUsuario");

// ==================== VARIABLES GLOBALES ====================
let empleadosCache  = [];
let usuariosCache   = [];
let paginaActual    = 1;
let tamPagina       = 10;
let totalPaginas    = 1;

// ==================== CARGAR USUARIOS ====================
async function cargarUsuarios() {
  try {
    const res = await fetch("http://localhost:8080/apiUsuario/consultar?page=0&size=50", {
      credentials: "include"   // 🔑 enviar cookie JWT
    });

    if (res.status === 401) {
      Swal.fire("Sesión expirada", "Por favor inicia sesión nuevamente", "warning")
        .then(() => window.location.href = "../login/login.html");
      return;
    }

    const data = await res.json();
    usuariosCache = data?.data?.content ?? [];

    const options = ['<option value="" disabled selected>Seleccione un Usuario</option>']
      .concat(usuariosCache.map(u => `<option value="${u.id}">${u.nombreUsuario}</option>`));

    selectUsuario.innerHTML = options.join("");
  } catch (err) {
    console.error("Error cargando usuarios", err);
    Swal.fire("Error", "No se pudieron cargar los usuarios", "error");
  }
}

// ==================== VALIDACIÓN ====================
function validarEmpleado(dto) {
  if (!dto.nombres || dto.nombres.length < 2) return Swal.fire("Error", "Nombre inválido", "error"), false;
  if (!dto.apellidos || dto.apellidos.length < 2) return Swal.fire("Error", "Apellido inválido", "error"), false;
  if (!dto.cargo) return Swal.fire("Error", "Seleccione cargo", "error"), false;
  if (!/^\d{8}-\d{1}$/.test(dto.dui)) return Swal.fire("Error", "DUI inválido", "error"), false;
  if (!dto.telefono || dto.telefono.length < 8) return Swal.fire("Error", "Teléfono inválido", "error"), false;
  if (!dto.direccion) return Swal.fire("Error", "Dirección obligatoria", "error"), false;
  if (new Date(dto.fechaContratacion) > new Date()) return Swal.fire("Error", "Fecha inválida", "error"), false;
  if (!dto.correo.includes("@")) return Swal.fire("Error", "Correo inválido", "error"), false;
  if (!dto.idUsuario) return Swal.fire("Error", "Debe asociar un usuario válido", "error"), false;
  return true;
}

// ==================== FORMULARIO ====================
frmAdd.addEventListener("submit", async e => {
  e.preventDefault();

  const dto = {
    nombres: txtNombre.value.trim(),
    apellidos: txtApellido.value.trim(),
    cargo: selectCargo.value,
    dui: txtDui.value.trim(),
    telefono: txtTelefono.value.trim(),
    direccion: txtDireccion.value.trim(),
    fechaContratacion: txtFecha.value,
    correo: txtCorreo.value.trim(),
    idUsuario: parseInt(selectUsuario.value, 10)
  };

  if (!validarEmpleado(dto)) return;

  try {
    await createEmpleado(dto);
    Swal.fire("Éxito", "Empleado registrado", "success");
    await loadEmpleados(true);
    frmAdd.reset();
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "No se pudo registrar", "error");
  }
});

// ==================== TABLA ====================
function renderTabla(lista) {
  tbody.innerHTML = "";
  lista.forEach(e => {
    const id = e.id ?? e.idEmpleado;
    const usuario = usuariosCache.find(u => u.id === e.idUsuario)?.nombreUsuario ?? e.idUsuario;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${id}</td>
      <td>${e.nombres}</td>
      <td>${e.apellidos}</td>
      <td>${e.cargo}</td>
      <td>${e.dui}</td>
      <td>${e.telefono}</td>
      <td>${e.direccion}</td>
      <td>${e.fechaContratacion}</td>
      <td>${e.correo}</td>
      <td>${usuario}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="eliminarEmpleado(${id})">
          <i class="bi bi-trash"></i>
        </button>
      </td>`;
    tbody.appendChild(tr);
  });
}

// ==================== PAGINACIÓN ====================
function renderPaginacion(totalPaginas) {
  pagWrap.innerHTML = "";
  for (let p = 1; p <= totalPaginas; p++) {
    const btn = document.createElement("button");
    btn.className = `btn btn-sm ${p === paginaActual ? "btn-primary" : "btn-outline-primary"}`;
    btn.textContent = p;
    btn.onclick = () => { paginaActual = p; loadEmpleados(); };
    pagWrap.appendChild(btn);
  }
}

// ==================== CARGAR EMPLEADOS ====================
async function loadEmpleados(reset = false) {
  try {
    const res = await getEmpleados(paginaActual - 1, tamPagina, inputBuscar?.value ?? "", { credentials: "include" });

    if (res.status === 401) {
      Swal.fire("Sesión expirada", "Por favor inicia sesión nuevamente", "warning")
        .then(() => window.location.href = "../login/login.html");
      return;
    }

    let data = await res.json();

    if (Array.isArray(data)) {
      empleadosCache = data;
    } else if (Array.isArray(data.content)) {
      empleadosCache = data.content;
    } else if (Array.isArray(data.data)) {
      empleadosCache = data.data;
    } else {
      empleadosCache = [];
    }

    empleadosCache.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
    totalPaginas = data.totalPages ?? 1;
    if (reset) paginaActual = 1;

    renderTabla(empleadosCache);
    renderPaginacion(totalPaginas);
  } catch (err) {
    console.error("Error cargando empleados", err);
    Swal.fire("Error", "No se pudieron cargar los empleados", "error");
  }
}

// ==================== INICIO ====================
document.addEventListener("DOMContentLoaded", async () => {
  await cargarUsuarios();
  await loadEmpleados(true);
});

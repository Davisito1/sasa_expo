import { getEmpleados } from "../Services/EmpleadosService.js";

import { crearNotificacion } from "../Services/NotificacionesService.js";


const tbody       = document.getElementById("tablaEmpleados");
const pagWrap     = document.getElementById("paginacion");
const inputBuscar = document.getElementById("buscar");
const selectSize  = document.getElementById("registrosPorPagina");

let empleadosCache = [];
let paginaActual   = 1;
let tamPagina      = 10;
let totalPaginas   = 1;



// ================== RENDER TABLA ==================
function renderTabla(lista) {
  tbody.innerHTML = "";
  lista.forEach(e => {
    const id = e.id ?? e.idEmpleado;

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
      <td>${e.nombreUsuario || "Sin usuario"}</td>`;
    tbody.appendChild(tr);
  });
}

// ================== RENDER PAGINACION ==================
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

// ================== CARGAR EMPLEADOS ==================
async function loadEmpleados(reset = false) {
  try {
    const data = await getEmpleados(paginaActual - 1, tamPagina, inputBuscar?.value ?? "");

    let empleados = [];
    if (Array.isArray(data)) {
      empleados = data;
    } else if (Array.isArray(data.content)) {
      empleados = data.content;
    } else if (Array.isArray(data.data?.content)) {
      empleados = data.data.content;
    } else if (Array.isArray(data.data)) {
      empleados = data.data;
    }

    empleadosCache = empleados.sort((a, b) => (a.id ?? a.idEmpleado ?? 0) - (b.id ?? b.idEmpleado ?? 0));
    totalPaginas = data.totalPages ?? data.data?.totalPages ?? 1;
    if (reset) paginaActual = 1;

    renderTabla(empleadosCache);
    renderPaginacion(totalPaginas);
  } catch (err) {
    console.error("Error cargando empleados", err);
    Swal.fire("Error", "No se pudieron cargar los empleados", "error");
  }
}

// ================== INIT ==================
document.addEventListener("DOMContentLoaded", async () => {
  await loadEmpleados(true);
});
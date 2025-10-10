// ======================= IMPORT =======================
import { getEmpleados } from "../Services/EmpleadosService.js";

// ======================= DOM ELEMENTS =======================
const tbody       = document.getElementById("tablaEmpleados");
const pagWrap     = document.getElementById("paginacion");
const inputBuscar = document.getElementById("buscar");
const selectSize  = document.getElementById("registrosPorPagina");

let empleadosCache = [];
let paginaActual   = 1;
let tamPagina      = 10;
let totalPaginas   = 1;
let debounceTimer  = null; // 🔥 Para evitar llamadas excesivas

// ======================= RENDER TABLA =======================
function renderTabla(lista) {
  tbody.innerHTML = "";

  if (!lista.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center text-muted py-3">
          No se encontraron empleados
        </td>
      </tr>`;
    return;
  }

  lista.forEach(e => {
    const id = e.id ?? e.idEmpleado ?? "-";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${id}</td>
      <td>${e.nombres || "-"}</td>
      <td>${e.apellidos || "-"}</td>
      <td>${e.cargo || "-"}</td>
      <td>${e.dui || "-"}</td>
      <td>${e.telefono || "-"}</td>
      <td>${e.direccion || "-"}</td>
      <td>${e.fechaContratacion || "-"}</td>
      <td>${e.correo || "-"}</td>
      <td>${e.nombreUsuario || "Sin usuario"}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ======================= RENDER PAGINACION =======================
function renderPaginacion(totalPaginas) {
  pagWrap.innerHTML = "";
  if (totalPaginas <= 1) return;

  for (let p = 1; p <= totalPaginas; p++) {
    const btn = document.createElement("button");
    btn.className = `btn btn-sm mx-1 ${
      p === paginaActual ? "btn-danger" : "btn-outline-danger"
    }`;
    btn.textContent = p;
    btn.onclick = () => {
      paginaActual = p;
      loadEmpleados();
    };
    pagWrap.appendChild(btn);
  }
}

// ======================= CARGAR EMPLEADOS =======================
async function loadEmpleados(reset = false) {
  try {
    if (reset) paginaActual = 1;

    const filtro = (inputBuscar?.value || "").trim();
    const data = await getEmpleados(paginaActual - 1, tamPagina, filtro);

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

    empleadosCache = empleados.sort(
      (a, b) => (a.id ?? a.idEmpleado ?? 0) - (b.id ?? b.idEmpleado ?? 0)
    );

    totalPaginas = data.totalPages ?? data.data?.totalPages ?? 1;

    renderTabla(empleadosCache);
    renderPaginacion(totalPaginas);
  } catch (err) {
    console.error("Error cargando empleados", err);
    Swal.fire("Error", "No se pudieron cargar los empleados", "error");
  }
}

// ======================= EVENTOS =======================

// 🔍 Buscar al escribir (con retardo)
inputBuscar?.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    loadEmpleados(true);
  }, 400); // espera 400ms antes de disparar la búsqueda
});

// Cambiar tamaño de página
selectSize?.addEventListener("change", () => {
  tamPagina = parseInt(selectSize.value, 10);
  loadEmpleados(true);
});

// ======================= INIT =======================
document.addEventListener("DOMContentLoaded", async () => {
  await loadEmpleados(true);
});

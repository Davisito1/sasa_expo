/* =========================================================
   HISTORIALCONTROLLER.JS — conectado al backend Spring
   ========================================================= */

const API_URL = "http://localhost:8080/api/historial"; // Ajusta el puerto si tu backend corre en otro

// ======================= DOM =======================
const tablaHistorial = document.getElementById("tablaHistorial");
const pagWrap = document.getElementById("paginacion");
const buscador = document.getElementById("buscadorHistorial");

// ======================= VARIABLES =================
let historialCache = [];
let paginaActual = 1;
const tamPagina = 5; // Registros por página
let filtroTexto = "";

// ======================= RENDER TABLA =================
function renderTabla() {
  const filtrados = historialCache.filter(h =>
    Object.values(h).some(v => String(v).toLowerCase().includes(filtroTexto))
  );

  const inicio = (paginaActual - 1) * tamPagina;
  const fin = inicio + tamPagina;
  const pagina = filtrados.slice(inicio, fin);

  tablaHistorial.innerHTML = "";

  pagina.forEach(h => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${h.idHistorial}</td>
      <td>${h.fechaIngreso || "-"}</td>
      <td>${h.fechaSalida || "-"}</td>
      <td>${h.trabajoRealizado || ""}</td>
      <td>${h.observaciones || ""}</td>
      <td>${h.idVehiculo || ""}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-warning me-1" onclick="editarHistorial(${h.idHistorial})">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="eliminarHistorial(${h.idHistorial})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tablaHistorial.appendChild(row);
  });

  renderPaginacion(filtrados.length);
}

// ======================= RENDER PAGINACIÓN =================
function renderPaginacion(totalRegistros) {
  pagWrap.innerHTML = "";
  const totalPaginas = Math.ceil(totalRegistros / tamPagina);
  if (totalPaginas <= 1) return;

  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = `btn btn-sm ${i === paginaActual ? "btn-primary" : "btn-outline-primary"}`;
    btn.onclick = () => {
      paginaActual = i;
      renderTabla();
    };
    pagWrap.appendChild(btn);
  }
}

// ======================= CARGAR HISTORIAL =================
async function loadHistorial() {
  try {
    const res = await fetch(`${API_URL}/consultar?page=0&size=50`);
    if (!res.ok) throw new Error("Error HTTP " + res.status);

    const json = await res.json();
    console.log("Respuesta del backend:", json);

    // ⚠️ Los registros están en json.data.content
    historialCache = json.data.content || [];
    renderTabla();
  } catch (err) {
    console.error("Error al cargar historial:", err);
    Swal.fire("Error", "No se pudo cargar el historial", "error");
  }
}

// ======================= ELIMINAR =================
async function eliminarHistorial(id) {
  Swal.fire({
    title: "¿Eliminar registro?",
    text: "Esta acción no se puede deshacer",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Error HTTP " + res.status);

        historialCache = historialCache.filter(h => h.idHistorial !== id);
        renderTabla();
        Swal.fire("Eliminado", "Registro eliminado con éxito", "success");
      } catch (err) {
        console.error("Error al eliminar:", err);
        Swal.fire("Error", "No se pudo eliminar el registro", "error");
      }
    }
  });
}

// ======================= EDITAR (placeholder) =================
function editarHistorial(id) {
  Swal.fire("Info", `Funcionalidad de editar en construcción (ID: ${id})`, "info");
}

// ======================= EVENTOS =================
if (buscador) {
  buscador.addEventListener("input", e => {
    filtroTexto = e.target.value.toLowerCase();
    paginaActual = 1;
    renderTabla();
  });
}

// ======================= INICIO =================
document.addEventListener("DOMContentLoaded", () => {
  loadHistorial();
});

window.eliminarHistorial = eliminarHistorial;
window.editarHistorial = editarHistorial;

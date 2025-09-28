// ===============================
// OrdenDetalle.js ✅ Completo
// ===============================

import { listarOrdenes, eliminarOrden } from "../Services/OrdenTrabajoService.js";
import { getDetallesByOrden } from "../Services/DetalleOrdenService.js";

// DOM ===========================
const tablaOrdenes = document.querySelector("#tablaOrdenes tbody");
const vacioOrdenes = document.getElementById("vacioOrdenes");
const spinOrdenes = document.getElementById("spinOrdenes");
const pagInfo = document.getElementById("pagInfo");
const totalInfo = document.getElementById("totalInfo");

const tablaDetalle = document.querySelector("#tablaDetalle tbody");
const vacioDetalle = document.getElementById("vacioDetalle");
const spinDetalle = document.getElementById("spinDetalle");

const detId = document.getElementById("detId");
const detFecha = document.getElementById("detFecha");
const detVehiculo = document.getElementById("detVehiculo");
const totalOrden = document.getElementById("totalOrden");

// Filtros y KPIs
const filtroTexto = document.getElementById("filtroTexto");
const fDesde = document.getElementById("fDesde");
const fHasta = document.getElementById("fHasta");
const kpiTotalOrdenes = document.getElementById("kpiTotalOrdenes");

const pageSizeSelect = document.getElementById("pageSize");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");

let state = {
  page: 0,
  size: 10,
  total: 0,
  ordenes: [],
  seleccionada: null,
  filtros: {
    texto: "",
    desde: null,
    hasta: null,
  },
};

// ===============================
// Render tabla de órdenes
// ===============================
function renderTablaOrdenes() {
  if (!state.ordenes.length) {
    tablaOrdenes.innerHTML = "";
    vacioOrdenes.style.display = "block";
    return;
  }
  vacioOrdenes.style.display = "none";

  tablaOrdenes.innerHTML = state.ordenes
    .map((o) => {
      const id = o.id ?? o.idOrden ?? "-";
      const fecha = o.fecha ?? o.fechaOrden ?? null;
      const placa = o.placaVehiculo ?? "-";
      const marca = o.marcaVehiculo ?? "";

      return `
      <tr data-id="${id}">
        <td>${id}</td>
        <td>${fecha ? fecha.substring(0, 10) : "-"}</td>
        <td>${placa} ${marca}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-danger btn-del">
            <i class="fa fa-trash"></i>
          </button>
        </td>
      </tr>`;
    })
    .join("");

  pagInfo.textContent = `Página ${state.page + 1}`;
  totalInfo.textContent = `${state.total} registros`;
}

// ===============================
// Cargar órdenes desde API
// ===============================
async function cargarOrdenes() {
  try {
    spinOrdenes.style.display = "block";

    // 📌 Filtros
    const params = {
      page: state.page,
      size: state.size,
      texto: state.filtros.texto,
      desde: state.filtros.desde,
      hasta: state.filtros.hasta,
    };

    const resp = await listarOrdenes(params);
    state.ordenes = resp.content ?? resp.data ?? [];
    state.total = resp.totalElements ?? state.ordenes.length;

    renderTablaOrdenes();

    // ✅ Actualizar KPI
    kpiTotalOrdenes.textContent = `${state.total} órdenes`;
  } catch (err) {
    console.error("Error cargando órdenes:", err);
    tablaOrdenes.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error al cargar órdenes</td></tr>`;
  } finally {
    spinOrdenes.style.display = "none";
  }
}

// ===============================
// Cargar detalle por orden
// ===============================
async function cargarDetalle(idOrden) {
  try {
    vacioDetalle.style.display = "none";
    spinDetalle.style.display = "block";

    const detalles = await getDetallesByOrden(idOrden);

    if (!detalles.length) {
      tablaDetalle.innerHTML = "";
      vacioDetalle.style.display = "block";
      totalOrden.textContent = "0.00";
      return;
    }

    let total = 0;
    tablaDetalle.innerHTML = detalles
      .map((d) => {
        const precio = d.subtotal ?? d.precioUnitario ?? 0;
        total += precio;
        return `
        <tr>
          <td>${d.id ?? d.idDetalle ?? "-"}</td>
          <td>${d.mantenimientoNombre ?? "—"}</td>
          <td class="text-end">${precio.toFixed(2)}</td>
        </tr>`;
      })
      .join("");

    totalOrden.textContent = total.toFixed(2);
  } catch (err) {
    console.error("Error cargando detalle:", err);
    tablaDetalle.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Error al cargar detalle</td></tr>`;
  } finally {
    spinDetalle.style.display = "none";
  }
}

// ===============================
// Eventos tabla
// ===============================
tablaOrdenes.addEventListener("click", async (e) => {
  const row = e.target.closest("tr");
  if (!row) return;

  // Eliminar
  if (e.target.closest(".btn-del")) {
    const id = row.dataset.id;
    const confirm = await Swal.fire({
      title: "¿Eliminar orden?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      try {
        await eliminarOrden(id);
        Swal.fire("Eliminada", "La orden fue eliminada con éxito", "success");
        await cargarOrdenes();
      } catch (err) {
        console.error("Error al eliminar orden:", err);
        Swal.fire("Error", "No se pudo eliminar la orden", "error");
      }
    }
    return;
  }

  // Seleccionar orden
  const id = row.dataset.id;
  const orden = state.ordenes.find((o) => String(o.id ?? o.idOrden) === id);
  if (!orden) return;

  state.seleccionada = orden;

  detId.textContent = orden.id ?? orden.idOrden;
  detFecha.textContent = (orden.fecha ?? orden.fechaOrden ?? "").substring(0, 10) || "—";
  detVehiculo.textContent =
    (orden.placaVehiculo ?? "-") + " " + (orden.marcaVehiculo ?? "");

  cargarDetalle(orden.id ?? orden.idOrden);
});

// ===============================
// Eventos de filtros
// ===============================
filtroTexto.addEventListener("input", (e) => {
  state.filtros.texto = e.target.value.trim();
  state.page = 0;
  cargarOrdenes();
});

fDesde.addEventListener("change", (e) => {
  state.filtros.desde = e.target.value || null;
  state.page = 0;
  cargarOrdenes();
});

fHasta.addEventListener("change", (e) => {
  state.filtros.hasta = e.target.value || null;
  state.page = 0;
  cargarOrdenes();
});

// ===============================
// Paginación
// ===============================
pageSizeSelect.addEventListener("change", (e) => {
  state.size = parseInt(e.target.value, 10);
  state.page = 0;
  cargarOrdenes();
});

prevPageBtn.addEventListener("click", () => {
  if (state.page > 0) {
    state.page--;
    cargarOrdenes();
  }
});

nextPageBtn.addEventListener("click", () => {
  if ((state.page + 1) * state.size < state.total) {
    state.page++;
    cargarOrdenes();
  }
});

// ===============================
// Init
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  cargarOrdenes();
});

// ===============================
// OrdenDetalle.js FINAL ✅
// ===============================
import { listarOrdenes, eliminarOrden } from "../Services/OrdenTrabajoService.js";
import { getDetallesByOrden } from "../Services/DetalleOrdenService.js";

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
const detCliente = document.getElementById("detCliente");
const estadoBadge = document.getElementById("estadoBadge");
const totalOrden = document.getElementById("totalOrden");

let state = {
  page: 0,
  size: 10,
  total: 0,
  ordenes: [],
  seleccionada: null,
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
      const id = o.idOrden ?? o.id ?? "-";
      const fecha = o.fecha ?? o.fechaOrden ?? null;
      const placa = o.vehiculo?.placa ?? o.placa ?? o.vehiculoPlaca ?? "-";
      const marca = o.vehiculo?.marca ?? o.marca ?? o.vehiculoMarca ?? "";
      const cliente = o.cliente?.nombres ?? o.nombreCliente ?? o.clienteNombre ?? "-";
      const total = o.total ?? o.montoTotal ?? 0;
      const estado = o.estado ?? o.estadoFactura ?? "-";

      return `
      <tr data-id="${id}">
        <td>${id}</td>
        <td>${fecha ? fecha.substring(0, 10) : "-"}</td>
        <td>${placa} ${marca}</td>
        <td>${cliente}</td>
        <td class="text-end">${Number(total).toFixed(2)}</td>
        <td>${estado}</td>
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
// Cargar órdenes
// ===============================
async function cargarOrdenes() {
  try {
    spinOrdenes.style.display = "block";
    const resp = await listarOrdenes({ page: state.page, size: state.size });

    console.log("📥 Órdenes recibidas:", resp);

    state.ordenes = resp.content;
    state.total = resp.totalElements;
    renderTablaOrdenes();
  } catch (err) {
    console.error("❌ Error cargando órdenes:", err);
    tablaOrdenes.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error al cargar órdenes</td></tr>`;
  } finally {
    spinOrdenes.style.display = "none";
  }
}

// ===============================
// Render detalle de orden
// ===============================
async function cargarDetalle(idOrden) {
  try {
    vacioDetalle.style.display = "none";
    spinDetalle.style.display = "block";

    const detalles = await getDetallesByOrden(idOrden);
    console.log("📥 Detalles recibidos para orden", idOrden, ":", detalles);

    if (!detalles.length) {
      tablaDetalle.innerHTML = "";
      vacioDetalle.style.display = "block";
      return;
    }

    tablaDetalle.innerHTML = detalles
      .map(
        (d) => `
      <tr>
        <td>${d.idDetalle ?? d.id ?? "-"}</td>
        <td>${
          d.mantenimiento?.nombre ??
          d.tipoServicio ??
          d.descripcion ??
          d.nombreMantenimiento ??
          d.servicio ??
          "—"
        }</td>
        <td class="text-end">${(d.subtotal ?? d.precio ?? d.monto ?? d.costo ?? 0).toFixed(2)}</td>
      </tr>`
      )
      .join("");
  } catch (err) {
    console.error("❌ Error cargando detalle:", err);
    tablaDetalle.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Error al cargar detalle</td></tr>`;
  } finally {
    spinDetalle.style.display = "none";
  }
}

// ===============================
// Eventos
// ===============================
tablaOrdenes.addEventListener("click", async (e) => {
  const row = e.target.closest("tr");
  if (!row) return;

  // 🔹 Eliminar orden
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
        console.error("❌ Error al eliminar orden:", err);
        Swal.fire("Error", "No se pudo eliminar la orden", "error");
      }
    }
    return;
  }

  // 🔹 Seleccionar orden
  const id = row.dataset.id;
  const orden = state.ordenes.find((o) => String(o.idOrden ?? o.id) === id);
  if (!orden) return;

  state.seleccionada = orden;

  detId.textContent = orden.idOrden ?? orden.id;
  detFecha.textContent = (orden.fecha ?? orden.fechaOrden ?? "").substring(0, 10) || "—";
  detVehiculo.textContent =
    (orden.vehiculo?.placa ?? orden.placa ?? orden.vehiculoPlaca ?? "-") +
    " " +
    (orden.vehiculo?.marca ?? orden.marca ?? orden.vehiculoMarca ?? "");
  detCliente.textContent =
    orden.cliente?.nombres ?? orden.nombreCliente ?? orden.clienteNombre ?? "—";
  estadoBadge.textContent = orden.estado ?? orden.estadoFactura ?? "—";
  totalOrden.textContent = (orden.total ?? orden.montoTotal ?? 0).toFixed(2);

  cargarDetalle(orden.idOrden ?? orden.id);
});

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  cargarOrdenes();
});

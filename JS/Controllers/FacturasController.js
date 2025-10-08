import { 
  getFacturas, 
  payFactura, 
  archiveFactura 
} from "../Services/FacturasService.js";
import { getEmpleados } from "../Services/EmpleadosService.js";
import { getMetodosPago } from "../Services/MetodosPagoService.js";

const $ = (id) => document.getElementById(id);
const tbodyFacturas = $("tbodyFacturas");

let empleadosCache = [];
let metodosPagoCache = [];

async function cargarDatosAuxiliares() {
  try {
    const empsResp = await getEmpleados(0, 100);
    empleadosCache = empsResp?.data?.content || empsResp?.content || empsResp || [];
  } catch {
    empleadosCache = [];
  }

  try {
    const mpsResp = await getMetodosPago();
    metodosPagoCache = mpsResp?.data || mpsResp || [];
  } catch {
    metodosPagoCache = [];
  }
}

function renderAcciones(factura) {
  let acciones = `
    <button class="btn btn-sm btn-secondary" onclick="descargarPDF(${factura.id})">
      <i class="fas fa-file-pdf"></i> PDF
    </button>
  `;

  if (factura.estado === "Pendiente") {
    acciones = `
      <button class="btn btn-sm btn-success me-1" onclick="marcarPagada(${factura.id})">
        <i class="fas fa-check"></i> Marcar como pagada
      </button>
      ${acciones}
    `;
  } else if (factura.estado === "Pagada") {
    acciones = `
      <button class="btn btn-sm btn-warning me-1" onclick="archivarFactura(${factura.id})">
        <i class="fas fa-box-archive"></i> Archivar
      </button>
      ${acciones}
    `;
  }

  return acciones;
}

async function cargarFacturas(page = 0, size = 10, archivada = false) {
  try {
    const res = await getFacturas({ page, size, archivada });
    const facturas = res.content || [];
    tbodyFacturas.innerHTML = "";

    if (!facturas.length) {
      tbodyFacturas.innerHTML = `
        <tr>
          <td colspan="9" class="text-center text-muted">No hay facturas registradas</td>
        </tr>`;
      return;
    }

    facturas.forEach((f, i) => {
      const emp = empleadosCache.find(e =>
        e.idEmpleado === f.idEmpleado || e.id === f.idEmpleado
      );
      const nombreEmpleado = emp ? (emp.nombres || emp.nombre || "Empleado") : "Sin empleado";

      const mp = metodosPagoCache.find(m =>
        m.idMetodoPago === f.idMetodoPago || m.id === f.idMetodoPago
      );
      const nombreMetodo = mp ? (mp.metodo || mp.nombre) : "N/A";

      const estado = f.estado || "Pendiente";
      let badgeClass = "bg-warning";
      if (estado === "Pagada") badgeClass = "bg-success";
      else if (estado === "Archivada") badgeClass = "bg-secondary";
      else if (estado === "Cancelada") badgeClass = "bg-danger";

      tbodyFacturas.innerHTML += `
        <tr>
          <td>${i + 1 + (res.number * size)}</td>
          <td>${f.idOrden || "-"}</td>
          <td>${nombreEmpleado}</td>
          <td>${nombreMetodo}</td>
          <td>${f.fecha ? f.fecha.split("T")[0] : "-"}</td>
          <td>$${!isNaN(f.montoTotal) ? Number(f.montoTotal).toFixed(2) : "0.00"}</td>
          <td><span class="badge ${badgeClass}">${estado}</span></td>
          <td>${f.descripcion || "-"}</td>
          <td>${renderAcciones(f)}</td>
        </tr>`;
    });

  } catch (err) {
    console.error("Error cargando facturas:", err);
    Swal.fire("Error", "No se pudieron cargar las facturas", "error");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await cargarDatosAuxiliares();
  await cargarFacturas(0, 10, false);

  document.querySelectorAll("#tabsFacturas button").forEach(btn => {
    btn.addEventListener("click", async () => {
      document.querySelectorAll("#tabsFacturas button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.getAttribute("data-tab");
      if (tab === "activas") {
        await cargarFacturas(0, 10, false);
      } else {
        await cargarFacturas(0, 10, true);
      }
    });
  });
});

window.descargarPDF = (idFactura) => {
  window.open(`http://localhost:8080/apiFactura/${idFactura}/pdf`, "_blank");
};

window.marcarPagada = async (idFactura) => {
  try {
    await payFactura(idFactura);
    Swal.fire("Éxito", `Factura #${idFactura} marcada como pagada`, "success");
    await cargarFacturas(0, 10, false);
  } catch (err) {
    console.error("Error al pagar:", err);
    Swal.fire("Error", "No se pudo marcar como pagada", "error");
  }
};

window.archivarFactura = async (idFactura) => {
  try {
    await archiveFactura(idFactura);
    Swal.fire("Archivada", `Factura #${idFactura} movida a Archivadas`, "success");
    await cargarFacturas(0, 10, true);
  } catch (err) {
    console.error("Error al archivar:", err);
    Swal.fire("Error", "No se pudo archivar la factura", "error");
  }
}; 
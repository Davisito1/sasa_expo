// ===============================
// FacturasController.js FINAL ✅
// ===============================

import { getFacturas } from "../Services/FacturasService.js";
import { getVehiculos } from "../Services/VehiculosServices.js";
import { listarMantenimientos } from "../Services/MantenimientosService.js";
import { getEmpleados } from "../Services/EmpleadosService.js";
import { getMetodosPago } from "../Services/MetodosPagoService.js";

// Helpers
const $ = (id) => document.getElementById(id);

// DOM
const tbodyFacturas = $("tbodyFacturas");

// Data cache
let empleadosCache = [];
let metodosPagoCache = [];

// ================== CARGAR COMBOS (y cachear) ==================
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

// ================== LISTAR FACTURAS ==================
async function cargarFacturas(page = 0, size = 10) {
  try {
    const res = await getFacturas({ page, size });
    const facturas = res.content || [];
    tbodyFacturas.innerHTML = "";

    if (!facturas.length) {
      tbodyFacturas.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-muted">No hay facturas registradas</td>
        </tr>`;
      return;
    }

    facturas.forEach((f, i) => {
      // Buscar empleado
      const emp = empleadosCache.find(e => 
        e.idEmpleado === f.idEmpleado || e.id === f.idEmpleado
      );
      const nombreEmpleado = emp ? (emp.nombres || emp.nombre || "Empleado") : "Sin empleado";

      // Buscar método de pago
      const mp = metodosPagoCache.find(m => 
        m.idMetodoPago === f.idMetodoPago || m.id === f.idMetodoPago
      );
      const nombreMetodo = mp ? (mp.metodo || mp.nombre) : "N/A";

      // Estado con badge
      const estado = f.estado || "Pendiente";
      let badgeClass = "bg-warning";
      if (estado === "Pagada") badgeClass = "bg-success";
      else if (estado === "Cancelada") badgeClass = "bg-danger";

      // Pintar fila
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
        </tr>`;
    });

  } catch (err) {
    console.error("❌ Error cargando facturas:", err);
    Swal.fire("Error", "No se pudieron cargar las facturas", "error");
  }
}

// ================== INIT ==================
document.addEventListener("DOMContentLoaded", async () => {
  await cargarDatosAuxiliares();
  await cargarFacturas();
});

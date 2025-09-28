// ===============================
// OrdenFacturaController.js FINAL FULL FUNCIONAL ✅
// ===============================

import { crearOrden, actualizarOrden } from "../Services/OrdenTrabajoService.js";
import { agregarDetalle } from "../Services/DetalleOrdenService.js";
import { listarMantenimientos } from "../Services/MantenimientosService.js";
import { getVehiculos } from "../Services/VehiculosServices.js";
import { createFactura, updateFactura, anularFactura } from "../Services/FacturasService.js";
import { getEmpleados } from "../Services/EmpleadosService.js";
import { getMetodosPago } from "../Services/MetodosPagoService.js";

// ================== HELPERS ==================
const $ = (id) => document.getElementById(id);

const selVehiculo = $("selVehiculo");
const fechaOrden = $("fechaOrden");
const idOrden = $("idOrden");
const btnNuevaOrden = $("btnNuevaOrden");
const btnGuardarOrden = $("btnGuardarOrden");
const btnCancelarOrden = $("btnCancelarOrden");
const selMantenimiento = $("selMantenimiento");
const precioMant = $("precioMant");
const btnAgregarDetalle = $("btnAgregarDetalle");
const tbodyDetalle = document.querySelector("#tablaDetalle tbody");
const montoTotal = $("montoTotal");
const idFactura = $("idFactura");
const fechaFactura = $("fechaFactura");
const selEmpleado = $("selEmpleado");
const selMetodoPago = $("selMetodoPago");
const estadoFactura = $("estadoFactura");
const montoFactura = $("montoFactura");
const descripcionFactura = $("descripcionFactura");
const btnGenerarFactura = $("btnGenerarFactura");
const btnAnularFactura = $("btnAnularFactura");

let state = { vehiculo: null, orden: null, detalles: [], total: 0 };

// Exponer state para debug
window.state = state;

function toast(msg, type = "info") {
  Swal.fire({
    text: msg,
    icon: type,
    timer: 2500,
    showConfirmButton: false,
  });
}

// ================== VALIDACIONES ==================
function validarOrden() {
  const errs = [];
  if (!state.vehiculo?.idVehiculo && !state.vehiculo?.id)
    errs.push("Debe seleccionar un vehículo para la orden.");
  if (!fechaOrden.value)
    errs.push("Debe seleccionar la fecha de la orden.");
  if (state.detalles.length === 0)
    errs.push("Debe agregar al menos un mantenimiento.");
  return errs;
}

function validarFactura() {
  const errs = [];
  if (!state.orden?.idOrden && !state.orden?.id)
    errs.push("Debe guardar la orden antes de generar la factura.");
  if (!fechaFactura.value)
    errs.push("Debe seleccionar la fecha de la factura.");

  const mt = Number(montoFactura.value);
  if (isNaN(mt) || mt <= 0)
    errs.push("El monto total de la factura no puede ser 0 ni negativo.");

  if (!selEmpleado.value)
    errs.push("Debe seleccionar el empleado responsable.");
  if (!selMetodoPago.value)
    errs.push("Debe seleccionar un método de pago.");
  return errs;
}

// ================== DETALLES ==================
function calcTotal() {
  state.total = state.detalles.reduce((s, d) => s + (Number(d.subtotal) || 0), 0);
  montoTotal.textContent = state.total.toFixed(2);
  montoFactura.value = state.total.toFixed(2);
}

function renderDetalles() {
  if (!state.detalles.length) {
    tbodyDetalle.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Sin detalles registrados</td></tr>`;
    calcTotal();
    return;
  }
  tbodyDetalle.innerHTML = state.detalles.map(
    (d, i) => `
      <tr data-index="${i}">
        <td>${d.idDetalle ?? "-"}</td>
        <td>${d.nombre ?? ("ID " + d.idMantenimiento)}</td>
        <td><input type="number" class="form-control form-control-sm cantidad-input" min="1" value="${d.cantidad ?? 1}"/></td>
        <td><input type="number" class="form-control form-control-sm precio-input" step="0.01" min="0" max="5000" value="${Number(
          d.precioUnitario || 0
        ).toFixed(2)}"/></td>
        <td class="subtotal-cell">${(d.subtotal ?? (d.cantidad * d.precioUnitario)).toFixed(2)}</td>
        <td><button class="btn btn-sm btn-outline-danger btn-del"><i class="fa fa-trash"></i></button></td>
      </tr>`
  ).join("");
  calcTotal();
}

// ================== EVENTOS ==================
selMantenimiento?.addEventListener("change", () => {
  const opt = selMantenimiento.options[selMantenimiento.selectedIndex];
  const precioSugerido = opt?.dataset?.precio ?? "0";
  precioMant.value = parseFloat(precioSugerido).toFixed(2);
});

btnAgregarDetalle?.addEventListener("click", () => {
  const idM = Number(selMantenimiento.value);
  if (!idM) return toast("Debe seleccionar un mantenimiento antes de agregarlo.", "error");

  const nombre = selMantenimiento.options[selMantenimiento.selectedIndex]?.textContent?.trim();
  const precioUnitario = Number(precioMant.value);

  if (isNaN(precioUnitario) || precioUnitario <= 0)
    return toast("El precio unitario ingresado es inválido.", "error");

  const cantidad = 1;
  const subtotal = cantidad * precioUnitario;

  state.detalles.push({ idMantenimiento: idM, nombre, cantidad, precioUnitario, subtotal });
  renderDetalles();
});

// ================== GUARDAR ORDEN ==================
btnGuardarOrden?.addEventListener("click", async () => {
  const errs = validarOrden();
  if (errs.length) return toast(errs[0], "error");

  try {
    let resp;
    if (!state.orden?.idOrden && !state.orden?.id) {
      resp = await crearOrden({
        idVehiculo: Number(state.vehiculo.idVehiculo || state.vehiculo.id),
        fecha: fechaOrden.value,
      });
    } else {
      resp = await actualizarOrden(state.orden.idOrden || state.orden.id, {
        idVehiculo: Number(state.vehiculo.idVehiculo || state.vehiculo.id),
        fecha: fechaOrden.value,
      });
    }
    state.orden = resp.data || resp;
    idOrden.value = state.orden.idOrden || state.orden.id;

    // Guardar detalles
    for (const d of state.detalles) {
      if (!d.idDetalle) {
        const payload = {
          idOrden: Number(state.orden.idOrden || state.orden.id),
          idMantenimiento: Number(d.idMantenimiento),
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          subtotal: d.subtotal,
        };
        const r = await agregarDetalle(payload);
        d.idDetalle = (r.data || r).idDetalle;
      }
    }

    toast("La orden de trabajo se guardó correctamente.", "success");
  } catch (err) {
    console.error(err);
    toast("Error al guardar la orden. Verifique los datos ingresados.", "error");
  }
});

// ================== FACTURA ==================
btnGenerarFactura?.addEventListener("click", async () => {
  const errs = validarFactura();
  if (errs.length) return toast(errs[0], "error");

  const payload = {
    idOrden: Number(state.orden.idOrden || state.orden.id),
    fecha: fechaFactura.value,
    montoTotal: Number(montoFactura.value),
    idEmpleado: Number(selEmpleado.value),
    idMetodoPago: Number(selMetodoPago.value),
    estado: estadoFactura.value,
    descripcion: (descripcionFactura.value || "").trim() || null,
  };

  try {
    if (!idFactura.value) {
      const fac = await createFactura(payload);
      idFactura.value = fac.idFactura;
      toast("Factura creada correctamente.", "success");
    } else {
      await updateFactura(idFactura.value, payload);
      toast("Factura actualizada correctamente.", "success");
    }
  } catch (err) {
    console.error("❌ Error backend factura:", err);
    try {
      const data = JSON.parse(err.message.split("\n").pop());
      if (data.errors) {
        const msg = Object.values(data.errors).join(" | ");
        toast(msg, "error");
        return;
      }
    } catch {}
    toast("Error al generar la factura. Revise la información proporcionada.", "error");
  }
});

// ================== ANULAR FACTURA ==================
btnAnularFactura?.addEventListener("click", async () => {
  if (!idFactura.value) return toast("No hay factura generada para anular.", "error");

  try {
    await anularFactura(Number(idFactura.value));
    estadoFactura.value = "Cancelada";
    toast("Factura anulada correctamente.", "success");
  } catch (err) {
    console.error(err);
    toast("Error al anular la factura.", "error");
  }
});

// ================== ELIMINAR DETALLE ==================
tbodyDetalle?.addEventListener("click", (e) => {
  if (e.target.closest(".btn-del")) {
    const row = e.target.closest("tr");
    const index = row.dataset.index;
    state.detalles.splice(index, 1);
    renderDetalles();
    toast("Detalle eliminado.", "success");
  }
});

// ================== NUEVA ORDEN ==================
btnNuevaOrden?.addEventListener("click", () => {
  state = { vehiculo: null, orden: null, detalles: [], total: 0 };
  window.state = state;
  selVehiculo.value = "";
  fechaOrden.value = "";
  idOrden.value = "";
  selMantenimiento.value = "";
  precioMant.value = "";
  idFactura.value = "";
  fechaFactura.value = "";
  montoFactura.value = "";
  selEmpleado.value = "";
  selMetodoPago.value = "";
  estadoFactura.value = "Pendiente";
  descripcionFactura.value = "";
  renderDetalles();
  toast("Formulario listo para nueva orden.", "info");
});

// ================== CANCELAR ORDEN ==================
btnCancelarOrden?.addEventListener("click", () => {
  state.detalles = [];
  renderDetalles();
  toast("Se canceló la edición de la orden.", "warning");
});

// ================== COMBOS ==================
async function cargarCombos() {
  try {
    const mansResp = await listarMantenimientos();
    const mans = mansResp?.data?.content || mansResp?.content || mansResp || [];
    selMantenimiento.innerHTML =
      `<option value="">Seleccione…</option>` +
      mans.map((m) => `<option value="${m.idMantenimiento ?? m.id}" data-precio="${m.precio ?? m.costo ?? 0}">
        ${m.nombre ?? m.descripcion ?? m.tipoServicio ?? "Mantenimiento"}
      </option>`).join("");
  } catch {
    selMantenimiento.innerHTML = `<option value="">(sin datos)</option>`;
  }

// ================== CARGAR EMPLEADOS ==================
try {
  const empsResp = await getEmpleados(0, 100);
  // la API puede devolver {data:{content:[]}} o {content:[]} o []
  const emps = empsResp?.data?.content || empsResp?.content || empsResp || [];

  selEmpleado.innerHTML =
    `<option value="">Seleccione…</option>` +
    emps.map((e) => {
      const id = e.idEmpleado || e.id || 0;   // 👈 siempre saca un id válido
      const nombre = e.nombres || e.nombre || e.apellidos || "Empleado";
      return `<option value="${id}">${nombre}</option>`;
    }).join("");
} catch (err) {
  console.error("❌ Error cargando empleados:", err);
  selEmpleado.innerHTML = `<option value="">(sin datos)</option>`;
}

// ================== CARGAR MÉTODOS DE PAGO ==================
try {
  const mpResp = await getMetodosPago();
  // puede venir como {data:[]} o []
  const mps = mpResp?.data || mpResp || [];

  selMetodoPago.innerHTML =
    `<option value="">Seleccione…</option>` +
    mps.map((mp) => {
      const id = mp.idMetodoPago || mp.id || 0; // 👈 id válido
      const nombre = mp.metodo || mp.nombre || "Método";
      return `<option value="${id}">${nombre}</option>`;
    }).join("");
} catch (err) {
  console.error("❌ Error cargando métodos de pago:", err);
  selMetodoPago.innerHTML = `<option value="">(sin datos)</option>`;
}



  try {
    const vehsResp = await getVehiculos(0, 100);
    const vehs = vehsResp?.content || vehsResp || [];
    selVehiculo.innerHTML =
      `<option value="">Seleccione…</option>` +
      vehs.map((v) => {
        return `<option value="${v.idVehiculo || v.id}">
          ${v.placa} - ${v.marca} ${v.modelo}
        </option>`;
      }).join("");

    selVehiculo.addEventListener("change", () => {
      const id = selVehiculo.value;
      state.vehiculo = vehs.find((x) => String(x.idVehiculo || x.id) === id) || null;
    });
  } catch {
    selVehiculo.innerHTML = `<option value="">(sin datos)</option>`;
  }
}

// ================== INIT ==================
document.addEventListener("DOMContentLoaded", async () => {
  await cargarCombos();
});

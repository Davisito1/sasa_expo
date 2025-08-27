import { getPagos, createPago, updatePago, deletePago } from "../Services/PagosService.js";
import { getFacturas } from "../Services/FacturasService.js";
import { getMetodosPago } from "../Services/MetodosPagoService.js";

const tabla = document.getElementById("tablaPagos");
const frmPago = document.getElementById("frmPago");
const pagoModal = new bootstrap.Modal(document.getElementById("mdPago"));
const modalLabel = document.getElementById("pagoModalLabel");

const inputId = document.getElementById("pagoId");
const inputFecha = document.getElementById("fechaPago");
const inputMonto = document.getElementById("montoPago");
const selectFactura = document.getElementById("facturaPago");
const selectMetodo = document.getElementById("metodoPago");

let pagosCache = [];
let facturasCache = [];
let metodosCache = [];

// ======================= Render tabla =======================
function renderTabla(lista) {
  tabla.innerHTML = "";
  if (!lista.length) {
    tabla.innerHTML = `<tr><td colspan="6" class="text-center">No hay registros</td></tr>`;
    return;
  }

  lista.forEach(p => {
    const factura = facturasCache.find(f => f.id === p.idFactura);
    const metodo = metodosCache.find(m => m.idMetodoPago === p.idMetodoPago || m.id === p.idMetodoPago);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.idPago ?? p.id}</td>
      <td>${p.fecha}</td>
      <td>$${p.monto.toFixed(2)}</td>
      <td>${factura ? `Factura #${factura.id} - $${factura.montoTotal}` : p.idFactura}</td>
      <td>${metodo ? metodo.metodo : "—"}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-primary me-2" onclick="editarPago(${p.idPago ?? p.id})"><i class="bi bi-pencil-square"></i></button>
        <button class="btn btn-sm btn-danger" onclick="eliminarPago(${p.idPago ?? p.id})"><i class="bi bi-trash"></i></button>
      </td>`;
    tabla.appendChild(tr);
  });
}

// ======================= Cargar combos =======================
async function cargarCombos() {
  const facturasResp = await getFacturas(0, 50);
  facturasCache = facturasResp?.content ?? facturasResp ?? [];
  selectFactura.innerHTML = `<option value="" disabled selected>Seleccione factura</option>`;
  facturasCache.forEach(f => {
    selectFactura.innerHTML += `<option value="${f.id}">Factura #${f.id} - $${f.montoTotal}</option>`;
  });

  metodosCache = await getMetodosPago();
  selectMetodo.innerHTML = `<option value="" disabled selected>Seleccione método</option>`;
  metodosCache.forEach(m => {
    selectMetodo.innerHTML += `<option value="${m.idMetodoPago ?? m.id}">${m.metodo}</option>`;
  });
}

// ======================= CRUD =======================
window.editarPago = (id) => {
  const p = pagosCache.find(x => (x.idPago ?? x.id) === id);
  if (!p) return;
  modalLabel.textContent = "Editar Pago";
  inputId.value = p.idPago ?? p.id;
  inputFecha.value = p.fecha;
  inputMonto.value = p.monto;
  selectFactura.value = p.idFactura;
  selectMetodo.value = p.idMetodoPago;
  pagoModal.show();
};

window.eliminarPago = async (id) => {
  const ok = await Swal.fire({
    title: "¿Eliminar?",
    text: "Esta acción no se puede deshacer",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  }).then(r => r.isConfirmed);
  if (!ok) return;

  await deletePago(id);
  Swal.fire("Eliminado", "Pago eliminado", "success");
  cargarTabla();
};

frmPago.addEventListener("submit", async (e) => {
  e.preventDefault();
  const dto = {
    fecha: inputFecha.value,
    monto: parseFloat(inputMonto.value),
    idFactura: parseInt(selectFactura.value, 10),
    idMetodoPago: parseInt(selectMetodo.value, 10),
  };

  try {
    if (inputId.value) {
      await updatePago(inputId.value, dto);
      Swal.fire("Éxito", "Pago actualizado", "success");
    } else {
      await createPago(dto);
      Swal.fire("Éxito", "Pago registrado", "success");
    }
    pagoModal.hide();
    cargarTabla();
  } catch (err) {
    Swal.fire("Error", "No se pudo guardar el pago", "error");
    console.error("Error guardando pago", err);
  }
});

// ======================= Init =======================
async function cargarTabla() {
  pagosCache = await getPagos();
  renderTabla(pagosCache);
}

document.addEventListener("DOMContentLoaded", async () => {
  await cargarCombos();
  await cargarTabla();
});

document.getElementById("btnAddPago").addEventListener("click", () => {
  modalLabel.textContent = "Agregar Pago";
  frmPago.reset();
  inputId.value = "";
  pagoModal.show();
});

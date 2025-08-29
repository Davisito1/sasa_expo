// ==================== IMPORTAR SERVICIOS ====================
// CRUD de pagos
import { getPagos, createPago, updatePago, deletePago } from "../Services/PagosService.js";
// Servicios relacionados
import { getFacturas } from "../Services/FacturasService.js";
import { getMetodosPago } from "../Services/MetodosPagoService.js";

// ==================== DOM ====================
// Tabla y modal
const tabla      = document.getElementById("tablaPagos");
const frmPago    = document.getElementById("frmPago");
const pagoModal  = new bootstrap.Modal(document.getElementById("mdPago"));
const modalLabel = document.getElementById("pagoModalLabel");

// Campos del formulario
const inputId        = document.getElementById("pagoId");
const inputFecha     = document.getElementById("fechaPago");
const inputMonto     = document.getElementById("montoPago");
const selectFactura  = document.getElementById("facturaPago");
const selectMetodo   = document.getElementById("metodoPago");

// ==================== VARIABLES GLOBALES ====================
let pagosCache    = []; // pagos cargados en memoria
let facturasCache = []; // facturas disponibles
let metodosCache  = []; // métodos de pago disponibles

// ==================== RENDERIZAR TABLA ====================
// Construye las filas de la tabla con los pagos
function renderTabla(lista) {
  tabla.innerHTML = "";
  if (!lista.length) {
    tabla.innerHTML = `<tr><td colspan="6" class="text-center">No hay registros</td></tr>`;
    return;
  }

  lista.forEach(p => {
    const factura = facturasCache.find(f => f.id === p.idFactura);
    const metodo = metodosCache.find(m => (m.idMetodoPago ?? m.id) === p.idMetodoPago);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.idPago ?? p.id}</td>
      <td>${p.fecha}</td>
      <td>$${p.monto.toFixed(2)}</td>
      <td>${factura ? `Factura #${factura.id} - $${factura.montoTotal}` : p.idFactura}</td>
      <td>${metodo ? metodo.metodo : "—"}</td>
      <td class="text-center">
        <!-- Botón Editar -->
        <button class="btn btn-sm btn-primary me-2" onclick="editarPago(${p.idPago ?? p.id})">
          <i class="bi bi-pencil-square"></i>
        </button>
        <!-- Botón Eliminar -->
        <button class="btn btn-sm btn-danger" onclick="eliminarPago(${p.idPago ?? p.id})">
          <i class="bi bi-trash"></i>
        </button>
      </td>`;
    tabla.appendChild(tr);
  });
}

// ==================== CARGAR COMBOS ====================
// Trae facturas y métodos de pago y los carga en los selects
async function cargarCombos() {
  // Facturas
  const facturasResp = await getFacturas(0, 50);
  facturasCache = facturasResp?.content ?? facturasResp ?? [];
  selectFactura.innerHTML = `<option value="" disabled selected>Seleccione factura</option>`;
  facturasCache.forEach(f => {
    selectFactura.innerHTML += `<option value="${f.id}">Factura #${f.id} - $${f.montoTotal}</option>`;
  });

  // Métodos de pago
  metodosCache = await getMetodosPago();
  selectMetodo.innerHTML = `<option value="" disabled selected>Seleccione método</option>`;
  metodosCache.forEach(m => {
    const idMetodo = m.idMetodoPago ?? m.id;
    selectMetodo.innerHTML += `<option value="${idMetodo}">${m.metodo}</option>`;
  });
}

// ==================== EDITAR PAGO ====================
// Abre el modal con los datos de un pago
window.editarPago = (id) => {
  const p = pagosCache.find(x => (x.idPago ?? x.id) === id);
  if (!p) return Swal.fire("Error", "Pago no encontrado", "error");

  modalLabel.textContent = "Editar Pago";
  inputId.value     = p.idPago ?? p.id;
  inputFecha.value  = p.fecha;
  inputMonto.value  = p.monto;
  selectFactura.value = p.idFactura;
  selectMetodo.value  = p.idMetodoPago;

  pagoModal.show();
};

// ==================== ELIMINAR PAGO ====================
// Confirma y elimina un pago
window.eliminarPago = async (id) => {
  const ok = await Swal.fire({
    title: "¿Eliminar pago?",
    text: "Esta acción no se puede deshacer",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  }).then(r => r.isConfirmed);

  if (!ok) return;

  try {
    await deletePago(id);
    Swal.fire("Eliminado", "Pago eliminado correctamente", "success");
    cargarTabla();
  } catch (err) {
    console.error("Error eliminando pago", err);
    Swal.fire("Error", "No se pudo eliminar el pago", "error");
  }
};

// ==================== GUARDAR (CREAR / EDITAR) ====================
// Lógica al enviar el formulario
frmPago.addEventListener("submit", async (e) => {
  e.preventDefault();

  // -------- Validaciones --------
  if (!inputFecha.value) 
    return Swal.fire("Error", "La fecha es obligatoria", "error");

  const hoy = new Date().toISOString().split("T")[0];
  if (inputFecha.value < hoy) 
    return Swal.fire("Error", "La fecha del pago no puede ser pasada", "error");

  if (!inputMonto.value || isNaN(inputMonto.value) || parseFloat(inputMonto.value) <= 0) 
    return Swal.fire("Error", "El monto debe ser un número positivo", "error");

  if (!selectFactura.value) 
    return Swal.fire("Error", "Debe seleccionar una factura", "error");

  if (!selectMetodo.value) 
    return Swal.fire("Error", "Debe seleccionar un método de pago", "error");

  // Validar que el pago no exceda el monto de la factura
  const facturaSeleccionada = facturasCache.find(f => f.id === parseInt(selectFactura.value, 10));
  if (!facturaSeleccionada) 
    return Swal.fire("Error", "Factura no encontrada", "error");

  const pagosDeFactura = pagosCache.filter(p => p.idFactura === facturaSeleccionada.id && (p.idPago ?? p.id) !== parseInt(inputId.value || 0));
  const totalPagado = pagosDeFactura.reduce((sum, p) => sum + p.monto, 0);
  const nuevoMonto = parseFloat(inputMonto.value);

  if (totalPagado + nuevoMonto > facturaSeleccionada.montoTotal) {
    return Swal.fire("Error", `El pago excede el monto total de la factura. Restante: $${(facturaSeleccionada.montoTotal - totalPagado).toFixed(2)}`, "error");
  }

  // DTO a enviar
  const dto = {
    fecha: inputFecha.value,
    monto: nuevoMonto,
    idFactura: parseInt(selectFactura.value, 10),
    idMetodoPago: parseInt(selectMetodo.value, 10),
  };

  try {
    if (inputId.value) {
      // Editar
      await updatePago(inputId.value, dto);
      Swal.fire("Éxito", "Pago actualizado correctamente", "success");
    } else {
      // Crear
      await createPago(dto);
      Swal.fire("Éxito", "Pago registrado correctamente", "success");
    }
    pagoModal.hide();
    cargarTabla();
  } catch (err) {
    console.error("Error guardando pago", err);
    Swal.fire("Error", "No se pudo guardar el pago", "error");
  }
});

// ==================== CARGAR TABLA ====================
// Trae los pagos desde la API y dibuja la tabla
async function cargarTabla() {
  pagosCache = await getPagos();
  renderTabla(pagosCache);
}

// ==================== INICIO ====================
// Acciones iniciales al cargar la página
document.addEventListener("DOMContentLoaded", async () => {
  await cargarCombos();
  await cargarTabla();
});

// Botón para abrir modal en modo "Agregar"
document.getElementById("btnAddPago").addEventListener("click", () => {
  modalLabel.textContent = "Agregar Pago";
  frmPago.reset();
  inputId.value = "";
  pagoModal.show();
});

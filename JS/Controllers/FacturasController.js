// ===== Importar servicios =====
import {
  getFacturas,
  getFacturaById,
  createFactura,
  updateFactura,
  deleteFactura
} from "../Services/FacturasService.js";
import { getEmpleados } from "../Services/EmpleadosService.js";
import { getMantenimientos } from "../Services/MantenimientoService.js";

// ===== DOM =====
const tablaFacturas = document.getElementById("tablaFacturas");
const pagWrap       = document.getElementById("paginacion");
const selectPageSize= document.getElementById("registrosPorPagina");

const frmAdd  = document.getElementById("frmAgregarFactura");
const frmEdit = document.getElementById("frmEditarFactura");

const modalAdd  = new bootstrap.Modal(document.getElementById("mdAgregarFactura"));
const modalEdit = new bootstrap.Modal(document.getElementById("mdEditarFactura"));

// Campos agregar
const fechaAdd = document.getElementById("fechaFacturaAdd");
const montoAdd = document.getElementById("txtMontoFactura");
const selEmpleadoAdd = document.getElementById("selEmpleadoAdd");
const selMantenimientoAdd = document.getElementById("selMantenimientoAdd");

// Campos editar
const idEdit   = document.getElementById("txtIdFactura");
const fechaEdit= document.getElementById("fechaFacturaEdit");
const montoEdit= document.getElementById("txtEditarMontoFactura");
const selEmpleadoEdit = document.getElementById("selEmpleadoEdit");
const selMantenimientoEdit = document.getElementById("selMantenimientoEdit");

// ===== Variables globales =====
let facturasCache = [];
let empleadosCache = [];
let mantenimientosCache = [];
let paginaActual = 0;
let tamPagina = parseInt(selectPageSize.value, 10);

// ===== Renderizar tabla =====
function renderTabla(facturas) {
  tablaFacturas.innerHTML = "";
  if (!facturas || facturas.length === 0) {
    tablaFacturas.innerHTML = `<tr><td colspan="6" class="text-center">No hay registros</td></tr>`;
    return;
  }

  facturas.sort((a, b) => a.id - b.id);

  facturas.forEach(f => {
    const empleado = f.nombreEmpleado 
      || empleadosCache.find(e => e.id === f.idEmpleado)?.nombres 
      || "—";
    const mantenimiento = f.descripcionMantenimiento 
      || mantenimientosCache.find(m => m.id === f.idMantenimiento)?.descripcion 
      || "—";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${f.id}</td>
      <td>${f.fecha}</td>
      <td>$${f.montoTotal.toFixed(2)}</td>
      <td>${empleado}</td>
      <td>${mantenimiento}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-primary me-2 icon-btn" onclick="editarFactura(${f.id})">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="btn btn-sm btn-danger icon-btn" onclick="eliminarFactura(${f.id})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tablaFacturas.appendChild(tr);
  });
}

// ===== Paginación =====
function renderPaginacion(pageData) {
  pagWrap.innerHTML = "";
  if (!pageData || pageData.totalPages <= 1) return;

  for (let i = 0; i < pageData.totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i + 1;
    btn.className = `btn btn-sm ${i === pageData.number ? "btn-primary" : "btn-outline-primary"}`;
    btn.onclick = async () => {
      paginaActual = i;
      await cargarTabla();
    };
    pagWrap.appendChild(btn);
  }
}

// ===== Cargar combos =====
async function cargarCombos() {
  empleadosCache      = (await getEmpleados()).content ?? [];
  mantenimientosCache = (await getMantenimientos()).content ?? [];

  [selEmpleadoAdd, selEmpleadoEdit].forEach(sel => {
    sel.innerHTML = '<option value="" disabled selected>Seleccione un empleado</option>';
    empleadosCache.forEach(e => {
      const opt = document.createElement("option");
      opt.value = e.id;
      opt.textContent = `${e.nombres} ${e.apellidos}`;
      sel.appendChild(opt);
    });
  });

  [selMantenimientoAdd, selMantenimientoEdit].forEach(sel => {
    sel.innerHTML = '<option value="" disabled selected>Seleccione un mantenimiento</option>';
    mantenimientosCache.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = m.descripcion;
      sel.appendChild(opt);
    });
  });
}

// ===== Cargar tabla =====
async function cargarTabla() {
  const data = await getFacturas(paginaActual, tamPagina);
  facturasCache = data.content;
  renderTabla(facturasCache);
  renderPaginacion(data);
}

// ===== Editar =====
window.editarFactura = async function (id) {
  try {
    const f = await getFacturaById(id);
    if (!f) return Swal.fire("Error", "Factura no encontrada", "error");

    idEdit.value    = f.id;
    fechaEdit.value = f.fecha;
    montoEdit.value = f.montoTotal;

    await cargarCombos();
    selEmpleadoEdit.value = f.idEmpleado;
    selMantenimientoEdit.value = f.idMantenimiento;

    modalEdit.show();
  } catch (err) {
    Swal.fire("Error", "No se pudo cargar la factura", "error");
  }
};

// ===== Eliminar =====
window.eliminarFactura = async function (id) {
  const ok = await Swal.fire({
    title: "¿Eliminar factura?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  }).then(r => r.isConfirmed);

  if (!ok) return;

  try {
    await deleteFactura(id);
    Swal.fire("Eliminada", "Factura eliminada correctamente", "success");
    cargarTabla();
  } catch {
    Swal.fire("Error", "No se pudo eliminar la factura", "error");
  }
};

// ===== Agregar =====
frmAdd.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!fechaAdd.value) return Swal.fire("Error","La fecha es obligatoria","error");
  const hoy = new Date().toISOString().split("T")[0];
  if (fechaAdd.value < hoy) return Swal.fire("Error","La fecha no puede ser pasada","error");

  if (!montoAdd.value || isNaN(montoAdd.value) || parseFloat(montoAdd.value) <= 0) 
    return Swal.fire("Error","El monto debe ser positivo","error");

  if (!selEmpleadoAdd.value) return Swal.fire("Error","Seleccione un empleado","error");
  if (!selMantenimientoAdd.value) return Swal.fire("Error","Seleccione un mantenimiento","error");

  const dto = {
    fecha: fechaAdd.value,
    montoTotal: parseFloat(montoAdd.value),
    idEmpleado: parseInt(selEmpleadoAdd.value, 10),
    idMantenimiento: parseInt(selMantenimientoAdd.value, 10)
  };

  try {
    await createFactura(dto);
    Swal.fire("Éxito", "Factura registrada correctamente", "success");
    modalAdd.hide();
    await cargarTabla();
  } catch {
    Swal.fire("Error", "No se pudo registrar la factura", "error");
  }
});

// ===== Actualizar =====
frmEdit.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!fechaEdit.value) return Swal.fire("Error","La fecha es obligatoria","error");
  const hoy = new Date().toISOString().split("T")[0];
  if (fechaEdit.value < hoy) return Swal.fire("Error","La fecha no puede ser pasada","error");

  if (!montoEdit.value || isNaN(montoEdit.value) || parseFloat(montoEdit.value) <= 0) 
    return Swal.fire("Error","El monto debe ser positivo","error");

  if (!selEmpleadoEdit.value) return Swal.fire("Error","Seleccione un empleado","error");
  if (!selMantenimientoEdit.value) return Swal.fire("Error","Seleccione un mantenimiento","error");

  const dto = {
    fecha: fechaEdit.value,
    montoTotal: parseFloat(montoEdit.value),
    idEmpleado: parseInt(selEmpleadoEdit.value, 10),
    idMantenimiento: parseInt(selMantenimientoEdit.value, 10)
  };

  try {
    await updateFactura(idEdit.value, dto);
    Swal.fire("Éxito", "Factura actualizada correctamente", "success");
    modalEdit.hide();
    await cargarTabla();
  } catch {
    Swal.fire("Error", "No se pudo actualizar la factura", "error");
  }
});

// ===== Inicio =====
document.addEventListener("DOMContentLoaded", async () => {
  await cargarCombos();
  await cargarTabla();
});

// Cambio de tamaño de página
selectPageSize.addEventListener("change", () => {
  tamPagina = parseInt(selectPageSize.value, 10);
  paginaActual = 0;
  cargarTabla();
});

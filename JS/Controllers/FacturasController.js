import {
  getFacturas,
  getFacturaById,
  createFactura,
  updateFactura,
  deleteFactura
} from "../Services/FacturasService.js";

import { getEmpleados } from "../Services/EmpleadosService.js";
import { getMantenimientos } from "../Services/MantenimientoService.js";

// ======================= DOM =======================
const tablaFacturas = document.getElementById("tablaFacturas");
const pagWrap = document.getElementById("paginacion");
const selectPageSize = document.getElementById("registrosPorPagina");

const frmAdd = document.getElementById("frmAgregarFactura");
const frmEdit = document.getElementById("frmEditarFactura");

const modalAdd = new bootstrap.Modal(document.getElementById("mdAgregarFactura"));
const modalEdit = new bootstrap.Modal(document.getElementById("mdEditarFactura"));

// Campos agregar
const fechaAdd = document.getElementById("fechaFacturaAdd");
const montoAdd = document.getElementById("txtMontoFactura");
const selEmpleadoAdd = document.getElementById("selEmpleadoAdd");
const selMantenimientoAdd = document.getElementById("selMantenimientoAdd");

// Campos editar
const idEdit = document.getElementById("txtIdFactura");
const fechaEdit = document.getElementById("fechaFacturaEdit");
const montoEdit = document.getElementById("txtEditarMontoFactura");
const selEmpleadoEdit = document.getElementById("selEmpleadoEdit");
const selMantenimientoEdit = document.getElementById("selMantenimientoEdit");

let facturasCache = [];
let empleadosCache = [];
let mantenimientosCache = [];
let paginaActual = 0;
let tamPagina = parseInt(selectPageSize.value, 10);

function renderTabla(facturas) {
  tablaFacturas.innerHTML = "";
  if (!facturas || facturas.length === 0) {
    tablaFacturas.innerHTML =
      `<tr><td colspan="6" class="text-center">No hay registros</td></tr>`;
    return;
  }

  // 🔹 Ordenar por ID ascendente (1, 2, 3…)
  facturas.sort((a, b) => a.id - b.id);

  facturas.forEach(f => {
    const empleado = f.nombreEmpleado || empleadosCache.find(e => e.id === f.idEmpleado)?.nombres || "—";
    const mantenimiento = f.descripcionMantenimiento || mantenimientosCache.find(m => m.id === f.idMantenimiento)?.descripcion || "—";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${f.id}</td>
      <td>${f.fecha}</td>
      <td>$${f.montoTotal.toFixed(2)}</td>
      <td>${empleado}</td>
      <td>${mantenimiento}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-primary me-2" onclick="editarFactura(${f.id})">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="eliminarFactura(${f.id})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tablaFacturas.appendChild(tr);
  });
}


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

// ======================= CRUD =======================

// Cargar combos empleados/mantenimientos
async function cargarCombos() {
  empleadosCache = (await getEmpleados()).content ?? [];
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

// Cargar tabla
async function cargarTabla() {
  const data = await getFacturas(paginaActual, tamPagina);
  facturasCache = data.content;
  renderTabla(facturasCache);
  renderPaginacion(data);
}

// Abrir modal editar
window.editarFactura = async function (id) {
  try {
    const f = await getFacturaById(id);
    if (!f) return Swal.fire("Error", "Factura no encontrada", "error");

    idEdit.value = f.id;
    fechaEdit.value = f.fecha;
    montoEdit.value = f.montoTotal;
    await cargarCombos();
    selEmpleadoEdit.value = f.idEmpleado;
    selMantenimientoEdit.value = f.idMantenimiento;

    modalEdit.show();
  } catch (err) {
    console.error("Error cargando factura", err);
    Swal.fire("Error", "No se pudo cargar la factura", "error");
  }
};

// Eliminar
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
  } catch (err) {
    Swal.fire("Error", "No se pudo eliminar la factura", "error");
  }
};

// ======================= FORMS =======================

// Guardar nueva
frmAdd.addEventListener("submit", async (e) => {
  e.preventDefault();
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
  } catch (err) {
    console.error("Error creando factura", err);
    Swal.fire("Error", "No se pudo registrar la factura", "error");
  }
});

// Actualizar existente
frmEdit.addEventListener("submit", async (e) => {
  e.preventDefault();
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
  } catch (err) {
    console.error("Error actualizando factura", err);
    Swal.fire("Error", "No se pudo actualizar la factura", "error");
  }
});

// ======================= INIT =======================
document.addEventListener("DOMContentLoaded", async () => {
  await cargarCombos();
  await cargarTabla();
});

selectPageSize.addEventListener("change", () => {
  tamPagina = parseInt(selectPageSize.value, 10);
  paginaActual = 0;
  cargarTabla();
});

// ===== Endpoints =====
const FACT_API_URL = 'https://retoolapi.dev/AE88w9/data';
const MANT_API_URL = 'https://retoolapi.dev/35dv6Q/data'; // usa el MISMO que en mantenimiento.html
const EMP_API_URL  = 'https://retoolapi.dev/mm42wr/empleados'; // tu endpoint de empleados

// ===== DOM =====
const modalAgregar = document.getElementById('mdAgregarFactura');
const modalEditar  = document.getElementById('mdEditarFactura');
const tablaFacturas = document.getElementById('tablaFacturas');
const inputBuscar  = document.getElementById('buscar');

// Agregar
const selEmpleadoAdd      = document.getElementById('selEmpleadoAdd');
const selMantenimientoAdd = document.getElementById('selMantenimientoAdd');
const inMontoAdd          = document.getElementById('txtMontoFactura');
const inFechaAdd          = document.getElementById('fechaFactura');

// Editar
const inIdEdit            = document.getElementById('txtIdFactura');
const selEmpleadoEdit     = document.getElementById('selEmpleadoEdit');
const selMantenimientoEdit= document.getElementById('selMantenimientoEdit');
const inMontoEdit         = document.getElementById('txtEditarMontoFactura');
const inFechaEdit         = document.getElementById('editarFechaFactura');

// ===== Estado =====
let facturasCache = [];
let empleadosCache = [];
let mantCache = [];
const mantById = new Map(); // id -> {id, descripcion, fecha}

// ===== Utils =====
const fmtUSD = (n) =>
  new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
    .format(Number(n || 0));

const eNombre = (emp) =>
  emp?.nombreCompleto ?? emp?.nombre ?? `${emp?.nombre || ''} ${emp?.apellido || ''}`.trim();

function obtenerNombreEmpleadoPorId(id) {
  const emp = empleadosCache.find(e => Number(e.id) === Number(id));
  return emp ? eNombre(emp) : null;
}
function obtenerDescMantPorId(id) {
  const m = mantById.get(Number(id));
  return m
    ? `${m.descripcion || 'Sin descripción'}${m.fecha ? ` (${m.fecha})` : ''}`
    : (id ? `#${id}` : '—');
}

// ===== Normalizadores =====
function normalizarFactura(f) {
  const id = f.idFactura ?? f.id ?? f.Id ?? null;

  let idEmpleado = Number(f.idEmpleado ?? f.idempleado ?? f.IDEmpleado ?? f.empleadoId ?? null);
  let empleadoNombre = f.empleadoNombre ?? f.Empleado ?? f.empleado ?? null;
  if (!idEmpleado && empleadoNombre && /^\d+$/.test(String(empleadoNombre))) {
    idEmpleado = Number(empleadoNombre); empleadoNombre = null;
  }

  let idMantenimiento = Number(
    f.idMantenimiento ?? f.idmantenimiento ?? f.Mantenimiento ?? f.id_mantenimiento ?? null
  );
  if (isNaN(idMantenimiento)) idMantenimiento = null;

  const montoTotal = Number((f.montoTotal ?? f.Monto ?? f.monto ?? 0));
  const fechaRaw = (f.fecha ?? f.Fecha ?? '').toString();
  const fecha = fechaRaw ? fechaRaw.split('T')[0] : '';

  return { id, idEmpleado, empleadoNombre, idMantenimiento, montoTotal, fecha };
}

// campos posibles para descripción/fecha en tu API de mantenimiento
const MANT_DESC_KEYS = [
  'descripcion','Descripcion',
  'trabajoRealizado','TrabajoRealizado',
  'detalle','Detalle',
  'servicio','Servicio',
  'tipoMantenimiento','TipoMantenimiento',
  'descripcionMantenimiento','DescripcionMantenimiento',
  'observacion','Observacion'
];
const MANT_DATE_KEYS = ['fecha','Fecha','fechaIngreso','fecha_mantenimiento','FechaMantenimiento'];

function pick(obj, keys) {
  for (const k of keys) {
    if (obj[k] != null && String(obj[k]).trim() !== '') return String(obj[k]).trim();
  }
  return '';
}

function normalizarMantenimiento(m) {
  const id =
    m.id ?? m.idMantenimiento ?? m.Id ?? m.ID ?? m.id_mantenimiento ?? m.IDMantenimiento;

  const descripcion = pick(m, MANT_DESC_KEYS) ||
                      [m.marca || m.Marca, m.modelo || m.Modelo, m.vehiculo || m.Vehiculo]
                        .filter(Boolean).join(' ').trim();

  const fechaRaw = pick(m, MANT_DATE_KEYS);
  const fecha = fechaRaw ? fechaRaw.toString().split('T')[0] : '';

  return { id, descripcion, fecha };
}

// ===== Fechas min/max =====
function configurarLimitesFecha() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  const hoyStr = `${yyyy}-${mm}-${dd}`;
  const min = '2000-01-01';
  if (inFechaAdd)  { inFechaAdd.max = hoyStr;  inFechaAdd.min = min; }
  if (inFechaEdit) { inFechaEdit.max = hoyStr; inFechaEdit.min = min; }
}

// ===== Renders =====
function renderSelectEmpleados(selectEl, selectedId = '') {
  if (!selectEl) return;
  const prev = selectedId || selectEl.value || '';
  selectEl.innerHTML = `<option value="" disabled ${prev ? '' : 'selected'}>Seleccione un empleado</option>`;
  empleadosCache.forEach(e => {
    const opt = document.createElement('option');
    opt.value = e.id;
    opt.textContent = `${e.id} - ${eNombre(e) || 'Empleado'}`;
    if (String(e.id) === String(prev)) opt.selected = true;
    selectEl.appendChild(opt);
  });
}

function renderSelectMantenimientos(selectEl, selectedId = '') {
  if (!selectEl) return;
  const prev = selectedId || selectEl.value || '';
  selectEl.innerHTML = `<option value="" disabled ${prev ? '' : 'selected'}>Seleccione un mantenimiento</option>`;
  const lista = Array.from(mantById.values());
  if (lista.length === 0) {
    selectEl.innerHTML += `<option disabled>— Sin mantenimientos —</option>`;
    return;
  }
  lista.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.descripcion || 'Sin descripción'}${m.fecha ? ` (${m.fecha})` : ''}`;
    opt.title = `ID: ${m.id}`;
    if (String(m.id) === String(prev)) opt.selected = true;
    selectEl.appendChild(opt);
  });
}

function actualizarTabla(facturas) {
  if (!tablaFacturas) return;
  tablaFacturas.innerHTML = '';
  if (!facturas || facturas.length === 0) {
    tablaFacturas.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No hay facturas registradas.</td></tr>`;
    return;
  }
  facturas.forEach(f => {
    const nombreEmp = obtenerNombreEmpleadoPorId(f.idEmpleado) || f.empleadoNombre || (f.idEmpleado ? `Empleado #${f.idEmpleado}` : '—');
    const descMant  = obtenerDescMantPorId(f.idMantenimiento);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${f.id ?? ''}</td>
      <td>${nombreEmp}</td>
      <td title="ID: ${f.idMantenimiento ?? ''}">${descMant}</td>
      <td>${fmtUSD(f.montoTotal)}</td>
      <td>${f.fecha ?? ''}</td>
      <td>
        <button class="btn btn-sm btn-primary me-2 icon-btn editar" data-id="${f.id}" title="Editar">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="btn btn-sm btn-danger icon-btn eliminar" data-id="${f.id}" title="Eliminar">
          <i class="bi bi-trash"></i>
        </button>
      </td>`;
    tablaFacturas.appendChild(tr);
  });

  document.querySelectorAll('.editar').forEach(btn =>
    btn.addEventListener('click', () => editarFactura(btn.dataset.id))
  );
  document.querySelectorAll('.eliminar').forEach(btn =>
    btn.addEventListener('click', () => eliminarFactura(btn.dataset.id))
  );
}

// ===== Cargas =====
async function cargarEmpleados() {
  try {
    const res = await fetch(EMP_API_URL);
    if (!res.ok) throw new Error('No se pudieron cargar los empleados');
    const data = await res.json();
    empleadosCache = (data || []).map(e => ({
      id: e.id ?? e.idEmpleado ?? e.Id ?? e.ID,
      nombre: e.nombre ?? e.Nombre,
      apellido: e.apellido ?? e.Apellido,
      nombreCompleto: e.nombreCompleto ?? e.NombreCompleto ?? (e.nombre && e.apellido ? `${e.nombre} ${e.apellido}` : (e.nombre ?? ''))
    }));
  } catch (err) {
    empleadosCache = [];
    console.warn('Empleados no cargados:', err);
  }
}

async function cargarMantenimientos() {
  try {
    const res = await fetch(MANT_API_URL);
    if (!res.ok) throw new Error('No se pudieron cargar los mantenimientos');
    const data = await res.json();
    mantCache.length = 0;
    mantById.clear();

    (data || []).forEach(raw => {
      const m = normalizarMantenimiento(raw);
      if (m.id == null) return;
      mantCache.push(m);
      mantById.set(Number(m.id), m);
    });
  } catch (err) {
    mantCache = [];
    mantById.clear();
    console.warn('Mantenimientos no cargados:', err);
  }
}

// Hidrata por id si faltara alguno
async function hidratarMantFaltantesPorId(ids = []) {
  const faltantes = [...new Set(ids.filter(id => id && !mantById.has(Number(id))))];
  if (faltantes.length === 0) return;
  await Promise.all(faltantes.map(async (id) => {
    try {
      const r = await fetch(`${MANT_API_URL}/${id}`);
      if (!r.ok) return;
      const m = normalizarMantenimiento(await r.json());
      if (m.id != null) mantById.set(Number(m.id), m);
    } catch {}
  }));
}

// ===== Filtro Topbar =====
function aplicarFiltro() {
  const q = (inputBuscar?.value || '').toLowerCase().trim();
  if (!q) { actualizarTabla(facturasCache); return; }
  const filtradas = facturasCache.filter(f => {
    const nombreEmp = obtenerNombreEmpleadoPorId(f.idEmpleado) || f.empleadoNombre || '';
    const mantDesc  = obtenerDescMantPorId(f.idMantenimiento).toLowerCase();
    return (
      String(f.id ?? '').toLowerCase().includes(q) ||
      nombreEmp.toLowerCase().includes(q) ||
      mantDesc.includes(q) ||
      String(f.idMantenimiento ?? '').toLowerCase().includes(q) ||
      String(f.fecha ?? '').toLowerCase().includes(q) ||
      fmtUSD(f.montoTotal).toLowerCase().includes(q)
    );
  });
  actualizarTabla(filtradas);
}
function BuscarFactura() { aplicarFiltro(); }
inputBuscar?.addEventListener('input', aplicarFiltro);

// ===== Modales =====
function abrirModalAgregar() {
  document.activeElement && document.activeElement.blur();
  renderSelectEmpleados(selEmpleadoAdd);
  renderSelectMantenimientos(selMantenimientoAdd);
  modalAgregar?.showModal?.();
}
function cerrarModalAgregar() { modalAgregar?.close?.(); }
function cerrarModalEditar()  { modalEditar?.close?.(); }

// ===== CRUD =====
document.getElementById('frmAgregarFactura')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    idEmpleado: Number(selEmpleadoAdd.value),
    idMantenimiento: Number(selMantenimientoAdd.value),
    montoTotal: Number(parseFloat(inMontoAdd.value || '0').toFixed(2)),
    fecha: inFechaAdd.value
  };
  if (!validarFacturaCampos(payload)) return;

  try {
    const response = await fetch(FACT_API_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    if (response.ok) {
      Swal.fire('¡Éxito!', 'Factura agregada correctamente.', 'success');
      cerrarModalAgregar();
      await cargarFacturas(); // repinta con descripciones
      selEmpleadoAdd.value = ''; selMantenimientoAdd.value = ''; inMontoAdd.value = ''; inFechaAdd.value = '';
    } else {
      const result = await response.json().catch(() => ({}));
      Swal.fire('Error', result.message || 'Error al agregar la factura.', 'error');
    }
  } catch (error) {
    console.error('Error al agregar factura:', error);
    Swal.fire('Error', 'Hubo un problema al agregar la factura.', 'error');
  }
});

async function editarFactura(id) {
  try {
    const res = await fetch(`${FACT_API_URL}/${id}`);
    if (!res.ok) throw new Error('No se pudo obtener la factura');
    const f = normalizarFactura(await res.json());

    // por si ese idMant no está en caché, lo traemos
    await hidratarMantFaltantesPorId([f.idMantenimiento]);

    inIdEdit.value = f.id;
    renderSelectEmpleados(selEmpleadoEdit, f.idEmpleado || '');
    renderSelectMantenimientos(selMantenimientoEdit, f.idMantenimiento || '');

    inMontoEdit.value = (Number(f.montoTotal || 0)).toFixed(2);
    inFechaEdit.value = f.fecha || '';

    document.activeElement && document.activeElement.blur();
    modalEditar?.showModal?.();
  } catch (error) {
    console.error('Error al cargar factura:', error);
    Swal.fire('Error', 'No se pudo cargar la factura.', 'error');
  }
}

document.getElementById('frmEditarFactura')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = inIdEdit.value;
  const payload = {
    idEmpleado: Number(selEmpleadoEdit.value),
    idMantenimiento: Number(selMantenimientoEdit.value),
    montoTotal: Number(parseFloat(inMontoEdit.value || '0').toFixed(2)),
    fecha: inFechaEdit.value
  };
  if (!validarFacturaCampos(payload)) return;

  try {
    const res = await fetch(`${FACT_API_URL}/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    if (res.ok) {
      Swal.fire('¡Éxito!', 'Factura actualizada correctamente.', 'success');
      cerrarModalEditar();
      await cargarFacturas(); // repinta con descripciones
    } else {
      const result = await res.json().catch(() => ({}));
      Swal.fire('Error', result.message || 'Error al actualizar la factura.', 'error');
    }
  } catch (error) {
    console.error('Error al actualizar factura:', error);
    Swal.fire('Error', 'Hubo un problema al actualizar la factura.', 'error');
  }
});

// Eliminar
async function eliminarFactura(id) {
  const conf = await Swal.fire({
    title: "¿Eliminar?",
    text: "Esta acción no se puede deshacer",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  });
  if (!conf.isConfirmed) return;

  try {
    const res = await fetch(`${FACT_API_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('No se pudo eliminar');
    Swal.fire('Eliminada', 'Factura eliminada correctamente.', 'success');
    await cargarFacturas();
  } catch (err) {
    console.error('Error al eliminar factura:', err);
    Swal.fire('Error', 'No se pudo eliminar la factura.', 'error');
  }
}

// ===== Validaciones =====
function validarFacturaCampos({ idEmpleado, idMantenimiento, montoTotal, fecha }) {
  if (!Number.isFinite(idEmpleado) || idEmpleado <= 0) return Swal.fire('Validación','Seleccione un empleado.','warning'), false;
  if (!Number.isFinite(idMantenimiento) || idMantenimiento <= 0) return Swal.fire('Validación','Seleccione un mantenimiento.','warning'), false;
  if (!Number.isFinite(montoTotal) || montoTotal < 0) return Swal.fire('Validación','El monto total debe ser un número ≥ 0.','warning'), false;
  const parts = montoTotal.toString().split('.'); if (parts[1] && parts[1].length > 2) return Swal.fire('Validación','El monto total solo puede tener 2 decimales.','warning'), false;
  if (!fecha) return Swal.fire('Validación','La fecha es obligatoria.','warning'), false;
  const d = new Date(fecha), hoy = new Date(), min = new Date('2000-01-01');
  if (d > hoy) return Swal.fire('Validación','La fecha no puede ser futura.','warning'), false;
  if (d < min) return Swal.fire('Validación','La fecha no puede ser anterior a 2000-01-01.','warning'), false;
  return true;
}

// ===== Cargar Facturas =====
async function cargarFacturas() {
  try {
    const res = await fetch(FACT_API_URL);
    if (!res.ok) throw new Error('No se pudieron cargar las facturas');
    const data = await res.json();

    // Normaliza y guarda en caché
    facturasCache = (data || []).map(normalizarFactura);

    // Asegurarnos de tener en caché las descripciones de mantenimientos usadas por estas facturas
    const idsMant = facturasCache.map(f => f.idMantenimiento).filter(Boolean);
    await hidratarMantFaltantesPorId(idsMant);

    // Render
    actualizarTabla(facturasCache);
  } catch (err) {
    console.error('Error al cargar facturas:', err);
    if (tablaFacturas) {
      tablaFacturas.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error al cargar facturas.</td></tr>`;
    }
  }
}

// ===== Init =====
// ⚠️ Cargamos en ORDEN: primero MANTENIMIENTOS (para tener descripciones), luego EMPLEADOS, luego FACTURAS.
async function init() {
  configurarLimitesFecha();
  await cargarMantenimientos();
  await cargarEmpleados();
  renderSelectMantenimientos(selMantenimientoAdd);
  renderSelectMantenimientos(selMantenimientoEdit);
  renderSelectEmpleados(selEmpleadoAdd);
  renderSelectEmpleados(selEmpleadoEdit);
  await cargarFacturas();
}
init();

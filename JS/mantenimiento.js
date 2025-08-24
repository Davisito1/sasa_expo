// ===== APIs =====
const API_URL = 'https://retoolapi.dev/35dv6Q/data';                 // Mantenimientos
const VEHICULOS_API_URL = 'https://retoolapi.dev/4XQf28/anadirvehiculo'; // Vehículos

// ===== DOM =====
const tablaMantenimiento = document.getElementById("tablaMantenimiento");
const frmAgregar = document.getElementById("frmAgregarMantenimiento");
const frmEditar = document.getElementById("frmEditarMantenimiento");

// Modales
const modalAgregar = document.getElementById("mdAgregarMantenimiento");
const modalEditar = document.getElementById("mdEditarMantenimiento");

// Selects de vehículos
const selVehiculo = document.getElementById("selVehiculo");
const selVehiculoEditar = document.getElementById("selVehiculoEditar");

// Diccionario idVehiculo -> nombre/placa/modelo
let vehiculosMap = {};

// ========== Utilidades ==========
function toISODate(value) {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
    return iso.split("T")[0];
  } catch {
    return value;
  }
}

function setMinHoy(input) {
  if (!input) return;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  input.min = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
}

// Limitar fecha MÍNIMA a hoy (agregar y editar)
(function () {
  setMinHoy(document.getElementById("txtFechaRealizacion"));
  setMinHoy(document.getElementById("txtFechaRealizacionEditar"));
})();

// Extrae el número de un código (ej. "MTTO-0012" -> 12)
function extraerNumeroCodigo(cod = "") {
  const m = String(cod).match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

// Formatea con prefijo y ceros (13 -> "MTTO-0013")
function formatearCodigo(n) {
  return `MTTO-${String(n).padStart(4, "0")}`;
}

// Genera el siguiente código según el máximo existente
async function generarCodigoMantenimiento() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("No se pudo leer mantenimientos");
    const lista = await res.json();

    let max = 0;
    lista.forEach(item => {
      const n = extraerNumeroCodigo(item.codigoMantenimiento);
      if (n && n > max) max = n;
    });

    return formatearCodigo(max + 1 || 1);
  } catch (e) {
    console.error("No fue posible calcular el código. Fallback.", e);
    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 12);
    return `MTTO-${stamp}`;
  }
}

// ========== Cargar vehículos ==========
async function cargarVehiculos() {
  try {
    const res = await fetch(VEHICULOS_API_URL);
    if (!res.ok) throw new Error("No se pudo obtener vehículos");
    const lista = await res.json();

    vehiculosMap = {};
    const options = ['<option value="" disabled selected>Seleccione un vehículo</option>'];

    lista.forEach(v => {
      const id = v.id ?? v.idVehiculo ?? "";
      const placa = v.placa || v.Placa || "";
      const modelo = v.modelo || v.Modelo || "";
      const marca  = v.marca  || v.Marca  || "";
      const nombre = (placa || modelo || marca)
        ? `${placa}${placa && (modelo || marca) ? " - " : ""}${marca} ${modelo}`.trim()
        : `Vehículo #${id}`;

      if (id !== "") {
        vehiculosMap[id] = nombre;
        options.push(`<option value="${id}">${nombre}</option>`);
      }
    });

    if (selVehiculo) selVehiculo.innerHTML = options.join("");
    if (selVehiculoEditar) selVehiculoEditar.innerHTML = options.join("");
  } catch (err) {
    console.error("Error al cargar vehículos:", err);
    vehiculosMap = {};
    const fallback = '<option value="" disabled selected>Sin vehículos</option>';
    if (selVehiculo) selVehiculo.innerHTML = fallback;
    if (selVehiculoEditar) selVehiculoEditar.innerHTML = fallback;
  }
}

// ========== Modales ==========
async function abrirModalAgregar() {
  if (frmAgregar) frmAgregar.reset();
  await cargarVehiculos();

  const inputCodigo = document.getElementById("txtCodigoMantenimiento");
  if (inputCodigo) {
    inputCodigo.value = await generarCodigoMantenimiento();
    inputCodigo.readOnly = true;
  }

  const inputFecha = document.getElementById("txtFechaRealizacion");
  setMinHoy(inputFecha);

  if (modalAgregar) modalAgregar.showModal();
}
function cerrarModalAgregar() {
  if (frmAgregar) frmAgregar.reset();
  if (modalAgregar) modalAgregar.close();
}
function cerrarModalEditar() {
  if (frmEditar) frmEditar.reset();
  if (modalEditar) modalEditar.close();
}

// ========== Validaciones ==========
function validarDescripcion(desc) {
  return typeof desc === "string" && desc.trim().length >= 5 && desc.trim().length <= 500;
}
// Solo HOY o FUTURA
function validarFecha(fecha) {
  const f = new Date(fecha);
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  return !isNaN(f.getTime()) && f >= hoy;
}
function validarIdVehiculo(id) {
  return id !== "" && id !== null && id !== undefined && !Number.isNaN(Number(id));
}
function validarFormulario(m) {
  if (!validarDescripcion(m.descripcionTrabajo)) {
    Swal.fire("Error", "La descripción debe tener entre 5 y 500 caracteres.", "warning");
    return false;
  }
  if (!validarFecha(m.fechaRealizacion)) {
    Swal.fire("Error", "La fecha debe ser hoy o futura.", "warning");
    return false;
  }
  if (!m.codigoMantenimiento || m.codigoMantenimiento.trim().length === 0) {
    Swal.fire("Error", "No se generó el código de mantenimiento.", "warning");
    return false;
  }
  if (!validarIdVehiculo(m.idVehiculo)) {
    Swal.fire("Error", "Seleccione un vehículo válido.", "warning");
    return false;
  }
  return true;
}

// ========== Render (orden de columnas alineado a la BD/HTML) ==========
function filaHTML(m) {
  const id           = m.id ?? m.idMantenimiento ?? "";
  const descripcion  = m.descripcionTrabajo ?? "";
  const fecha        = toISODate(m.fechaRealizacion);
  const codigo       = m.codigoMantenimiento ?? "";
  const idVehiculo   = m.idVehiculo ?? "";
  const nombreVeh    = vehiculosMap[idVehiculo] || `Vehículo #${idVehiculo}`;

  return `
    <tr>
      <td>${id}</td>
      <td class="text-start">${descripcion}</td>
      <td><span class="badge-fecha">${fecha || "-"}</span></td>
      <td><code class="codigo">${codigo}</code></td>
      <td>${nombreVeh}</td>
      <td>
        <button class="btn btn-sm btn-primary me-2 icon-btn" onclick="cargarParaEditarMantenimiento(${id})" title="Editar">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="btn btn-sm btn-danger icon-btn" onclick="eliminarMantenimiento(${id})" title="Eliminar">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `;
}

function mostrarVacio() {
  if (!tablaMantenimiento) return;
  tablaMantenimiento.innerHTML = `
    <tr>
      <td colspan="6" class="py-4 text-muted">Sin registros de mantenimiento.</td>
    </tr>
  `;
}

function mostrarCargando() {
  if (!tablaMantenimiento) return;
  tablaMantenimiento.innerHTML = `
    <tr>
      <td colspan="6" class="py-4 text-muted">Cargando mantenimientos...</td>
    </tr>
  `;
}

function mostrarMantenimientos(lista) {
  if (!tablaMantenimiento) return;
  if (!lista || !lista.length) { mostrarVacio(); return; }
  tablaMantenimiento.innerHTML = lista.map(filaHTML).join("");
}

// ========== CRUD ==========
async function cargarMantenimiento() {
  try {
    mostrarCargando();
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Fetch mantenimientos falló");
    const data = await res.json();
    mostrarMantenimientos(data);
  } catch (error) {
    console.error("Error al cargar mantenimientos:", error);
    Swal.fire("Error", "No se pudieron cargar los mantenimientos.", "error");
    mostrarVacio();
  }
}

// Agregar
if (frmAgregar) {
  frmAgregar.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Autogenera código si viene vacío
    const inputCod = document.getElementById("txtCodigoMantenimiento");
    let codigo = (inputCod?.value || "").trim();
    if (!codigo) {
      codigo = await generarCodigoMantenimiento();
      if (inputCod) inputCod.value = codigo;
    }

    const nuevo = {
      // Respetando campos de la tabla: descripcionTrabajo, fechaRealizacion, codigoMantenimiento, idVehiculo
      descripcionTrabajo: document.getElementById("txtDescripcionTrabajo").value.trim(),
      fechaRealizacion: document.getElementById("txtFechaRealizacion").value,
      codigoMantenimiento: codigo,
      idVehiculo: Number(document.getElementById("selVehiculo").value)
    };

    if (!validarFormulario(nuevo)) return;

    const btnSubmit = frmAgregar.querySelector('button[type="submit"]');
    const prevText = btnSubmit?.innerHTML;
    if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.innerHTML = 'Guardando...'; }

    try {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevo)
      });
      cerrarModalAgregar();
      await cargarMantenimiento();
      Swal.fire("Agregado", "El mantenimiento fue agregado correctamente.", "success");
    } catch (error) {
      console.error("Error al agregar:", error);
      Swal.fire("Error", "No se pudo agregar el mantenimiento.", "error");
    } finally {
      if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = prevText; }
    }
  });
}

// Cargar para editar
async function cargarParaEditarMantenimiento(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`);
    if (!res.ok) throw new Error("No se encontró mantenimiento");
    const data = await res.json();

    await cargarVehiculos();

    document.getElementById("txtIdEditarMantenimiento").value = data.id ?? data.idMantenimiento ?? "";
    document.getElementById("txtDescripcionTrabajoEditar").value = data.descripcionTrabajo ?? "";
    document.getElementById("txtFechaRealizacionEditar").value = toISODate(data.fechaRealizacion);
    document.getElementById("txtCodigoMantenimientoEditar").value = data.codigoMantenimiento ?? "";
    document.getElementById("selVehiculoEditar").value = (data.idVehiculo ?? "").toString();

    setMinHoy(document.getElementById("txtFechaRealizacionEditar"));

    if (modalEditar) modalEditar.showModal();
  } catch (error) {
    console.error("Error al cargar mantenimiento:", error);
    Swal.fire("Error", "No se pudo cargar el mantenimiento para editar.", "error");
  }
}

// Editar
if (frmEditar) {
  frmEditar.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("txtIdEditarMantenimiento").value;

    const editado = {
      // Misma estructura que en agregar
      descripcionTrabajo: document.getElementById("txtDescripcionTrabajoEditar").value.trim(),
      fechaRealizacion: document.getElementById("txtFechaRealizacionEditar").value,
      codigoMantenimiento: document.getElementById("txtCodigoMantenimientoEditar").value.trim(),
      idVehiculo: Number(document.getElementById("selVehiculoEditar").value)
    };

    if (!validarFormulario(editado)) return;

    const btnSubmit = frmEditar.querySelector('button[type="submit"]');
    const prevText = btnSubmit?.innerHTML;
    if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.innerHTML = 'Actualizando...'; }

    try {
      await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editado)
      });
      cerrarModalEditar();
      await cargarMantenimiento();
      Swal.fire("Actualizado", "El mantenimiento fue actualizado correctamente.", "success");
    } catch (error) {
      console.error("Error al actualizar:", error);
      Swal.fire("Error", "No se pudo actualizar el mantenimiento.", "error");
    } finally {
      if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = prevText; }
    }
  });
}

// Eliminar
async function eliminarMantenimiento(id) {
  const result = await Swal.fire({
    title: '¿Eliminar?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      await cargarMantenimiento();
      Swal.fire("Eliminado", "El mantenimiento fue eliminado.", "success");
    } catch (error) {
      console.error("Error al eliminar:", error);
      Swal.fire("Error", "No se pudo eliminar el mantenimiento.", "error");
    }
  }
}

// Buscar (coincide contra todo el contenido de la fila)
function buscarMantenimiento() {
  const texto = document.getElementById("buscar").value.toLowerCase().trim();
  const filas = tablaMantenimiento?.getElementsByTagName("tr") ?? [];
  Array.from(filas).forEach((fila) => {
    const contenido = fila.textContent.toLowerCase();
    fila.style.display = contenido.includes(texto) ? "" : "none";
  });
}

// Inicializar
document.addEventListener("DOMContentLoaded", () => {
  cargarVehiculos().then(() => cargarMantenimiento());
});

// Exponer funciones globales (para onclick en HTML)
window.cargarParaEditarMantenimiento = cargarParaEditarMantenimiento;
window.eliminarMantenimiento = eliminarMantenimiento;
window.buscarMantenimiento = buscarMantenimiento;
window.abrirModalAgregar = abrirModalAgregar;
window.cerrarModalAgregar = cerrarModalAgregar;
window.cerrarModalEditar = cerrarModalEditar;

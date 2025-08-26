

const API_URL_PAGOS    = "https://retoolapi.dev/Tym5QB/pagos";
const API_URL_FACTURAS = "https://retoolapi.dev/AE88w9/data";

/* ====== Nodos ====== */
const btnNuevoPago    = document.querySelector(".btn-add");
const modalPago       = document.getElementById("modalPago");
const formPago        = document.getElementById("formPago");
const tbody           = document.getElementById("tablaPagos");
const inputBuscar     = document.getElementById("buscar");
const selectPorPagina = document.getElementById("registrosPorPagina");
const paginacionWrap  = document.getElementById("paginacion");

const inputIdPago      = document.getElementById("idPago");       // hidden
const inputFechaPago   = document.getElementById("fechaPago");
const inputMonto       = document.getElementById("monto");
const selectMetodo     = document.getElementById("idMetodoPago");
const inputIdFactura   = document.getElementById("idFactura");

/* ====== Estado ====== */
let pagos = [];
let filtrados = [];
let paginaActual = 1;
let porPagina = (selectPorPagina && parseInt(selectPorPagina.value, 10)) || 10;
let idEditando = null;

/* ====== Catálogo local de MétodoPago ======
   Si luego expones API de métodos, rellena dinámicamente aquí.
   Estructura: { id: number, nombre: string }                                        */
const METODOS_PAGO = [
  { id: 1, nombre: "Tarjeta" },
  { id: 2, nombre: "Efectivo" },
  { id: 3, nombre: "Transferencia" },
];

/* ====== Utils ====== */
const fmtFecha = (val) => (val ? new Date(val).toLocaleDateString("es-ES") : "");

const fmtMonto = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return "";
  // Mostrar como $ 1,234.56
  return `$ ${num.toFixed(2)}`;
};

const normalizarPago = (raw) => {
  // Soporta tanto nombres "de API vieja" (fecha, metodo, factura) como "de BD" (fechaPago, idMetodoPago, idFactura)
  return {
    idPago:        raw.idPago ?? raw.id ?? null,
    fechaPago:     raw.fechaPago ?? raw.fecha ?? null,
    monto:         raw.monto ?? null,
    idMetodoPago:  raw.idMetodoPago ?? raw.metodo ?? null, // puede venir como número (id) o string (nombre)
    idFactura:     raw.idFactura ?? raw.factura ?? null,
    metodoTexto:   raw.metodo ?? null, // si viene texto, lo guardamos para mostrar
  };
};

const metodoNombre = (idOMetodo) => {
  // Si ya es un string (p.ej. "Tarjeta"), lo devolvemos tal cual
  if (typeof idOMetodo === "string") return idOMetodo;
  const found = METODOS_PAGO.find((m) => String(m.id) === String(idOMetodo));
  return found ? found.nombre : (idOMetodo ?? "");
};

function validarFormPago(datos) {
  // datos: { fechaPago, monto, idMetodoPago, idFactura }
  if (!datos.fechaPago || !datos.monto || !datos.idMetodoPago || !datos.idFactura) {
    Swal.fire("Campos obligatorios", "Completa todos los campos.", "warning");
    return false;
  }

  // Monto > 0 con 2 decimales
  const monto = Number(datos.monto);
  if (!Number.isFinite(monto) || monto <= 0) {
    Swal.fire("Monto inválido", "El monto debe ser mayor a 0.", "warning");
    return false;
  }
  // Forzar 2 decimales en input
  inputMonto.value = monto.toFixed(2);

  // Fecha no futura ni > 6 meses atrás
  const fechaIngresada = new Date(datos.fechaPago);
  const hoy = new Date();
  // normalizar 00:00
  hoy.setHours(0,0,0,0);
  fechaIngresada.setHours(0,0,0,0);

  const seisMesesAtras = new Date();
  seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);
  seisMesesAtras.setHours(0,0,0,0);

  if (fechaIngresada > hoy) {
    Swal.fire("Fecha inválida", "La fecha no puede ser futura.", "warning");
    return false;
  }
  if (fechaIngresada < seisMesesAtras) {
    Swal.fire("Fecha inválida", "La fecha no puede tener más de 6 meses.", "warning");
    return false;
  }

  // idFactura solo lectura (por seguridad)
  if (inputIdFactura.readOnly !== true) {
    inputIdFactura.readOnly = true;
  }

  return true;
}

/* ====== Inicializar combo Método de Pago ====== */
function poblarComboMetodos() {
  if (!selectMetodo) return;
  // Limpia y carga opciones
  selectMetodo.innerHTML = `<option value="">Seleccione un método</option>`;
  METODOS_PAGO.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = String(m.id);
    opt.textContent = `${m.id} - ${m.nombre}`;
    selectMetodo.appendChild(opt);
  });
}

/* ====== Facturas ====== */
async function setUltimaFacturaEnForm() {
  try {
    const res = await fetch(API_URL_FACTURAS);
    const facturas = await res.json();
    if (Array.isArray(facturas) && facturas.length > 0) {
      // Detectar campo id de la factura (id, idFactura, etc.)
      const obtenerId = (f) => f.idFactura ?? f.id ?? f.Id ?? f.ID ?? null;
      const ultima = facturas.reduce((a, b) => {
        const ida = Number(obtenerId(a)) || -Infinity;
        const idb = Number(obtenerId(b)) || -Infinity;
        return ida > idb ? a : b;
      });
      const idUltima = obtenerId(ultima);
      inputIdFactura.value = idUltima ?? "";
      inputIdFactura.readOnly = true;
    } else {
      inputIdFactura.value = "";
    }
  } catch (e) {
    console.error(e);
    Swal.fire("Error", "No se pudo obtener la última factura.", "error");
    inputIdFactura.value = "";
  }
}

/* ====== Modal helpers (expuestos en window por si los llama el HTML) ====== */
function abrirModalPago() {
  idEditando = null;
  formPago.reset();
  poblarComboMetodos();
  setUltimaFacturaEnForm();

  // Sugerir fecha = hoy
  const hoyISO = new Date().toISOString().slice(0, 10);
  inputFechaPago.value = hoyISO;

  // Asegurar lectura sólo para factura
  inputIdFactura.readOnly = true;

  modalPago.showModal();
}

function cerrarModalPago() {
  modalPago.close();
  formPago.reset();
  idEditando = null;
}

window.abrirModalPago = abrirModalPago;
window.cerrarModalPago = cerrarModalPago;

/* Cerrar al click fuera del contenido */
modalPago?.addEventListener("click", (e) => {
  if (e.target.tagName === "DIALOG") cerrarModalPago();
});

/* ====== Data ====== */
async function cargarPagos() {
  try {
    const res = await fetch(API_URL_PAGOS);
    if (!res.ok) throw new Error("Error al cargar pagos");
    const data = await res.json();
    pagos = Array.isArray(data) ? data.map(normalizarPago) : [];
  } catch (e) {
    console.error(e);
    pagos = [];
    Swal.fire("Error", "No se pudieron cargar los pagos.", "error");
  }
  aplicarFiltro();
  render();
}

/* ====== Filtro + selector ====== */
function aplicarFiltro() {
  const q = (inputBuscar?.value || "").trim().toLowerCase();
  if (!q) {
    filtrados = [...pagos];
  } else {
    filtrados = pagos.filter((p) => {
      const campos = [
        p.idPago,
        p.fechaPago,
        p.monto,
        metodoNombre(p.idMetodoPago || p.metodoTexto),
        p.idFactura,
      ];
      return campos.some((v) => String(v ?? "").toLowerCase().includes(q));
    });
  }
  paginaActual = 1;
}

function setPorPagina() {
  porPagina = (selectPorPagina && parseInt(selectPorPagina.value, 10)) || 10;
  paginaActual = 1;
  render();
}

/* ====== Render ====== */
function render() {
  renderTabla();
  renderPaginacion();
  rewireRowActions();
}

function renderTabla() {
  if (!tbody) return;
  const total = filtrados.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  paginaActual = Math.min(Math.max(1, paginaActual), totalPaginas);

  const start = (paginaActual - 1) * porPagina;
  const end = start + porPagina;
  const vista = filtrados.slice(start, end);

  if (vista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center">Sin resultados</td></tr>`;
    return;
  }

  tbody.innerHTML = vista
    .map((p) => {
      const metodo = metodoNombre(p.idMetodoPago || p.metodoTexto);
      return `
        <tr>
          <td>${p.idPago ?? ""}</td>
          <td>${fmtFecha(p.fechaPago)}</td>
          <td>${fmtMonto(p.monto)}</td>
          <td>${metodo}</td>
          <td>${p.idFactura ?? ""}</td>
          <td>
            <button class="icon-btn btn-primary editar" data-id="${p.idPago}" title="Editar">
              <i class="bi bi-pencil-square"></i>
            </button>
            <button class="icon-btn btn-danger eliminar" data-id="${p.idPago}" title="Eliminar">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>`;
    })
    .join("");
}

function renderPaginacion() {
  if (!paginacionWrap) return;

  const total = filtrados.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  paginaActual = Math.min(Math.max(1, paginaActual), totalPaginas);

  // Solo tres items: ««  [n]  »»
  let html = `
    <ul class="pagination pagination-compact mb-0">
      <li class="page-item ${paginaActual === 1 ? "disabled" : ""}">
        <a class="page-link" href="#" data-action="prev" aria-label="Anterior">&laquo;&laquo;</a>
      </li>
      <li class="page-item active">
        <a class="page-link" href="#" data-action="noop" tabindex="-1">${paginaActual}</a>
      </li>
      <li class="page-item ${paginaActual === totalPaginas ? "disabled" : ""}">
        <a class="page-link" href="#" data-action="next" aria-label="Siguiente">&raquo;&raquo;</a>
      </li>
    </ul>`;

  paginacionWrap.innerHTML = html;

  paginacionWrap.querySelectorAll("a[data-action]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const action = a.getAttribute("data-action");
      if (action === "prev" && paginaActual > 1) {
        paginaActual--;
        render();
      } else if (action === "next" && paginaActual < totalPaginas) {
        paginaActual++;
        render();
      }
    });
  });
}



function rewireRowActions() {
  // Editar
  tbody.querySelectorAll(".editar").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      try {
        const res = await fetch(`${API_URL_PAGOS}/${id}`);
        if (!res.ok) throw new Error("No se pudo cargar el pago");
        const raw = await res.json();
        const data = normalizarPago(raw);

        idEditando = id;
        formPago.reset();
        poblarComboMetodos();

        inputIdPago.value     = data.idPago ?? "";
        inputFechaPago.value  = data.fechaPago ? new Date(data.fechaPago).toISOString().slice(0,10) : "";
        inputMonto.value      = Number(data.monto ?? 0) > 0 ? Number(data.monto).toFixed(2) : "";

        // Si la API guarda el nombre ("Tarjeta"), mapea al id del combo
        const nombre = metodoNombre(data.idMetodoPago || data.metodoTexto);
        const opt = METODOS_PAGO.find((m) => m.nombre === nombre);
        selectMetodo.value = opt ? String(opt.id) : "";

        inputIdFactura.value  = data.idFactura ?? "";
        inputIdFactura.readOnly = true;

        modalPago.showModal();
      } catch (e) {
        console.error(e);
        Swal.fire("Error", "No se pudo cargar el pago.", "error");
      }
    };
  });

  // Eliminar
  tbody.querySelectorAll(".eliminar").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const confirm = await Swal.fire({
        title: "¿Estás seguro?",
        text: "Esta acción eliminará el pago permanentemente.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });
      if (!confirm.isConfirmed) return;

      try {
        const res = await fetch(`${API_URL_PAGOS}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Error al eliminar");
        Swal.fire("Eliminado", "El pago fue eliminado correctamente.", "success");
        await cargarPagos();
      } catch (e) {
        console.error(e);
        Swal.fire("Error", "No se pudo eliminar el pago.", "error");
      }
    };
  });
}

/* ====== Eventos ====== */
btnNuevoPago?.addEventListener("click", abrirModalPago);

formPago?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const idMetodoSeleccionado = selectMetodo.value; // id numérico
  const nombreMetodo = metodoNombre(idMetodoSeleccionado); // nombre para compatibilidad

  const datosUI = {
    fechaPago:   inputFechaPago.value,
    monto:       inputMonto.value,
    idMetodoPago: idMetodoSeleccionado,
    idFactura:   inputIdFactura.value,
  };

  if (!validarFormPago(datosUI)) return;

  // Payload compatible con tu API actual:
  // - Campos "de BD"
  // - Y además "metodo" (texto) y "factura" (por compatibilidad con API antigua)
  const payload = {
    // BD
    idPago:       idEditando ? Number(idEditando) : undefined,
    fechaPago:    datosUI.fechaPago,
    monto:        Number(datosUI.monto),
    idMetodoPago: Number(datosUI.idMetodoPago),
    idFactura:    Number(datosUI.idFactura),
    // Compatibilidad
    fecha:        datosUI.fechaPago,
    metodo:       nombreMetodo,
    factura:      Number(datosUI.idFactura),
  };

  try {
    if (idEditando) {
      const res = await fetch(`${API_URL_PAGOS}/${idEditando}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      Swal.fire("Pago actualizado", "El pago fue actualizado correctamente.", "success");
    } else {
      const res = await fetch(API_URL_PAGOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error al crear");
      Swal.fire("Pago agregado", "El nuevo pago ha sido registrado.", "success");
    }

    idEditando = null;
    cerrarModalPago();
    await cargarPagos();
  } catch (e) {
    console.error(e);
    Swal.fire("Error", "Error al guardar el pago.", "error");
  }
});

/* ====== UX menor ====== */
inputBuscar?.addEventListener("input", () => {
  aplicarFiltro();
  render();
});
selectPorPagina?.addEventListener("change", setPorPagina);

// Forzar 2 decimales al salir del input monto
inputMonto?.addEventListener("blur", () => {
  const n = Number(inputMonto.value);
  if (Number.isFinite(n) && n > 0) inputMonto.value = n.toFixed(2);
});

/* ====== Inicio ====== */
document.addEventListener("DOMContentLoaded", async () => {
  poblarComboMetodos();
  await cargarPagos();
});

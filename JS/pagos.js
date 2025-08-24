const API_URL_PAGOS    = "https://retoolapi.dev/Tym5QB/pagos";
const API_URL_FACTURAS = "https://retoolapi.dev/AE88w9/data";

/* ====== Nodos ====== */
const btnNuevoPago   = document.querySelector(".btn-add");              // botón "Nuevo Pago"
const modalPago      = document.getElementById("modalPago");
const formNuevoPago  = document.getElementById("formNuevoPago");
const tbody          = document.getElementById("tablaPagos");
const inputBuscar    = document.getElementById("buscar");
const selectPorPagina= document.getElementById("registrosPorPagina");
const paginacionWrap = document.getElementById("paginacion");

/* ====== Estado ====== */
let pagos = [];
let filtrados = [];
let paginaActual = 1;
let porPagina = (selectPorPagina && parseInt(selectPorPagina.value, 10)) || 10;
let idEditando = null;

/* ====== Utils ====== */
const fmtFecha = (val) =>
  val ? new Date(val).toLocaleDateString("es-ES") : "";
const fmtMonto = (n) => {
  const num = Number(n);
  return Number.isFinite(num) ? num.toFixed(2).replace(".", ",") : "";
};

function validarFormPago(d) {
  if (!d.fecha || !d.monto || !d.metodo || !d.factura) {
    Swal.fire("Campos obligatorios", "Completa todos los campos.", "warning");
    return false;
  }
  const monto = parseFloat(d.monto);
  if (isNaN(monto) || monto <= 0) {
    Swal.fire("Monto inválido", "El monto debe ser mayor a 0.", "warning");
    return false;
  }
  const fechaIngresada = new Date(d.fecha);
  const hoy = new Date();
  const seisMesesAtras = new Date();
  seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

  if (fechaIngresada > hoy) {
    Swal.fire("Fecha inválida", "La fecha no puede ser futura.", "warning");
    return false;
  }
  if (fechaIngresada < seisMesesAtras) {
    Swal.fire("Fecha inválida", "La fecha no puede ser mayor a 6 meses atrás.", "warning");
    return false;
  }
  return true;
}

/* ====== Facturas ====== */
async function setUltimaFacturaEnForm() {
  try {
    const res = await fetch(API_URL_FACTURAS);
    const facturas = await res.json();
    if (Array.isArray(facturas) && facturas.length > 0) {
      const ultima = facturas.reduce((a, b) => (+a.id > +b.id ? a : b));
      formNuevoPago.factura.value = ultima.id;
    } else {
      formNuevoPago.factura.value = "N/A";
    }
  } catch (e) {
    console.error(e);
    Swal.fire("Error", "No se pudo obtener la última factura.", "error");
    formNuevoPago.factura.value = "";
  }
}

/* ====== Modal helpers (también existen helpers inline en HTML) ====== */
function abrirModalPago() {
  idEditando = null;
  formNuevoPago.reset();
  formNuevoPago.factura.readOnly = true;
  setUltimaFacturaEnForm();
  modalPago.showModal();
}
function cerrarModalPago() {
  modalPago.close();
  formNuevoPago.reset();
  idEditando = null;
}
window.abrirModalPago = abrirModalPago;  // por si el HTML los llama
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
    pagos = await res.json();
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
  if (!q) filtrados = [...pagos];
  else {
    filtrados = pagos.filter((p) => {
      const campos = [p.id, p.fecha, p.monto, p.metodo, p.factura];
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
    .map(
      (pago) => `
      <tr>
        <td>${pago.id ?? ""}</td>
        <td>${fmtFecha(pago.fecha)}</td>
        <td>${fmtMonto(pago.monto)}</td>
        <td>${pago.metodo ?? ""}</td>
        <td>${pago.factura ?? ""}</td>
        <td>
          <button class="icon-btn btn-primary editar" data-id="${pago.id}" title="Editar">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button class="icon-btn btn-danger eliminar" data-id="${pago.id}" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>`
    )
    .join("");
}

function renderPaginacion() {
  if (!paginacionWrap) return;

  const total = filtrados.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const btn = (label, disabled, action, extra = "") =>
    `<button class="btn ${extra}" ${disabled ? "disabled" : ""} data-action="${action}">${label}</button>`;

  let html = "";
  html += btn("Anterior", paginaActual === 1, "prev");
  for (let p = 1; p <= totalPaginas; p++) {
    html += btn(p, false, `page-${p}`, p === paginaActual ? "btn-primary" : "");
  }
  html += btn("Siguiente", paginaActual === totalPaginas, "next");
  paginacionWrap.innerHTML = html;

  paginacionWrap.querySelectorAll("button[data-action]").forEach((b) => {
    b.addEventListener("click", () => {
      const action = b.getAttribute("data-action");
      if (action === "prev" && paginaActual > 1) {
        paginaActual--;
        render();
      } else if (action === "next") {
        if (paginaActual < totalPaginas) {
          paginaActual++;
          render();
        }
      } else if (action?.startsWith("page-")) {
        paginaActual = parseInt(action.split("-")[1], 10) || 1;
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
        const data = await res.json();

        idEditando = id;
        formNuevoPago.reset();
        formNuevoPago.fecha.value   = data.fecha ?? "";
        formNuevoPago.monto.value   = data.monto ?? "";
        formNuevoPago.metodo.value  = data.metodo ?? "";
        formNuevoPago.factura.value = data.factura ?? "";
        formNuevoPago.factura.readOnly = true;

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

formNuevoPago?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const datos = {
    fecha: formNuevoPago.fecha.value,
    monto: formNuevoPago.monto.value,
    metodo: formNuevoPago.metodo.value,
    factura: formNuevoPago.factura.value,
  };

  if (!validarFormPago(datos)) return;

  try {
    if (idEditando) {
      const res = await fetch(`${API_URL_PAGOS}/${idEditando}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      Swal.fire("Pago actualizado", "El pago fue actualizado correctamente.", "success");
    } else {
      const res = await fetch(API_URL_PAGOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
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

inputBuscar?.addEventListener("input", () => {
  aplicarFiltro();
  render();
});
selectPorPagina?.addEventListener("change", setPorPagina);

/* ====== Inicio ====== */
document.addEventListener("DOMContentLoaded", cargarPagos);

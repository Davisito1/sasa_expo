const API_URL = "https://retoolapi.dev/SjcKwl/Notificacion";
const tbody = document.querySelector("#tablaNotificaciones");

// Paginación
let paginaActual = 1;
let registrosPorPagina = 10;
let notificaciones = [];

// Cargar todas las notificaciones
async function cargarNotificaciones() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Error al obtener datos");

    const data = await res.json();
    // Guardamos en memoria para búsqueda/paginación
    notificaciones = data;
    mostrarNotificaciones();
  } catch (err) {
    console.error("Error al cargar notificaciones:", err);
    Swal.fire("Error", "No se pudieron cargar las notificaciones.", "error");
  }
}

// Mostrar notificaciones en la tabla con búsqueda y paginación
function mostrarNotificaciones() {
  tbody.innerHTML = "";

  // Filtro de búsqueda
  const textoBusqueda = document.querySelector("#buscar")?.value?.toLowerCase() || "";
  let filtradas = notificaciones.filter(
    (n) =>
      n.Mensaje?.toLowerCase().includes(textoBusqueda) ||
      n.Fecha?.toLowerCase().includes(textoBusqueda) ||
      (n.Leido ? "leído" : "no leído").includes(textoBusqueda)
  );

  // Paginación
  const inicio = (paginaActual - 1) * registrosPorPagina;
  const fin = inicio + registrosPorPagina;
  const pagina = filtradas.slice(inicio, fin);

  if (pagina.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center">No hay notificaciones.</td></tr>`;
  } else {
    pagina.forEach((n) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${n.id}</td>
        <td>${n.Mensaje}</td>
        <td>${n.Fecha}</td>
        <td>
          <span class="badge ${n.Leido ? "bg-secondary" : "bg-warning"}">
            ${n.Leido ? "Leído" : "No leído"}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-success marcar-btn me-2" data-id="${n.id}" ${
        n.Leido ? "disabled" : ""
      }>
            <i class="fas fa-check"></i> Marcar como leído
          </button>
          <button class="btn btn-sm btn-danger eliminar-btn" data-id="${n.id}">
            <i class="fas fa-trash-alt"></i> Eliminar
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  renderizarPaginacion(filtradas.length);
}

// Renderizar botones de paginación
function renderizarPaginacion(totalRegistros) {
  const paginacion = document.getElementById("paginacion");
  if (!paginacion) return;

  paginacion.innerHTML = "";
  const totalPaginas = Math.ceil(totalRegistros / registrosPorPagina);

  if (totalPaginas <= 1) return;

  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = `btn btn-sm ${i === paginaActual ? "btn-primary" : "btn-outline-primary"}`;
    btn.addEventListener("click", () => {
      paginaActual = i;
      mostrarNotificaciones();
    });
    paginacion.appendChild(btn);
  }
}

// Marcar como leído
document.addEventListener("click", async (e) => {
  if (e.target.closest(".marcar-btn")) {
    const id = e.target.closest(".marcar-btn").dataset.id;

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Leido: true }),
      });

      if (!res.ok) throw new Error("Error al marcar como leído");

      Swal.fire("¡Hecho!", "Notificación marcada como leída.", "success");
      cargarNotificaciones();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo marcar como leída.", "error");
    }
  }
});

// Eliminar notificación
document.addEventListener("click", async (e) => {
  if (e.target.closest(".eliminar-btn")) {
    const id = e.target.closest(".eliminar-btn").dataset.id;

    const confirm = await Swal.fire({
      title: "¿Eliminar?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#bb2d3b",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sí, eliminar",
    });

    if (confirm.isConfirmed) {
      try {
        const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Error al eliminar");

        Swal.fire("Eliminado", "La notificación ha sido eliminada.", "success");
        cargarNotificaciones();
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "No se pudo eliminar la notificación.", "error");
      }
    }
  }
});

// Marcar todas como leídas
document.getElementById("btnMarcarTodas")?.addEventListener("click", async () => {
  try {
    const pendientes = notificaciones.filter((n) => !n.Leido);
    for (let n of pendientes) {
      await fetch(`${API_URL}/${n.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Leido: true }),
      });
    }
    Swal.fire("¡Hecho!", "Todas las notificaciones fueron marcadas como leídas.", "success");
    cargarNotificaciones();
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "No se pudieron marcar todas.", "error");
  }
});

// Filtros
document.getElementById("buscar")?.addEventListener("input", () => {
  paginaActual = 1;
  mostrarNotificaciones();
});

document.getElementById("registrosPorPagina")?.addEventListener("change", (e) => {
  registrosPorPagina = parseInt(e.target.value);
  paginaActual = 1;
  mostrarNotificaciones();
});

// Carga inicial
cargarNotificaciones();

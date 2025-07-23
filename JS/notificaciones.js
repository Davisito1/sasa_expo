const API_URL = "https://retoolapi.dev/SjcKwl/Notificacion";
const tbody = document.querySelector("#tablaNotificaciones"); // ID corregido

// Cargar todas las notificaciones
async function cargarNotificaciones() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Error al obtener datos");

    const data = await res.json();
    mostrarNotificaciones(data);
  } catch (err) {
    console.error("Error al cargar notificaciones:", err);
    Swal.fire("Error", "No se pudieron cargar las notificaciones.", "error");
  }
}

// Mostrar notificaciones en la tabla
function mostrarNotificaciones(lista) {
  tbody.innerHTML = "";

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center">No hay notificaciones.</td></tr>`;
    return;
  }

  lista.forEach((n) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${n.id}</td>
      <td>${n.Mensaje}</td>
      <td>${n.Fecha}</td>
      <td>
        <span class="badge bg-${n.Leido ? "secondary" : "warning"}">
          ${n.Leido ? "Leído" : "No leído"}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-success marcar-btn me-2" data-id="${n.id}" ${n.Leido ? "disabled" : ""}>
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

// Carga inicial
cargarNotificaciones();

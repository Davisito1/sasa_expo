const API_URL = 'https://retoolapi.dev/80QQcT/HistorialAPI';
const tablaHistorial = document.querySelector("#tablaHistorial tbody");
const buscador = document.getElementById("buscadorHistorial");

let historialData = [];

// Cargar historial desde API
async function cargarHistorial() {
  try {
    const res = await fetch(API_URL);
    historialData = await res.json();
    mostrarHistorial(historialData);
  } catch (err) {
    console.error("Error al cargar historial", err);
  }
}

// Mostrar historial en la tabla
function mostrarHistorial(lista) {
  tablaHistorial.innerHTML = "";

  if (lista.length === 0) {
    tablaHistorial.innerHTML = `<tr><td colspan="6" class="text-center">No hay registros.</td></tr>`;
    return;
  }

  lista.forEach(item => {
    tablaHistorial.innerHTML += `
      <tr>
        <td>${item.id}</td>
        <td>${formatearFechaHora(item["Fecha y hora"])}</td>
        <td>${item.Usuario}</td>
        <td>${item["Tipo Accion"]}</td>
        <td>${item.Entidad}</td>
        <td>${item.Decripcion}</td>
      </tr>
    `;
  });
}

// Buscar
buscador.addEventListener("input", () => {
  const texto = buscador.value.toLowerCase();
  const filtrados = historialData.filter(item =>
    item.Entidad?.toLowerCase().includes(texto) ||
    item.Usuario?.toLowerCase().includes(texto) ||
    item.Decripcion?.toLowerCase().includes(texto) ||
    item["Tipo Accion"]?.toLowerCase().includes(texto)
  );
  mostrarHistorial(filtrados);
});

function formatearFechaHora(fechaStr) {
  if (!fechaStr) return "No disponible";
  const fecha = new Date(fechaStr);
  return fecha.toLocaleString();
}

// Iniciar
document.addEventListener("DOMContentLoaded", cargarHistorial);

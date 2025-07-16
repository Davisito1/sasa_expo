const apiVehiculos = 'https://retoolapi.dev/1nB30q/data';
const apiClientes = 'https://retoolapi.dev/PifxKy/data';
const apiEmpleados = 'https://retoolapi.dev/mm42wr/empleados';
const apiCitas = 'https://retoolapi.dev/K3dg6S/citas';

let chart = null;

document.addEventListener("DOMContentLoaded", () => {
  cargarTotales();
});

async function cargarTotales() {
  try {
    const [vehiculos, clientes, empleados, citas] = await Promise.all([
      fetch(apiVehiculos).then(res => res.json()),
      fetch(apiClientes).then(res => res.json()),
      fetch(apiEmpleados).then(res => res.json()),
      fetch(apiCitas).then(res => res.json()),
    ]);

    document.getElementById("vehiculosTotal").textContent = vehiculos.length;
    document.getElementById("clientesTotal").textContent = clientes.length;
    document.getElementById("empleadosTotal").textContent = empleados.length;
    document.getElementById("citasTotal").textContent = citas.length;

    // Guardamos los datos globales
    window.datosDashboard = { vehiculos, clientes, empleados, citas };
  } catch (error) {
    console.error("Error al cargar datos:", error);
    Swal.fire("Error", "No se pudieron cargar los datos del dashboard.", "error");
  }
}

// ---------- Gráfica Vehículos por marca ----------
function mostrarGraficaVehiculos() {
  const vehiculos = window.datosDashboard?.vehiculos || [];
  const marcas = {};

  vehiculos.forEach(v => {
    const marca = (v.Marca || v.marca || "Desconocido").toUpperCase();
    marcas[marca] = (marcas[marca] || 0) + 1;
  });

  renderizarGrafica(Object.keys(marcas), Object.values(marcas), "Vehículos por marca");
}

// ---------- Gráfica Clientes por género ----------
function mostrarGraficaClientes() {
  const clientes = window.datosDashboard?.clientes || [];
  const generos = { Masculino: 0, Femenino: 0, Otro: 0 };

  clientes.forEach(c => {
    const genero = (c.Genero || c.genero || "").toLowerCase();
    if (genero === "masculino") generos.Masculino++;
    else if (genero === "femenino") generos.Femenino++;
    else generos.Otro++;
  });

  renderizarGrafica(Object.keys(generos), Object.values(generos), "Clientes por género");
}

// ---------- Ver Citas del día ----------
function verCitasHoy() {
  const citas = window.datosDashboard?.citas || [];
  const hoy = new Date().toISOString().split("T")[0];

  const citasHoy = citas.filter(c => (c.Fecha || c.fecha) === hoy);

  if (citasHoy.length > 0) {
    const lista = citasHoy.map(c => `<li>${c.Cliente || c.cliente || "Sin nombre"} - ${c.Hora || c.hora}</li>`).join("");
    Swal.fire({
      icon: "info",
      title: "Citas para hoy",
      html: `<ul>${lista}</ul>`,
      confirmButtonText: "Cerrar"
    });
  } else {
    Swal.fire({
      icon: "warning",
      title: "Sin citas hoy",
      text: "No hay citas registradas para el día de hoy."
    });
  }
}

// ---------- Renderizar gráfica ----------
function renderizarGrafica(labels, data, titulo) {
  const ctx = document.getElementById("chart").getContext("2d");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          "#36A2EB",
          "#FF6384",
          "#FFCE56",
          "#4CAF50",
          "#FF9800",
          "#9C27B0"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: titulo,
          font: { size: 18 }
        },
        legend: {
          position: 'top'
        }
      }
    }
  });
}

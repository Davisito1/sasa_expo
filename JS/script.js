document.addEventListener("DOMContentLoaded", async () => {
  const API_VEHICULOS = 'https://retoolapi.dev/1nB30q/data';
  const API_CITAS = 'https://retoolapi.dev/K3dg6S/citas';
  const API_HISTORIAL = 'https://retoolapi.dev/80QQcT/HistorialAPI';
  const API_EMPLEADOS = 'https://retoolapi.dev/FdJGoM/data';

  function mostrarFechaYHora() {
    const f = new Date();
    document.getElementById("fechaActual").textContent = f.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById("horaActual").textContent = f.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
  mostrarFechaYHora();
  setInterval(mostrarFechaYHora, 60000);

  const totalizar = async (url, id) => {
    try {
      const res = await fetch(url);
      const data = await res.json();
      document.getElementById(id).textContent = data.length;
      return data;
    } catch {
      document.getElementById(id).textContent = "0";
      return [];
    }
  };

  const vehiculos = await totalizar(API_VEHICULOS, 'vehiculosTotal');
  const citas = await totalizar(API_CITAS, 'citasTotal');
  await totalizar(API_HISTORIAL, 'historialTotal');
  await totalizar(API_EMPLEADOS, 'empleadosTotal');

  // Vehículos por marca
  const marcas = {};
  vehiculos.forEach(v => {
    const marca = (v.marca || 'Otra').trim();
    marcas[marca] = (marcas[marca] || 0) + 1;
  });

  new Chart(document.getElementById("graficaVehiculosMarca"), {
    type: 'pie',
    data: {
      labels: Object.keys(marcas),
      datasets: [{
        data: Object.values(marcas),
        backgroundColor: ['#36a2eb', '#ff6384', '#ffce56', '#4bc0c0', '#9966ff']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true
    }
  });

  // Ingresos mensuales (ficticios)
  new Chart(document.getElementById("graficaIngresosMensuales"), {
    type: 'line',
    data: {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'],
      datasets: [{
        label: 'Ingresos ($)',
        data: [8500, 9200, 10500, 11000, 9600, 12300, 11500],
        borderColor: '#007bff',
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true
    }
  });

  // Botón historial
  document.getElementById("verHistorialBtn").addEventListener("click", () => {
    window.location.href = "../historial/historial.html";
  });

  // Botón citas de hoy
  window.verCitasHoy = async function () {
    try {
      const res = await fetch(API_CITAS);
      const data = await res.json();
      const hoy = new Date().toISOString().split('T')[0];
      const citasHoy = data.filter(c => c.fecha === hoy);

      if (citasHoy.length > 0) {
        const html = citasHoy.map(c => `
          <p><strong>Hora:</strong> ${c.hora} - <strong>Estado:</strong> ${c.estado}</p>
          <p><strong>Descripción:</strong> ${c.descripcion || 'Sin descripción'}</p><hr>
        `).join('');
        Swal.fire({ title: 'Citas de hoy', html, icon: 'info' });
      } else {
        Swal.fire('Sin citas hoy', 'No hay citas registradas para hoy.', 'warning');
      }
    } catch (error) {
      Swal.fire('Error', 'No se pudo cargar la información de citas.', 'error');
      console.error(error);
    }
  };
});

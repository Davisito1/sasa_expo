document.addEventListener("DOMContentLoaded", async () => {
  const API_VEHICULOS = "http://localhost:8080/apiVehiculo/consultar";
  const API_CLIENTES  = "http://localhost:8080/apiCliente/consultar?page=0&size=100";
  const API_ESTADOS   = "http://localhost:8080/api/estadoVehiculo/listar";
  const API_CITAS     = "http://localhost:8080/apiCitas/listar";
  const API_HISTORIAL = "http://localhost:8080/api/historial/consultar?page=0&size=100";
  const API_PAGOS     = "http://localhost:8080/apiPagos/consultar";

  function mostrarFechaYHora() {
    const f = new Date();
    document.getElementById("fechaActual").textContent =
      f.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    document.getElementById("horaActual").textContent = f.toLocaleTimeString(
      "es-ES",
      { hour: "2-digit", minute: "2-digit" }
    );
  }
  mostrarFechaYHora();
  setInterval(mostrarFechaYHora, 60000);

  function mostrarSaludo() {
    const hora = new Date().getHours();
    let saludo = "Hola";
    if (hora < 12) saludo = "Buenos días";
    else if (hora < 18) saludo = "Buenas tardes";
    else saludo = "Buenas noches";
    document.getElementById("saludo").textContent = saludo;
  }
  mostrarSaludo();

  const totalizar = async (url, id) => {
    try {
      const res = await fetch(url);
      const data = await res.json();

      let registros = [];

      if (Array.isArray(data)) {
        registros = data;
      } else if (data.content) {
        registros = data.content;
      } else if (data.data?.content) {
        registros = data.data.content;
      } else if (Array.isArray(data.data)) {
        registros = data.data;
      } else if (typeof data.data?.totalElements === "number") {
        // Para paginación (ej. empleados)
        registros = Array.from({ length: data.data.totalElements });
      }

      const el = document.getElementById(id);
      if (el) el.textContent = registros.length;

      return registros;
    } catch (err) {
      console.error("Error cargando " + id, err);
      const el = document.getElementById(id);
      if (el) el.textContent = "0";
      return [];
    }
  };

  const vehiculos = await totalizar(API_VEHICULOS, "vehiculosTotal");
  const clientes  = await totalizar(API_CLIENTES, "clientesTotal");
  const citas     = await totalizar(API_CITAS, "citasTotal");
  await totalizar(API_HISTORIAL, "historialTotal");
  const pagos     = await totalizar(API_PAGOS, "pagosTotal");

  const marcas = {};
  vehiculos.forEach((v) => {
    const marca = (v.marca || v.Marca || "Otra").trim();
    marcas[marca] = (marcas[marca] || 0) + 1;
  });

  if (Object.keys(marcas).length > 0) {
    new Chart(document.getElementById("graficaVehiculosMarca"), {
      type: "doughnut",
      data: {
        labels: Object.keys(marcas),
        datasets: [
          {
            data: Object.values(marcas),
            backgroundColor: ["#C91A1A", "#e74c3c", "#ff7675", "#fab1a0", "#ffeaa7"],
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: true },
    });
  }

  new Chart(document.getElementById("graficaIngresosMensuales"), {
    type: "line",
    data: {
      labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul"],
      datasets: [
        {
          label: "Ingresos ($)",
          data: [8500, 9200, 10500, 11000, 9600, 12300, 11500],
          borderColor: "#C91A1A",
          backgroundColor: "rgba(201,26,26,0.1)",
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: { responsive: true, maintainAspectRatio: true },
  });

  document.getElementById("verHistorialBtn").addEventListener("click", () => {
    window.location.href = "../historial/historial.html";
  });

  window.verCitasHoy = async function () {
    try {
      const res = await fetch(API_CITAS);
      const response = await res.json();
      const data = response.data || response;
      const hoy = new Date().toISOString().split("T")[0];
      const citasHoy = data.filter((c) => c.fecha === hoy);

      if (citasHoy.length > 0) {
        const html = citasHoy
          .map(
            (c) => `
          <p><strong>Hora:</strong> ${c.hora} - <strong>Estado:</strong> ${c.estado}</p>
        `
          )
          .join("<hr>");
        Swal.fire({
          title: "Citas de hoy",
          html,
          icon: "info",
          confirmButtonText: "Cerrar",
          confirmButtonColor: "#C91A1A"
        });
      } else {
        Swal.fire({
          title: "Sin citas hoy",
          text: "No hay citas registradas para hoy.",
          icon: "warning",
          confirmButtonText: "Ok",
          confirmButtonColor: "#C91A1A"
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "No se pudo cargar la información de citas.",
        icon: "error",
        confirmButtonText: "Cerrar",
        confirmButtonColor: "#C91A1A"
      });
      console.error(error);
    }
  };

  try {
    const select = document.getElementById("selectCliente");
    const info = document.getElementById("infoCliente");

    clientes.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.idCliente || c.id;
      opt.textContent = `${c.nombre} ${c.apellido}`;
      select.appendChild(opt);
    });

    select.addEventListener("change", () => {
      const idCliente = parseInt(select.value);
      if (!idCliente) {
        info.textContent = "Seleccione un cliente para ver información";
        return;
      }

      const vehiculosCliente = vehiculos.filter((v) => v.idCliente === idCliente);
      const citasCliente = citas.filter((c) => c.idCliente === idCliente).length;
      const pagosCliente = pagos.filter((p) => p.idCliente === idCliente).length;

      info.textContent = `Vehículos: ${vehiculosCliente.length} | Citas: ${citasCliente} | Pagos: ${pagosCliente}`;
    });
  } catch (error) {
    console.error("Error cargando clientes:", error);
  }
});

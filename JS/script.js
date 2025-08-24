document.addEventListener("DOMContentLoaded", async () => {
  // ===============================
  // 📌 APIs reales
  // ===============================
  const API_VEHICULOS = "http://localhost:8080/apiVehiculo";
  const API_CLIENTES = "http://localhost:8080/apiCliente";
  const API_ESTADOS = "http://localhost:8080/api/estadoVehiculo";
  const API_CITAS = "https://retoolapi.dev/K3dg6S/citas";
  const API_HISTORIAL = "https://retoolapi.dev/80QQcT/HistorialAPI";
  const API_EMPLEADOS = "https://retoolapi.dev/mm42wr/empleados";
  const API_PAGOS = "https://retoolapi.dev/Tym5QB/pagos";

  // ===============================
  // 📅 Fecha y hora
  // ===============================
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

  // ===============================
  // ⏰ Saludo dinámico
  // ===============================
  function mostrarSaludo() {
    const hora = new Date().getHours();
    let saludo = "Hola";
    if (hora < 12) saludo = "Buenos días";
    else if (hora < 18) saludo = "Buenas tardes";
    else saludo = "Buenas noches";
    document.getElementById("saludo").textContent = saludo;
  }
  mostrarSaludo();

  // ===============================
  // 🔢 Función totalizar
  // ===============================
  const totalizar = async (url, id) => {
    try {
      const res = await fetch(url);
      const data = await res.json();
      document.getElementById(id).textContent = data.length;
      return data;
    } catch (err) {
      console.error("Error cargando " + id, err);
      document.getElementById(id).textContent = "0";
      return [];
    }
  };

  // ===============================
  // 📊 Cargar datos iniciales
  // ===============================
  const vehiculos = await totalizar(API_VEHICULOS, "vehiculosTotal");
  const citas = await totalizar(API_CITAS, "citasTotal");
  await totalizar(API_HISTORIAL, "historialTotal");
  await totalizar(API_EMPLEADOS, "empleadosTotal");
  const pagos = await totalizar(API_PAGOS, "pagosTotal");

  // ===============================
  // 📊 Vehículos por marca
  // ===============================
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

  // ===============================
  // 📊 Ingresos mensuales (ejemplo)
  // ===============================
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

  // ===============================
  // 📂 Botón historial
  // ===============================
  document.getElementById("verHistorialBtn").addEventListener("click", () => {
    window.location.href = "../historial/historial.html";
  });

  // ===============================
  // 📅 Botón citas de hoy
  // ===============================
  window.verCitasHoy = async function () {
    try {
      const res = await fetch(API_CITAS);
      const data = await res.json();
      const hoy = new Date().toISOString().split("T")[0];
      const citasHoy = data.filter((c) => c.fecha === hoy);

      if (citasHoy.length > 0) {
        const html = citasHoy
          .map(
            (c) => `
          <p><strong>Hora:</strong> ${c.hora} - <strong>Estado:</strong> ${c.estado}</p>
          <p><strong>Descripción:</strong> ${c.descripcion || "Sin descripción"}</p><hr>
        `
          )
          .join("");
        Swal.fire({ title: "Citas de hoy", html, icon: "info" });
      } else {
        Swal.fire("Sin citas hoy", "No hay citas registradas para hoy.", "warning");
      }
    } catch (error) {
      Swal.fire("Error", "No se pudo cargar la información de citas.", "error");
      console.error(error);
    }
  };

  // ===============================
  // 👥 Selector de clientes
  // ===============================
  try {
    const res = await fetch(`${API_CLIENTES}/consultar?page=0&size=50`);
    const json = await res.json();

    // ✅ Manejo de estructura con paginación
    const clientes = json.data?.content || [];

    const select = document.getElementById("selectCliente");
    const info = document.getElementById("infoCliente");

    clientes.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.idCliente || c.id; // soporta ambos
      opt.textContent = `${c.nombre} ${c.apellido}`;
      select.appendChild(opt);
    });

    select.addEventListener("change", () => {
      const idCliente = parseInt(select.value);
      if (!idCliente) {
        info.textContent = "Seleccione un cliente para ver información";
        return;
      }

      // 🚗 Vehículos
      const vehiculosCliente = vehiculos.filter((v) => v.idCliente === idCliente);

      // 📅 Citas
      const citasCliente = citas.filter((c) => c.idCliente === idCliente).length;

      // 💳 Pagos
      const pagosCliente = pagos.filter((p) => p.idCliente === idCliente).length;

      // Mostrar en tarjeta
      info.textContent = `Vehículos: ${vehiculosCliente.length} | Citas: ${citasCliente} | Pagos: ${pagosCliente}`;

      // 🚨 SweetAlert con detalle
      if (vehiculosCliente.length > 0) {
        const htmlVehiculos = vehiculosCliente
          .map(
            (v) => `
            <p>
              <strong>${v.marca} ${v.modelo}</strong> (${v.anio})<br>
              <span style="color:gray;">Placa:</span> ${v.placa}
            </p>
          `
          )
          .join("<hr>");

        Swal.fire({
          title: "Vehículos del cliente",
          html: htmlVehiculos,
          icon: "info",
          confirmButtonText: "Cerrar",
          confirmButtonColor: "#C91A1A"
        });
      } else {
        Swal.fire({
          title: "Sin vehículos",
          text: "Este cliente no tiene vehículos registrados.",
          icon: "warning",
          confirmButtonText: "Ok",
          confirmButtonColor: "#C91A1A"
        });
      }
    });
  } catch (error) {
    console.error("Error cargando clientes:", error);
  }
});

document.addEventListener("DOMContentLoaded", async () => {

  // ====== ENDPOINTS ======
  const API_VEHICULOS = "http://localhost:8080/apiVehiculo/consultar";
  const API_CLIENTES  = "http://localhost:8080/apiCliente/consultar?page=0&size=100";
  const API_ESTADOS   = "http://localhost:8080/api/estadoVehiculo/listar";
  const API_CITAS     = "http://localhost:8080/apiCitas/listar";
  const API_HISTORIAL = "http://localhost:8080/api/historial/consultar?page=0&size=100";
  const API_PAGOS     = "http://localhost:8080/apiPagos/consultar";

  // ===============================
  // FECHA Y HORA EN VIVO
  // ===============================
  function mostrarFechaYHora() {
    const f = new Date();
    document.getElementById("fechaActual").textContent = f.toLocaleDateString("es-ES", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
    document.getElementById("horaActual").textContent = f.toLocaleTimeString("es-ES", {
      hour: "2-digit", minute: "2-digit"
    });
  }
  mostrarFechaYHora();
  setInterval(mostrarFechaYHora, 60000); // actualizar cada minuto

  // ===============================
  // SALUDO SEGÚN HORA
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
  // FUNCIÓN AUXILIAR: totalizar entidades
  // ===============================
  const totalizar = async (url, id) => {
    try {
      const res = await fetch(url);
      const data = await res.json();

      // Normalización de estructuras distintas
      let registros = [];
      if (Array.isArray(data)) registros = data;
      else if (data.content) registros = data.content;
      else if (data.data?.content) registros = data.data.content;
      else if (Array.isArray(data.data)) registros = data.data;
      else if (typeof data.data?.totalElements === "number") {
        registros = Array.from({ length: data.data.totalElements });
      }

      // Pintar en tarjeta
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

  // ===============================
  // CARGA DE RESÚMENES
  // ===============================
  const vehiculos = await totalizar(API_VEHICULOS, "vehiculosTotal");
  const clientes  = await totalizar(API_CLIENTES, "clientesTotal");
  const citas     = await totalizar(API_CITAS, "citasTotal");
  await totalizar(API_HISTORIAL, "historialTotal");
  const pagos     = await totalizar(API_PAGOS, "pagosTotal");

  // ===============================
  // GRÁFICA VEHÍCULOS POR MARCA
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
        datasets: [{
          data: Object.values(marcas),
          backgroundColor: ["#C91A1A", "#e74c3c", "#ff7675", "#fab1a0", "#ffeaa7"],
        }],
      },
      options: { responsive: true, maintainAspectRatio: true },
    });
  }

  // ===============================
  // GRÁFICA INGRESOS MENSUALES (dummy)
  // ===============================
  new Chart(document.getElementById("graficaIngresosMensuales"), {
    type: "line",
    data: {
      labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul"],
      datasets: [{
        label: "Ingresos ($)",
        data: [8500, 9200, 10500, 11000, 9600, 12300, 11500],
        borderColor: "#C91A1A",
        backgroundColor: "rgba(201,26,26,0.1)",
        fill: true,
        tension: 0.3,
      }],
    },
    options: { responsive: true, maintainAspectRatio: true },
  });

  // ===============================
  // BOTÓN "VER HISTORIAL"
  // ===============================
  document.getElementById("verHistorialBtn").addEventListener("click", () => {
    window.location.href = "../historial/historial.html";
  });

  // ===============================
  // FUNCIÓN: VER CITAS DE HOY
  // ===============================
  window.verCitasHoy = async function () {
    try {
      const res = await fetch(API_CITAS);
      const response = await res.json();
      const data = response.data || response;
      const hoy = new Date().toISOString().split("T")[0];
      const citasHoy = data.filter((c) => c.fecha === hoy);

      if (citasHoy.length > 0) {
        const html = citasHoy.map(c => `
          <p><strong>Hora:</strong> ${c.hora} - <strong>Estado:</strong> ${c.estado}</p>
        `).join("<hr>");
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

  // ===============================
  // SELECT DETALLES CLIENTE
  // ===============================
  try {
    const select = document.getElementById("selectCliente");

    clientes.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.idCliente || c.id;
      opt.textContent = `${c.nombre} ${c.apellido}`;
      select.appendChild(opt);
    });

    // Al seleccionar un cliente → mostrar detalles
    select.addEventListener("change", () => {
      const idCliente = parseInt(select.value);
      if (!idCliente) return;

      const cliente = clientes.find(c => (c.idCliente || c.id) === idCliente);
      const vehiculosCliente = vehiculos.filter((v) => v.idCliente === idCliente);
      const citasCliente     = citas.filter((c) => c.idCliente === idCliente);
      const pagosCliente     = pagos.filter((p) => p.idCliente === idCliente);

      const html = `
        <div style="text-align:left">
          <p><strong>Vehículos:</strong> ${vehiculosCliente.length}</p>
          <ul>${vehiculosCliente.map(v => `<li>${v.marca} ${v.modelo} (${v.placa || "sin placa"})</li>`).join("") || "<li>Ninguno</li>"}</ul>

          <p><strong>Citas:</strong> ${citasCliente.length}</p>
          <ul>${citasCliente.map(c => `<li>${c.fecha} - ${c.descripcion || "sin descripción"}</li>`).join("") || "<li>Ninguna</li>"}</ul>

          <p><strong>Pagos:</strong> ${pagosCliente.length}</p>
          <ul>${pagosCliente.map(p => `<li>Monto: $${p.monto} - ${p.fecha}</li>`).join("") || "<li>Ninguno</li>"}</ul>
        </div>
      `;

      Swal.fire({
        title: `${cliente?.nombre || ""} ${cliente?.apellido || ""}`,
        html,
        icon: "info",
        confirmButtonColor: "#C91A1A",
        width: 600
      });
    });
  } catch (error) {
    console.error("Error cargando clientes:", error);
  }
});

const calendarDays = document.getElementById("calendar-days");
const calendarDate = document.getElementById("calendar-date");
const prevBtn = document.getElementById("prev-month");
const nextBtn = document.getElementById("next-month");

let currentDate = new Date();

// ===== API CITAS =====
const API_CITAS = "http://localhost:8080/apiCitas/listar";

// Función para cargar citas desde API
async function fetchCitas() {
  try {
    const token = localStorage.getItem("authToken"); // ✅ usa tu token de login
    const res = await fetch(API_CITAS, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      console.error("Error HTTP:", res.status);
      return [];
    }

    const data = await res.json();
    console.log("Respuesta API citas:", data);

    // ✅ Detecta la forma de los datos
    if (Array.isArray(data)) return data;
    if (data.content && Array.isArray(data.content)) return data.content;
    if (data.data && Array.isArray(data.data)) return data.data;

    return []; // fallback
  } catch (err) {
    console.error("Error al cargar citas:", err);
    return [];
  }
}

// Generar calendario dinámico
async function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const lastDate = new Date(year, month + 1, 0).getDate(); // total días mes

  // Título mes
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  calendarDate.textContent = `${monthNames[month]} ${year}`;

  // Reset
  calendarDays.innerHTML = "";

  // Obtener citas
  const citas = await fetchCitas();

  // Crear días
  for (let i = 1; i <= lastDate; i++) {
    const day = document.createElement("li");
    day.classList.add("calendar__day");

    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;

    day.innerHTML = `
      <div class="day__info"><h5>${i}</h5></div>
      <ul class="calendar__appointments"></ul>
    `;

    const ul = day.querySelector(".calendar__appointments");

    // Filtrar citas del día
    const citasDia = Array.isArray(citas) ? citas.filter(c => c.fecha === dateStr) : [];
    citasDia.forEach(cita => {
      const li = document.createElement("li");
      li.classList.add(`appointment__${cita.estado?.toLowerCase() || "pendiente"}`);
      li.textContent = `${cita.hora} - ${cita.estado}`;
      ul.appendChild(li);
    });

    calendarDays.appendChild(day);
  }
}

// Navegación meses
prevBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});
nextBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

// Inicial
renderCalendar();

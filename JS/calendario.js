const calendarDays = document.getElementById("calendar-days");
const calendarDate = document.getElementById("calendar-date");
const prevBtn = document.getElementById("prev-month");
const nextBtn = document.getElementById("next-month");

let currentDate = new Date();
const today = new Date();

// ===== LÍMITES =====
const minDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
const maxDate = new Date(2025, 11, 31);

// ===== API CITAS =====
// Detectar entorno (local o Vercel)
const isProd = typeof window !== "undefined" && window.location.hostname.includes("vercel.app");

const API_CITAS = isProd
  ? "https://sasa-expo-j7n5lcpcp-david-guardados-projects.vercel.app/apiCitas/listar"
  : "http://localhost:8080/apiCitas/listar";

// ===== FERIADOS EL SALVADOR =====
const feriadosES = [
  "2025-01-01", // Año Nuevo
  "2025-04-17", // Jueves Santo
  "2025-04-18", // Viernes Santo
  "2025-05-01", // Día del Trabajo
  "2025-05-10", // Día de las Madres
  "2025-06-17", // Día del Padre
  "2025-08-06", // Divino Salvador del Mundo
  "2025-09-15", // Independencia
  "2025-11-02", // Día de los Difuntos
  "2025-12-25", // Navidad
];

// ===== API FETCH CITAS =====
async function fetchCitas() {
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(API_CITAS, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error("Error HTTP:", res.status);
      return [];
    }

    const data = await res.json();

    if (Array.isArray(data)) return data;
    if (data.content && Array.isArray(data.content)) return data.content;
    if (data.data && Array.isArray(data.data)) return data.data;

    return [];
  } catch (err) {
    console.error("Error al cargar citas:", err);
    return [];
  }
}

// ===== RENDER CALENDARIO =====
async function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const lastDate = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  calendarDate.textContent = `${monthNames[month]} ${year}`;

  calendarDays.innerHTML = "";

  const citas = await fetchCitas();

  for (let i = 1; i <= lastDate; i++) {
    const day = document.createElement("li");
    day.classList.add("calendar__day");

    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;

    // 📌 Verificar si es feriado
    const esFeriado = feriadosES.includes(dateStr);

    day.innerHTML = `
      <div class="day__info">
        <h5>${i}</h5>
        ${esFeriado ? '<span class="badge badge-feriado">Feriado</span>' : ""}
      </div>
      <ul class="calendar__appointments"></ul>
    `;

    const ul = day.querySelector(".calendar__appointments");

    const citasDia = Array.isArray(citas) ? citas.filter((c) => c.fecha === dateStr) : [];
    citasDia.forEach((cita) => {
      const li = document.createElement("li");
      li.classList.add(`appointment__${cita.estado?.toLowerCase() || "pendiente"}`);
      li.textContent = `${cita.hora} - ${cita.estado}`;
      ul.appendChild(li);
    });

    if (esFeriado) {
      day.classList.add("calendar__feriado");
    }

    calendarDays.appendChild(day);
  }

  // ===== Validaciones de navegación =====
  prevBtn.disabled = new Date(year, month, 1) <= minDate;
  nextBtn.disabled = new Date(year, month, 1) >= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
}

// ===== NAVEGACIÓN =====
prevBtn.addEventListener("click", () => {
  const prevDate = new Date(currentDate);
  prevDate.setMonth(prevDate.getMonth() - 1);
  if (prevDate >= minDate) {
    currentDate = prevDate;
    renderCalendar();
  }
});

nextBtn.addEventListener("click", () => {
  const nextDate = new Date(currentDate);
  nextDate.setMonth(nextDate.getMonth() + 1);
  if (nextDate <= maxDate) {
    currentDate = nextDate;
    renderCalendar();
  }
});

// Inicial
renderCalendar();
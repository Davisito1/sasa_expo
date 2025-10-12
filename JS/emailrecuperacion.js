// ===============================
// FORMULARIO DE RECUPERACIÓN DE CORREO (USANDO HEROKU API SASA)
// ===============================

// 🔗 URL base fija del backend en Heroku
const API_BASE = "https://sasaapi-73d5de493985.herokuapp.com";

// Escuchar el envío del formulario
document.getElementById("emailForm").addEventListener("submit", async function (e) {
  e.preventDefault(); // Evita recargar la página

  const email = document.getElementById("emailInput").value.trim();

  // ===============================
  // VALIDACIONES
  // ===============================
  if (email === "") {
    Swal.fire({
      icon: "warning",
      title: "Campo vacío",
      text: "Por favor ingresa tu correo electrónico.",
    });
    return;
  }

  if (!validateEmail(email)) {
    Swal.fire({
      icon: "error",
      title: "Correo inválido",
      text: "Por favor ingresa un correo válido.",
    });
    return;
  }

  // ===============================
  // PETICIÓN AL BACKEND (Heroku)
  // ===============================
  try {
    const res = await fetch(`${API_BASE}/api/recuperacion/enviar?correo=${encodeURIComponent(email)}`, {
      method: "POST",
    });

    if (res.ok) {
      Swal.fire({
        icon: "success",
        title: "Correo enviado",
        text: "Hemos enviado un código de verificación a tu correo.",
        showConfirmButton: false,
        timer: 2000,
      }).then(() => {
        // Guardar el correo para los siguientes pasos
        localStorage.setItem("correoRecuperacion", email);

        // Redirigir al formulario para ingresar el código
        window.location.href = "../Autenticacion/recuperar.html";
      });
    } else {
      const msg = await res.text();
      Swal.fire({
        icon: "error",
        title: "Error",
        text: msg || "No se pudo enviar el código de recuperación.",
      });
    }
  } catch (error) {
    console.error("❌ Error al conectar con Heroku:", error);
    Swal.fire({
      icon: "error",
      title: "Error de conexión",
      text: "No se pudo conectar con el servidor SASA. Intenta nuevamente más tarde.",
    });
  }
});

// ===============================
// VALIDACIÓN DE CORREO ELECTRÓNICO
// ===============================
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// ===============================
// BOTÓN "VOLVER A LOGIN" CON CONFIRMACIÓN
// ===============================
document.addEventListener("DOMContentLoaded", function () {
  const backButton = document.getElementById("backToLogin");

  if (backButton) {
    backButton.addEventListener("click", function () {
      Swal.fire({
        title: "¿Volver a Inicio de Sesión?",
        text: "Perderás los cambios no guardados.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, volver",
        cancelButtonText: "Cancelar",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "../Autenticacion/login.html";
        }
      });
    });
  }
});

// ===============================
// FORMULARIO DE RECUPERACIÓN DE CORREO
// ===============================

// Captura el evento submit del formulario de email
document.getElementById('emailForm').addEventListener('submit', function(e) {
  e.preventDefault(); // evitar que recargue la página

  const email = document.getElementById('emailInput').value.trim();

  // -------- Validaciones --------
  if (email === "") {
    // Campo vacío
    Swal.fire({
      icon: 'warning',
      title: 'Campo vacío',
      text: 'Por favor ingresa tu correo electrónico.'
    });
  } else if (!validateEmail(email)) {
    // Correo con formato inválido
    Swal.fire({
      icon: 'error',
      title: 'Correo inválido',
      text: 'Por favor ingresa un correo válido.'
    });
  } else {
    // Éxito → Simulación de envío de correo
    Swal.fire({
      icon: 'success',
      title: 'Correo enviado',
      text: 'Hemos enviado un código de verificación a tu correo.',
      showConfirmButton: false,
      timer: 2000
    }).then(() => {
      // Redirigir a pantalla para ingresar el código
      window.location.href = '../Autenticacion/recuperar.html';
    });
  }
});

// ===============================
// FUNCIÓN DE VALIDACIÓN DE CORREO
// ===============================
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // expresión regular básica
  return re.test(email);
}

// ===============================
// BOTÓN "VOLVER A LOGIN" CON CONFIRMACIÓN
// ===============================
document.addEventListener('DOMContentLoaded', function () {
  const backButton = document.getElementById('backToLogin');
  
  if (backButton) {
    backButton.addEventListener('click', function () {
      Swal.fire({
        title: '¿Volver a Inicio de Sesión?',
        text: "Perderás los cambios no guardados.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, volver',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          // Como el HTML está en la carpeta Autenticacion, ajustamos la ruta
          window.location.href = '../Autenticacion/login.html';
        }
      });
    });
  }
});

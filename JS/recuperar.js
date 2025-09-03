// ===============================
// BOTÓN "VOLVER A LOGIN"
// ===============================

document.addEventListener('DOMContentLoaded', function () {
  const backButton = document.getElementById('backToLogin');

  if (backButton) {
    // Cuando el usuario hace click en "Volver"
    backButton.addEventListener('click', function () {
      Swal.fire({
        title: '¿Volver a Inicio de Sesión?',
        text: "Perderás los cambios no guardados.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',   // rojo
        cancelButtonColor: '#3085d6', // azul
        confirmButtonText: 'Sí, volver',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          // 🔹 Ruta corregida hacia el login
          window.location.href = '../Autenticacion/login.html';
        }
      });
    });
  } else {
    // Si el botón no existe en el DOM, muestra advertencia en consola
    console.warn('No se encontró el botón con ID "backToLogin"');
  }
});

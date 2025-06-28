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
          window.location.href = '../Autenticacion/login.html'; // Ruta corregida
        }
      });
    });
  } else {
    console.warn('No se encontró el botón con ID "backToLogin"');
  }
});

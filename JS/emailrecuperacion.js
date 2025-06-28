 document.getElementById('emailForm').addEventListener('submit', function(e) {
      e.preventDefault();
      const email = document.getElementById('emailInput').value.trim();

      if(email === "") {
        Swal.fire({
          icon: 'warning',
          title: 'Campo vacío',
          text: 'Por favor ingresa tu correo electrónico.'
        });
      } else if(!validateEmail(email)) {
        Swal.fire({
          icon: 'error',
          title: 'Correo inválido',
          text: 'Por favor ingresa un correo válido.'
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Correo enviado',
          text: 'Hemos enviado un código de verificación a tu correo.',
          showConfirmButton: false,
          timer: 2000
        }).then(() => {
          window.location.href = '../Autenticacion/recuperar.html'; // Ir a pantalla de código
        });
      }
    });

    // Validación de formato de correo
    function validateEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    }

    // Volver a inicio de sesión con confirmación
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
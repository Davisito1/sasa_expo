 const usuarios = [
      { email: 'admin@sasa.com', password: '1234' },
      { email: 'usuario@sasa.com', password: '5678' },
      { email: 'cliente@sasa.com', password: 'abcd' }
    ];

    document.getElementById('loginForm').addEventListener('submit', function (e) {
      e.preventDefault();

      const emailIngresado = document.getElementById('email').value;
      const passwordIngresado = document.getElementById('password').value;

      // Busca si el usuario existe en el JSON
      const usuarioValido = usuarios.find(user => user.email === emailIngresado && user.password === passwordIngresado);

      if (usuarioValido) {
        Swal.fire({
          icon: 'success',
          title: '¡Bienvenido!',
          text: 'Redirigiendo al Dashboard...',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          window.location.href = '../dashboard/index.html'; // Ruta corregida
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Correo o contraseña incorrectos.'
        });
      }
    });
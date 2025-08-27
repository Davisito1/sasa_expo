import { login, getUsuarioLogueado, logout } from '../Services/LoginService.js';

// Verificar si ya está logueado al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  const usuario = getUsuarioLogueado();
  if (usuario) {
    console.log('👤 Usuario ya logueado:', usuario);
    window.location.href = '../dashboard/index.html';
  }
});

// Manejar el formulario de login
document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const usuarioIngresado = document.getElementById('usuario').value.trim();
  const passwordIngresado = document.getElementById('password').value;
  const loginButton = document.getElementById('loginButton');
  const originalText = loginButton.innerHTML;

  // Validaciones básicas
  if (!usuarioIngresado || !passwordIngresado) {
    Swal.fire({
      icon: 'warning',
      title: 'Campos requeridos',
      text: 'Por favor completa todos los campos'
    });
    return;
  }

  // Mostrar loading
  loginButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Verificando...';
  loginButton.disabled = true;

  try {
    console.log('🔄 Iniciando proceso de login...');
    const respuesta = await login(usuarioIngresado, passwordIngresado);

    if (respuesta.status === "success") {
      // Guardar usuario en localStorage
      localStorage.setItem('user', JSON.stringify(respuesta.data));
      console.log('💾 Usuario guardado en localStorage:', respuesta.data);
      
      Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        text: `Bienvenido ${respuesta.data.nombreUsuario}`,
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        window.location.href = '../dashboard/index.html';
      });
    }
  } catch (error) {
    console.error('❌ Error en el controller:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error de login',
      text: error.message || 'Error al conectar con el servidor'
    });
  } finally {
    // Restaurar botón
    loginButton.innerHTML = originalText;
    loginButton.disabled = false;
  }
});

// Hacer funciones globales para usar en otras páginas
window.getUsuarioLogueado = getUsuarioLogueado;
window.logout = logout;
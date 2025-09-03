// ==================== IMPORTAR SERVICIOS ====================
// Servicios de login: iniciar sesión, obtener usuario actual y cerrar sesión
import { login, getUsuarioLogueado, logout } from '../Services/LoginService.js';

// ==================== VERIFICAR SESIÓN ====================
// Al cargar la página revisa si ya hay un usuario logueado
document.addEventListener('DOMContentLoaded', function() {
  const usuario = getUsuarioLogueado();  // obtiene usuario desde localStorage
  if (usuario) {
    console.log(' Usuario ya logueado:', usuario);
    // si está logueado, redirige al dashboard
    window.location.href = '../dashboard/index.html';
  }
});

// ==================== EVENTO FORMULARIO LOGIN ====================
// Captura el submit del formulario de login
document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  // Valores ingresados en los campos
  const usuarioIngresado  = document.getElementById('usuario').value.trim();
  const passwordIngresado = document.getElementById('password').value;
  const loginButton       = document.getElementById('loginButton');
  const originalText      = loginButton.innerHTML;

  // ---------- Validaciones básicas ----------
  if (!usuarioIngresado || !passwordIngresado) {
    Swal.fire({
      icon: 'warning',
      title: 'Campos requeridos',
      text: 'Por favor completa todos los campos'
    });
    return;
  }

  // ---------- Mostrar loading en botón ----------
  loginButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Verificando...';
  loginButton.disabled  = true;

  try {
    console.log('Iniciando proceso de login...');
    
    // Llamada al servicio de login
    const respuesta = await login(usuarioIngresado, passwordIngresado);

    // Si es exitoso
    if (respuesta.status === "success") {
      // Guardar usuario en localStorage
      localStorage.setItem('user', JSON.stringify(respuesta.data));
      console.log(' Usuario guardado en localStorage:', respuesta.data);
      
      // Mensaje de bienvenida
      Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        text: `Bienvenido ${respuesta.data.nombreUsuario}`,
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        // Redirigir al dashboard
        window.location.href = '../dashboard/index.html';
      });
    }
  } catch (error) {
    // Manejo de error en login
    console.error('❌ Error en el controller:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error de login',
      text: error.message || 'Error al conectar con el servidor'
    });
  } finally {
    // ---------- Restaurar estado del botón ----------
    loginButton.innerHTML = originalText;
    loginButton.disabled  = false;
  }
});

// ==================== FUNCIONES GLOBALES ====================
// Se exponen globalmente para usarlas en cualquier otra página
window.getUsuarioLogueado = getUsuarioLogueado;
window.logout = logout;

// ==================== IMPORTAR SERVICIOS ====================
import { login, getUsuarioLogueado, logout } from "../Services/LoginService.js";

// ==================== VERIFICAR SESIÓN ====================
document.addEventListener("DOMContentLoaded", function () {
  const usuario = getUsuarioLogueado();
  if (usuario?.autenticado) {
    // Si ya está logueado, redirige al dashboard
    window.location.href = "../dashboard/index.html";
  }
});

// ==================== EVENTO FORMULARIO LOGIN ====================
document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const usuarioIngresado = document.getElementById("usuario").value.trim();
  const passwordIngresado = document.getElementById("password").value;
  const loginButton = document.getElementById("loginButton");
  const originalText = loginButton.innerHTML;

  // Validación básica
  if (!usuarioIngresado || !passwordIngresado) {
    Swal.fire({
      icon: "warning",
      title: "Campos requeridos",
      text: "Por favor completa todos los campos",
    });
    return;
  }

  // Loading
  loginButton.innerHTML =
    '<span class="spinner-border spinner-border-sm"></span> Verificando...';
  loginButton.disabled = true;

  try {
    const respuesta = await login(usuarioIngresado, passwordIngresado);

    if (respuesta.status === "success") {
      // Guardado en localStorage ya lo hace LoginService
      Swal.fire({
        icon: "success",
        title: "¡Bienvenido!",
        text: respuesta.message,
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        window.location.href = "../dashboard/index.html";
      });
    }
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error de login",
      text: error.message || "Error al conectar con el servidor",
    });
  } finally {
    loginButton.innerHTML = originalText;
    loginButton.disabled = false;
  }
});

// ==================== FUNCIONES GLOBALES ====================
window.getUsuarioLogueado = getUsuarioLogueado;
window.logout = logout;

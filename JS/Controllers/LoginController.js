// ======================= IMPORTS =======================
import { login, getUsuarioLogueado } from "../services/loginService.js";

// ======================= AUTOLOGIN =======================
document.addEventListener("DOMContentLoaded", () => {
  const usuario = getUsuarioLogueado();
  if (usuario) {
    // Si ya hay sesión activa → redirige al dashboard
    window.location.href = "../dashboard/index.html";
  }
});

// ======================= EVENTO LOGIN =======================
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const usuarioIngresado = document.getElementById("usuario").value.trim();
  const passwordIngresado = document.getElementById("password").value;
  const loginButton = document.getElementById("loginButton");
  const originalText = loginButton.innerHTML;

  // Validación de campos vacíos
  if (!usuarioIngresado || !passwordIngresado) {
    Swal.fire("Campos requeridos", "Completa todos los campos", "warning");
    return;
  }

  // Estado de carga en el botón
  loginButton.innerHTML = `
    <span class="spinner-border spinner-border-sm"></span> Verificando...
  `;
  loginButton.disabled = true;

  try {
    // Llamada al servicio de login
    const respuesta = await login(usuarioIngresado, passwordIngresado);
    const user = respuesta.data || {};
    const nombre = user.username || user.nombre || "Usuario";

    Swal.fire({
      icon: "success",
      title: "¡Bienvenido!",
      text: `Bienvenido ${nombre}`,
      timer: 2000,
      showConfirmButton: false,
    }).then(() => {
      // Redirige al dashboard
      window.location.href = "../dashboard/index.html";
    });
  } catch (error) {
    Swal.fire(
      "Error de login",
      error.message || "Error al conectar con el servidor",
      "error"
    );
  } finally {
    // Restaurar el botón
    loginButton.innerHTML = originalText;
    loginButton.disabled = false;
  }
});

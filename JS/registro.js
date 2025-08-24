const form = document.getElementById("registroForm");
const btn  = document.getElementById("btnRegistro");

function isValidEmail(email) {
  // Validación simple y suficiente para front-end
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  return re.test(String(email).toLowerCase());
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Obtener valores
  const usuario  = document.getElementById("usuario");
  const correo   = document.getElementById("correo");
  const password = document.getElementById("password");

  // Reset clases de validación
  [usuario, correo, password].forEach(i => i.classList.remove("is-invalid"));

  // Validaciones mínimas
  let ok = true;

  if (!usuario.value || usuario.value.trim().length < 3) {
    usuario.classList.add("is-invalid");
    ok = false;
  }

  if (!isValidEmail(correo.value)) {
    correo.classList.add("is-invalid");
    ok = false;
  }

  if (!password.value || password.value.length < 6) {
    password.classList.add("is-invalid");
    ok = false;
  }

  if (!ok) {
    return;
  }

  // (Opcional) Aquí podrías enviar a tu API antes de redirigir:
  // await fetch("https://tu-api/registro", { method: "POST", body: ... })

  // Deshabilitar botón mientras “procesa”
  btn.disabled = true;
  btn.innerText = "Registrando...";

  try {
    await Swal.fire({
      icon: "success",
      title: "¡Registro completado!",
      text: "Ahora puedes iniciar sesión.",
      confirmButtonText: "Ir al login"
    });

    // 🔹 Redirige al Login
    window.location.href = "../Autenticacion/login.html";
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Ocurrió un problema al registrar.", "error");
  } finally {
    btn.disabled = false;
    btn.innerText = "Registrarse";
  }
});

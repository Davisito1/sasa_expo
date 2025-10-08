// src/JS/Controllers/RegistroController.js
import { register } from "../Services/RegistroService.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registroForm");
  const pwdInput = document.getElementById("password");
  const btnTogglePwd = document.getElementById("btnTogglePwd");
  const telInput = document.getElementById("telefono");

  // 👁️ Mostrar/ocultar contraseña
  if (btnTogglePwd && pwdInput) {
    btnTogglePwd.addEventListener("click", () => {
      if (pwdInput.type === "password") {
        pwdInput.type = "text";
        btnTogglePwd.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
      } else {
        pwdInput.type = "password";
        btnTogglePwd.innerHTML = '<i class="fa-solid fa-eye"></i>';
      }
    });
  }

  // 📞 Forzar formato de teléfono ####-####
  if (telInput) {
    telInput.addEventListener("input", (e) => {
      let val = e.target.value.replace(/\D/g, ""); // quitar lo que no sea número
      if (val.length > 8) val = val.slice(0, 8);   // máximo 8 dígitos
      if (val.length > 4) {
        val = val.slice(0, 4) + "-" + val.slice(4);
      }
      e.target.value = val;
    });
  }

  // 📌 Envío del formulario
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nombres = document.getElementById("nombre").value.trim();
      const apellidos = document.getElementById("apellido").value.trim();
      let dui = document.getElementById("dui").value.trim();
      const fechaNacimiento = document.getElementById("fecha").value;
      const correo = document.getElementById("correo").value.trim();
      const contrasena = document.getElementById("password").value.trim();
      const telefono = telInput.value.trim() || "0000-0000";
      const direccion = document.getElementById("direccion").value.trim() || "Pendiente";
      const fechaContratacion = new Date().toISOString().split("T")[0];

      // 🔒 Validaciones rápidas
      if (!contrasena || contrasena.length < 6) {
        Swal.fire({
          icon: "warning",
          title: "Contraseña inválida",
          text: "Debe tener al menos 6 caracteres",
        });
        return;
      }

      if (!nombres || !apellidos || !correo) {
        Swal.fire({
          icon: "warning",
          title: "Campos incompletos",
          text: "Por favor completa todos los campos obligatorios",
        });
        return;
      }

      // 📌 Validación/generación de DUI
      const regexDui = /^\d{8}-\d{1}$/;
      if (!dui) {
        const num = Math.floor(10000000 + Math.random() * 90000000);
        const verificador = Math.floor(Math.random() * 10);
        dui = `${num}-${verificador}`;
        document.getElementById("dui").value = dui;
      } else if (!regexDui.test(dui)) {
        Swal.fire({
          icon: "warning",
          title: "DUI inválido",
          text: "El DUI debe tener el formato ########-#",
        });
        return;
      }

      // 👇 Armar DTO como lo espera el backend
      const empleado = {
        nombres,
        apellidos,
        cargo: "Empleado",
        dui,
        telefono,
        direccion,
        fechaContratacion,
        fechaNacimiento,
        correo,
        nombreUsuario: `${nombres}.${apellidos}`.toLowerCase(),
        contrasena,
      };

      try {
        const data = await register(empleado);

        Swal.fire({
          icon: "success",
          title: "Registro exitoso",
          text: data.message || "Empleado creado correctamente",
        }).then(() => {
          window.location.href = "index.html";
        });
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error en el registro",
          text: err.message || "No se pudo registrar el empleado",
        });
      }
    });
  }
});
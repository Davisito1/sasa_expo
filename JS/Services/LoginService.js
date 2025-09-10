// ===============================
// LoginService.js
// ===============================

// Base API real
const API_BASE   = "http://localhost:8080";
const LOGIN_URL  = `${API_BASE}/api/auth/login`;
const LOGOUT_URL = `${API_BASE}/api/auth/logout`;

// ===============================
// LOGIN (backend real con cookie httpOnly)
// ===============================
export async function login(usuarioOCorreo, password) {
  try {
    console.log("🔑 Intentando login con:", usuarioOCorreo);

    // Construir payload: correo o nombreUsuario
    const payload = usuarioOCorreo.includes("@")
      ? { correo: usuarioOCorreo, contrasena: password }
      : { nombreUsuario: usuarioOCorreo, contrasena: password };

    const res = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // NECESARIO para enviar/recibir cookie
      body: JSON.stringify(payload),
    });

    const text = await res.text(); // backend devuelve string

    if (!res.ok) {
      throw new Error(text || "Credenciales inválidas");
    }

    // Guardar perfil mínimo en localStorage (el token está en cookie httpOnly)
    const user = {
      nombreUsuario: usuarioOCorreo.includes("@")
        ? usuarioOCorreo.split("@")[0]
        : usuarioOCorreo,
      autenticado: true,
    };
    localStorage.setItem("user", JSON.stringify(user));

    return {
      status: "success",
      data: user,
      message: text || "Inicio de sesión exitoso",
    };
  } catch (error) {
    console.error("❌ Error en login:", error);
    throw error;
  }
}

// ===============================
// GESTIÓN DE SESIÓN EN LOCALSTORAGE
// ===============================
export function getUsuarioLogueado() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function logout() {
  try {
    await fetch(LOGOUT_URL, { method: "POST", credentials: "include" });
  } catch (e) {
    console.warn("⚠️ Error cerrando sesión en servidor:", e);
  } finally {
    localStorage.removeItem("user");
    window.location.href = "../login/login.html"; // redirigir al login
  }
}

export function isLoggedIn() {
  return getUsuarioLogueado() !== null;
}

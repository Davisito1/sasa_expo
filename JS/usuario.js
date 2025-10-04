// ======================= IMPORTS =======================
import { 
  getUsuarioLogueado, 
  getUserId, 
  logout 
} from "../JS/Services/LoginService.js";

// ======================= CONFIG =======================
const USU_API_URL = "http://localhost:8080/apiUsuario";
const INDEX_URL   = "../Autenticacion/login.html";
const USUARIO_URL = "../Usuario/usuario.html";

// ======================= DOM =======================
const infoIdUsuario    = document.getElementById("infoIdUsuario");
const infoRol          = document.getElementById("infoRol");
const infoEstado       = document.getElementById("infoEstado");

const formUsuario      = document.getElementById("formUsuario");
const nombreUsuario    = document.getElementById("nombreUsuario");
const btnGuardarNombre = document.getElementById("btnGuardarNombre");

const formPassword     = document.getElementById("formPassword");
const btnMostrarPwd    = document.getElementById("btnMostrarPwd");
const btnCancelarPwd   = document.getElementById("btnCancelarPwd");
const btnConfirmarPwd  = document.getElementById("btnConfirmarPwd");

const passActual       = document.getElementById("passActual");
const passNueva        = document.getElementById("passNueva");
const passConfirm      = document.getElementById("passConfirm");

const btnCerrarSesion  = document.getElementById("btnCerrarSesion");
const logoutBtnMenu    = document.getElementById("logoutBtn");
const userLinks        = document.querySelectorAll(".usuario-link");

// ======================= HELPERS =======================
function setInfo(user) {
  const id     = user.idUsuario ?? user.id ?? user.IDUSUARIO;
  const rol    = user.rol ?? user.ROL;
  const estado = user.estado ?? user.ESTADO;
  const nombre = user.nombreUsuario ?? user.username ?? user.NOMBREUSUARIO;

  infoIdUsuario.value = id ?? "";
  infoRol.value       = rol ?? "";
  infoEstado.value    = estado ?? "";
  nombreUsuario.value = nombre ?? "";

  if (id) localStorage.setItem("userId", id);
}

function validarNombre() {
  const u = (nombreUsuario.value || "").trim();
  const regex = /^[A-Za-z0-9._-]{4,100}$/;
  if (!u) { Swal.fire("Validación","El nombre de usuario es obligatorio.","warning"); return false; }
  if (!regex.test(u)) {
    Swal.fire("Validación","Usa 4–100 caracteres: letras, números y . _ -","warning");
    return false;
  }
  return true;
}

function validarPassword() {
  const a = (passActual.value || "").trim();
  const n = (passNueva.value || "").trim();
  const c = (passConfirm.value || "").trim();
  const fuerte = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

  if (!a || !n || !c) { Swal.fire("Validación","Completa todos los campos.","warning"); return false; }
  if (!fuerte.test(n)) {
    Swal.fire("Validación","La nueva contraseña debe tener al menos 8 caracteres con letra y número.","warning");
    return false;
  }
  if (n !== c) { Swal.fire("Validación","La confirmación no coincide.","warning"); return false; }
  if (a === n) { Swal.fire("Validación","La nueva contraseña no puede ser igual a la actual.","warning"); return false; }
  return true;
}

// ======================= FETCH JSON =======================
async function fetchJson(url, opts = {}) {
  const headers = new Headers(opts.headers || {});
  const token = localStorage.getItem("authToken");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, { ...opts, headers, credentials: "include" });

  if (res.status === 401) {
    localStorage.clear();
    Swal.fire("Sesión expirada", "Por favor inicia sesión de nuevo", "warning")
      .then(() => window.location.href = INDEX_URL);
    throw new Error("401 Unauthorized");
  }

  if (!res.ok) {
    const t = await res.text().catch(()=> "");
    throw new Error(`${res.status} ${res.statusText} - ${t}`);
  }

  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : {};
}

// ======================= CARGA USUARIO =======================
let usuarioActual = null;
async function cargarUsuario() {
  try {
    usuarioActual = getUsuarioLogueado();
    if (!usuarioActual) throw new Error("No hay sesión activa");

    const id = getUserId() || usuarioActual.idUsuario;
    if (!id) throw new Error("No hay idUsuario válido");

    const data = await fetchJson(`${USU_API_URL}/${id}`);
    usuarioActual = data.data || data || usuarioActual;

    setInfo(usuarioActual);
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "No se pudo cargar el usuario. Inicia sesión de nuevo.", "error")
      .then(() => window.location.href = INDEX_URL);
  }
}

// ======================= MOSTRAR/OCULTAR CAMBIO DE CONTRASEÑA =======================
function abrirSeccionPwd() {
  formPassword.classList.remove("d-none");
  btnMostrarPwd.classList.add("d-none");
}
function cerrarSeccionPwd() {
  formPassword.reset();
  formPassword.classList.add("d-none");
  btnMostrarPwd.classList.remove("d-none");
}
btnMostrarPwd?.addEventListener("click", abrirSeccionPwd);
btnCancelarPwd?.addEventListener("click", cerrarSeccionPwd);

document.querySelectorAll(".toggle-pass").forEach(btn => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.target;
    const input = document.getElementById(id);
    input.type = input.type === "password" ? "text" : "password";
  });
});

// ======================= SUBMITS =======================
formUsuario?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!usuarioActual) return;
  if (!validarNombre()) return;

  const body = { nombreUsuario: nombreUsuario.value.trim() };
  try {
    btnGuardarNombre.disabled = true;
    await fetchJson(`${USU_API_URL}/editar/${usuarioActual.idUsuario}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    usuarioActual.nombreUsuario = body.nombreUsuario;
    setInfo(usuarioActual);
    Swal.fire("¡Guardado!", "Nombre de usuario actualizado.", "success");
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "No se pudo actualizar el nombre. Asegúrate de que sea único.", "error");
  } finally {
    btnGuardarNombre.disabled = false;
  }
});

formPassword?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!usuarioActual) return;
  if (!validarPassword()) return;

  const payload = {
    contrasenaActual: passActual.value.trim(),
    contrasena: passNueva.value.trim()
  };

  try {
    btnConfirmarPwd.disabled = true;
    await fetchJson(`${USU_API_URL}/${usuarioActual.idUsuario}/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    cerrarSeccionPwd();
    Swal.fire("¡Actualizada!", "Contraseña cambiada correctamente.", "success");
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "No se pudo cambiar la contraseña.", "error");
  } finally {
    btnConfirmarPwd.disabled = false;
  }
});

// ======================= LOGOUT =======================
btnCerrarSesion?.addEventListener("click", () => logout({ redirectTo: INDEX_URL }));
logoutBtnMenu?.addEventListener("click", (e)=>{ e.preventDefault(); logout({ redirectTo: INDEX_URL }); });

// ======================= ENLACES USUARIO =======================
userLinks.forEach(el => {
  el.addEventListener("click", () => window.location.href = USUARIO_URL);
});

// ======================= INIT =======================
cargarUsuario();

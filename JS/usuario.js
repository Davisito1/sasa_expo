/* ===== CONFIG ===== */
const USU_API_URL = 'http://localhost:8080/apiUsuarios'; // <-- tu backend
const INDEX_URL   = '../autenticacion/index.html';         // cerrar sesión => autenticacion/index.html
const USUARIO_URL = '../usuario/usuario.html';             // enlace Usuario

/* ===== DOM ===== */
const infoIdUsuario    = document.getElementById('infoIdUsuario');
const infoRol          = document.getElementById('infoRol');
const infoEstado       = document.getElementById('infoEstado');

const formUsuario      = document.getElementById('formUsuario');
const nombreUsuario    = document.getElementById('nombreUsuario');
const btnGuardarNombre = document.getElementById('btnGuardarNombre');

const formPassword     = document.getElementById('formPassword');
const btnMostrarPwd    = document.getElementById('btnMostrarPwd');
const btnCancelarPwd   = document.getElementById('btnCancelarPwd');
const btnConfirmarPwd  = document.getElementById('btnConfirmarPwd');

const passActual       = document.getElementById('passActual');
const passNueva        = document.getElementById('passNueva');
const passConfirm      = document.getElementById('passConfirm');

const btnCerrarSesion  = document.getElementById('btnCerrarSesion');
const logoutBtnMenu    = document.getElementById('logoutBtn');
const userLinks        = document.querySelectorAll('.usuario-link');

/* ===== OFFSET dinámico (topbar + sidebar) ===== */
function setLayoutOffsets() {
  try {
    const tb = document.querySelector('.topbar');
    const sb = document.getElementById('sidebar');
    if (tb) document.documentElement.style.setProperty('--topbar-h', `${Math.ceil(tb.getBoundingClientRect().height)}px`);
    if (sb) document.documentElement.style.setProperty('--sidebar-w', `${Math.ceil(sb.getBoundingClientRect().width)}px`);
  } catch {}
}
window.addEventListener('resize', setLayoutOffsets);
document.addEventListener('DOMContentLoaded', setLayoutOffsets);

/* ===== HELPERS ===== */
function nUsuario(d) {
  return {
    idUsuario: d.idUsuario ?? d.id ?? d.IDUSUARIO ?? d.idusuario,
    nombreUsuario: d.nombreUsuario ?? d.nombreusuario ?? d.NOMBREUSUARIO,
    rol: d.rol ?? d.ROL,
    estado: d.estado ?? d.ESTADO
  };
}
function setInfo(u) {
  infoIdUsuario.value = u.idUsuario ?? '';
  infoRol.value       = u.rol ?? '';
  infoEstado.value    = u.estado ?? '';
  nombreUsuario.value = u.nombreUsuario ?? '';
}
function validarNombre() {
  const u = (nombreUsuario.value || '').trim();
  const regex = /^[A-Za-z0-9._-]{4,100}$/;
  if (!u) { Swal.fire('Validación','El nombre de usuario es obligatorio.','warning'); return false; }
  if (!regex.test(u)) {
    Swal.fire('Validación','Usa 4–100 caracteres: letras, números y . _ -','warning');
    return false;
  }
  return true;
}
function validarPassword() {
  const a = (passActual.value || '').trim();
  const n = (passNueva.value || '').trim();
  const c = (passConfirm.value || '').trim();
  const fuerte = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

  if (!a || !n || !c) { Swal.fire('Validación','Completa todos los campos.','warning'); return false; }
  if (!fuerte.test(n)) {
    Swal.fire('Validación','La nueva contraseña debe tener al menos 8 caracteres con letra y número.','warning');
    return false;
  }
  if (n !== c) { Swal.fire('Validación','La confirmación no coincide.','warning'); return false; }
  if (a === n) { Swal.fire('Validación','La nueva contraseña no puede ser igual a la actual.','warning'); return false; }
  return true;
}
async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const t = await res.text().catch(()=> '');
    throw new Error(`${res.status} ${res.statusText} - ${t}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : {};
}

/* ===== CARGA USUARIO ===== */
let usuarioActual = null;
async function cargarUsuario() {
  try {
    try {
      const me = await fetchJson(`${USU_API_URL}/me`);
      usuarioActual = nUsuario(me);
    } catch (_) {
      const idLS = localStorage.getItem('userId') || localStorage.getItem('idUsuario') || localStorage.getItem('idCliente');
      if (!idLS) throw new Error('No hay id de usuario en localStorage.');
      usuarioActual = nUsuario(await fetchJson(`${USU_API_URL}/${idLS}`));
    }
    setInfo(usuarioActual);
  } catch (err) {
    console.error(err);
    Swal.fire('Error', 'No se pudo cargar el usuario. Verifica tu sesión.', 'error');
  }
}

/* ===== MOSTRAR/OCULTAR CAMBIO DE CONTRASEÑA ===== */
function abrirSeccionPwd() {
  formPassword.classList.remove('d-none');
  btnMostrarPwd.classList.add('d-none');
  passActual.required = true; passNueva.required = true; passConfirm.required = true;
  document.getElementById('ajustes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function cerrarSeccionPwd() {
  formPassword.reset();
  formPassword.classList.add('d-none');
  btnMostrarPwd.classList.remove('d-none');
  passActual.required = false; passNueva.required = false; passConfirm.required = false;
}
btnMostrarPwd.addEventListener('click', abrirSeccionPwd);
btnCancelarPwd.addEventListener('click', cerrarSeccionPwd);

/* ver/ocultar inputs de password */
document.querySelectorAll('.toggle-pass').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.target;
    const input = document.getElementById(id);
    input.type = input.type === 'password' ? 'text' : 'password';
  });
});

/* ===== SUBMITS ===== */
formUsuario.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!usuarioActual) return;
  if (!validarNombre()) return;

  const body = { nombreUsuario: nombreUsuario.value.trim() };
  try {
    btnGuardarNombre.disabled = true;
    await fetchJson(`${USU_API_URL}/${usuarioActual.idUsuario}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    usuarioActual.nombreUsuario = body.nombreUsuario;
    setInfo(usuarioActual);
    Swal.fire('¡Guardado!', 'Nombre de usuario actualizado.', 'success');
  } catch (err) {
    console.error(err);
    Swal.fire('Error', 'No se pudo actualizar el nombre. Asegúrate de que sea único.', 'error');
  } finally {
    btnGuardarNombre.disabled = false;
  }
});

formPassword.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!usuarioActual) return;
  if (!validarPassword()) return;

  const payload = {
    contrasenaActual: passActual.value.trim(), // si tu API lo requiere
    contrasena: passNueva.value.trim()
  };

  try {
    btnConfirmarPwd.disabled = true;

    // Ruta específica para password si existe
    await fetchJson(`${USU_API_URL}/${usuarioActual.idUsuario}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    cerrarSeccionPwd();
    Swal.fire('¡Actualizada!', 'Contraseña cambiada correctamente.', 'success');
  } catch (err) {
    // Fallback: PUT general
    try {
      await fetchJson(`${USU_API_URL}/${usuarioActual.idUsuario}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contrasena: passNueva.value.trim() })
      });
      cerrarSeccionPwd();
      Swal.fire('¡Actualizada!', 'Contraseña cambiada correctamente.', 'success');
    } catch (e2) {
      console.error(e2);
      Swal.fire('Error', 'No se pudo cambiar la contraseña.', 'error');
    }
  } finally {
    btnConfirmarPwd.disabled = false;
  }
});

/* ===== LOGOUT con confirmación (redirige a autenticacion/index.html) ===== */
async function confirmLogout() {
  const res = await Swal.fire({
    title: '¿Cerrar sesión?',
    text: 'Se cerrará tu sesión y volverás al inicio.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, salir',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  });
  if (res.isConfirmed) {
    try { localStorage.clear(); } finally {
      window.location.href = INDEX_URL;
    }
  }
}
btnCerrarSesion?.addEventListener('click', confirmLogout);
logoutBtnMenu?.addEventListener('click', (e)=>{ e.preventDefault(); confirmLogout(); });

/* ===== Enlaces "Usuario" => usuario.html ===== */
userLinks.forEach(el => {
  el.addEventListener('click', () => window.location.href = USUARIO_URL);
});

/* ===== Init ===== */
cargarUsuario();

// *** LoginController.js ***
// Mantiene consistencia visual + lógica limpia + SweetAlert

// ====== CONFIG ======
const DASHBOARD_URL = '../dashboard/index.html';
// Si tienes endpoint real de autenticación, colócalo aquí:
const AUTH_API_URL  = ''; // e.g., 'http://localhost:8080/api/auth/login'

// Modo demo (si no hay API): usa un usuario de prueba
const DEMO_USERS = [{ usuario: 'admin', password: '1234' }];

// ====== DOM ======
const form = document.getElementById('loginForm');
const inputUsuario = document.getElementById('usuario');
const inputPassword = document.getElementById('password');
const btnTogglePwd = document.getElementById('btnTogglePwd');
const btnLogin = document.getElementById('loginButton');

// ====== Utils ======
function setLoading(isLoading){
  if (!btnLogin) return;
  btnLogin.classList.toggle('loading', isLoading);
  btnLogin.disabled = isLoading;
}

function toast(icon, title, text){
  return Swal.fire({ icon, title, text, confirmButtonColor:'#C91A1A' });
}

async function authWithApi(usuario, password){
  // Implementa según tu backend
  // Ejemplo POST JSON:
  const resp = await fetch(AUTH_API_URL, {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify({ usuario, password })
  });

  if(!resp.ok){
    const msg = await resp.text().catch(()=> '');
    throw new Error(`HTTP ${resp.status} ${msg}`);
  }
  // Asume que el backend devuelve {token, user, ...}
  return resp.json();
}

function authDemo(usuario, password){
  const ok = DEMO_USERS.some(u => u.usuario === usuario && u.password === password);
  if(!ok) throw new Error('Credenciales inválidas');
  return { token: 'demo-token', user:{ usuario } };
}

// ====== Eventos ======
btnTogglePwd?.addEventListener('click', () => {
  const isPwd = inputPassword.type === 'password';
  inputPassword.type = isPwd ? 'text' : 'password';
  btnTogglePwd.innerHTML = isPwd
    ? '<i class="fa-regular fa-eye-slash"></i>'
    : '<i class="fa-regular fa-eye"></i>';
  inputPassword.focus();
});

form?.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Validación básica
  const usuario = inputUsuario.value.trim();
  const password = inputPassword.value.trim();

  // Estilos de validación
  form.classList.add('was-validated');
  inputUsuario.classList.toggle('is-invalid', !usuario);
  inputPassword.classList.toggle('is-invalid', !password || password.length < 4);
  if(!usuario || !password || password.length < 4) return;

  setLoading(true);
  try{
    let data;
    if (AUTH_API_URL) {
      data = await authWithApi(usuario, password);
    } else {
      // Fallback demo si no hay API definida
      data = authDemo(usuario, password);
    }

    // Persistencia mínima (ajusta a tu app)
    localStorage.setItem('sasa_token', data.token ?? '');
    localStorage.setItem('sasa_user', JSON.stringify(data.user ?? { usuario }));

    await Swal.fire({
      icon: 'success',
      title: '¡Bienvenido!',
      text: 'Redirigiendo al Dashboard…',
      timer: 1200,
      showConfirmButton: false
    });

    window.location.href = DASHBOARD_URL;
  } catch(err){
    console.error('Login error:', err);
    toast('error', 'No pudimos iniciar sesión', 'Verifica tu usuario y contraseña.');
  } finally{
    setLoading(false);
  }
});

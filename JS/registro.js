// ===============================
// RegistroController.js
// ===============================
// Minimal y coherente con tu BD Cliente 
// Campos: nombre, apellido, dui, fechaNacimiento, correo, contrasena
// ===============================

// ====== CONFIG ======
const LOGIN_URL = '../Autenticacion/login.html'; // Redirección tras éxito
// 🔹 Si ya tienes API real, coloca la URL aquí:
const REGISTER_API_URL = ''; // ej: 'http://localhost:8080/api/cliente/registrar'

// ====== DOM ======
const form       = document.getElementById('registroForm');
const nombre     = document.getElementById('nombre');
const apellido   = document.getElementById('apellido');
const dui        = document.getElementById('dui');
const fecha      = document.getElementById('fecha');
const correo     = document.getElementById('correo');
const password   = document.getElementById('password');
const btnToggle  = document.getElementById('btnTogglePwd');
const btnSubmit  = document.getElementById('btnRegistrar');

// ===============================
// LÓGICA DE CAMPOS
// ===============================

// -------- límites de fecha --------
(() => {
  const today = new Date().toISOString().slice(0,10);
  fecha.max = today;          // no permitir fechas futuras
  fecha.min = '1900-01-01';   // límite inferior razonable
})();

// -------- máscara DUI --------
// Formato: ########-#
dui.addEventListener('input', () => {
  let v = dui.value.replace(/\D/g,'').slice(0,9);
  if (v.length > 8) v = v.slice(0,8) + '-' + v.slice(8);
  dui.value = v;
});

// -------- toggle mostrar/ocultar contraseña --------
btnToggle.addEventListener('click', () => {
  const show = password.type === 'password';
  password.type = show ? 'text' : 'password';
  btnToggle.textContent = show ? 'Ocultar' : 'Mostrar';
  password.focus();
});

// ===============================
// UTILS
// ===============================

// -------- Estado de loading en botón --------
function setLoading(b){
  btnSubmit.classList.toggle('loading', b);
  btnSubmit.disabled = b;
}

// -------- Validación de email --------
const okEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// -------- Petición a API real --------
async function registerApi(payload){
  const r = await fetch(REGISTER_API_URL, {
    method:'POST', 
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// ===============================
// SUBMIT DEL FORMULARIO
// ===============================
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // -------- Validaciones --------
  const valid =
    nombre.value.trim().length >= 2 &&
    apellido.value.trim().length >= 2 &&
    /^\d{8}-\d$/.test(dui.value.trim()) &&
    !!fecha.value &&
    okEmail(correo.value.trim()) &&
    password.value.trim().length >= 6;

  // Estilos bootstrap
  form.classList.add('was-validated');
  nombre.classList.toggle('is-invalid', !(nombre.value.trim().length >= 2));
  apellido.classList.toggle('is-invalid', !(apellido.value.trim().length >= 2));
  dui.classList.toggle('is-invalid', !/^\d{8}-\d$/.test(dui.value.trim()));
  fecha.classList.toggle('is-invalid', !fecha.value);
  correo.classList.toggle('is-invalid', !okEmail(correo.value.trim()));
  password.classList.toggle('is-invalid', !(password.value.trim().length >= 6));
  if(!valid) return;

  // -------- Proceso de registro --------
  setLoading(true);
  try{
    if (REGISTER_API_URL){
      // 🔹 API real
      await registerApi({
        nombre: nombre.value.trim(),
        apellido: apellido.value.trim(),
        dui: dui.value.trim(),
        fechaNacimiento: fecha.value,   // ISO yyyy-mm-dd
        correo: correo.value.trim(),
        contrasena: password.value.trim()
      });
    } else {
      // 🔹 DEMO local (usa localStorage para simular registros)
      const demo = JSON.parse(localStorage.getItem('sasa_reg_demo') || '[]');
      demo.push({
        nombre: nombre.value.trim(),
        apellido: apellido.value.trim(),
        dui: dui.value.trim(),
        fechaNacimiento: fecha.value,
        correo: correo.value.trim()
      });
      localStorage.setItem('sasa_reg_demo', JSON.stringify(demo));
    }

    // Mensaje éxito
    await Swal.fire({
      icon: 'success',
      title: 'Registro exitoso',
      confirmButtonText: 'Iniciar sesión',
      confirmButtonColor: '#C91A1A'
    });
    window.location.href = LOGIN_URL;

  } catch(err) {
    console.error(err);
    // Mensaje error
    await Swal.fire({
      icon:'error',
      title:'No pudimos registrar tu cuenta',
      text:'Inténtalo nuevamente.',
      confirmButtonColor:'#C91A1A'
    });
  } finally {
    setLoading(false);
  }
});

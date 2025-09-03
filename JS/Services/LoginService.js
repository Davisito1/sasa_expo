// ===============================
// LoginService.js
// ===============================

// URL base de la API de usuarios (cuando se conecte al backend real)
const API_BASE = "http://localhost:8080/apiUsuario";

// ===============================
// LOGIN (con usuarios simulados)
// ===============================
export async function login(nombreUsuario, password) {
  try {
    console.log(' Intentando login con:', { nombreUsuario, password });
    
    // 🔹 SOLUCIÓN TEMPORAL: usuarios hardcodeados para pruebas
    const usuariosSimulados = [
      {
        "id": 1,
        "nombreUsuario": "admin01",
        "contrasena": "admin123",
        "rol": "Administrador",
        "estado": "Activo"
      },
      {
        "id": 2,
        "nombreUsuario": "mecanico01",
        "contrasena": "mecanico123", 
        "rol": "Mecánico",
        "estado": "Activo"
      },
      {
        "id": 3,
        "nombreUsuario": "recepcion01",
        "contrasena": "recepcion123",
        "rol": "Recepcionista", 
        "estado": "Activo"
      }
    ];

    // Buscar coincidencia en usuarios simulados
    const usuarioValido = usuariosSimulados.find(user => 
      user.nombreUsuario === nombreUsuario && 
      user.contrasena === password
    );

    console.log('🔎 Usuario encontrado:', usuarioValido);

    if (usuarioValido) {
      // Respuesta simulando login exitoso
      return {
        status: "success",
        data: usuarioValido,
        message: "Login exitoso"
      };
    } else {
      // Error de credenciales inválidas
      throw new Error('Usuario o contraseña incorrectos');
    }

  } catch (error) {
    console.error(' Error en login:', error);
    throw error;
  }
}

// ===============================
// GESTIÓN DE SESIÓN EN LOCALSTORAGE
// ===============================

// Obtener usuario logueado desde localStorage
export function getUsuarioLogueado() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// Cerrar sesión
export function logout() {
  localStorage.removeItem('user');
  window.location.href = '../login/login.html'; // redirigir al login
}

// Verificar si hay sesión activa
export function isLoggedIn() {
  return localStorage.getItem('user') !== null;
}

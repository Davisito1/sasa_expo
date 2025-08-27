const API_BASE = "http://localhost:8080/apiUsuario";

export async function login(nombreUsuario, password) {
  try {
    console.log('🔍 Intentando login con:', { nombreUsuario, password });
    
    // ✅ SOLUCIÓN TEMPORAL: Usar usuarios de prueba
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

    // Buscar usuario en la lista simulada
    const usuarioValido = usuariosSimulados.find(user => 
      user.nombreUsuario === nombreUsuario && 
      user.contrasena === password
    );

    console.log('🔎 Usuario encontrado:', usuarioValido);

    if (usuarioValido) {
      return {
        status: "success",
        data: usuarioValido,
        message: "Login exitoso"
      };
    } else {
      throw new Error('Usuario o contraseña incorrectos');
    }

  } catch (error) {
    console.error('❌ Error en login:', error);
    throw error;
  }
}

// ... las otras funciones permanecen igual ...
export function getUsuarioLogueado() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function logout() {
  localStorage.removeItem('user');
  window.location.href = '../login/login.html';
}

export function isLoggedIn() {
  return localStorage.getItem('user') !== null;
}
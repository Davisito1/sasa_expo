const API_EMPLEADOS = "http://localhost:8080/apiEmpleados"; // Ajusta a tu backend

// Registrar empleado + usuario
export async function register(user) {
  try {
    const res = await fetch(`${API_EMPLEADOS}/registrar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });

    let data;
    try {
      data = await res.json(); // intenta parsear la respuesta
    } catch {
      throw new Error("Error inesperado en el servidor");
    }

    if (!res.ok) {
      // Captura validaciones del backend (ej: DTO o restricciones únicas)
      const msg =
        data.message ||
        (data.errors ? Object.values(data.errors).join(", ") : "Error en el registro");
      throw new Error(msg);
    }

    return data;
  } catch (err) {
    // Si falla la conexión o el servidor no responde
    throw new Error(err.message || "No se pudo conectar con el servidor");
  }
}

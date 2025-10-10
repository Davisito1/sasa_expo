// ===============================
// RegistroService.js (Final)
// ===============================

const API_EMPLEADOS = "https://sasaapi-73d5de493985.herokuapp.com/apiEmpleados";
// Si usas Heroku, reemplaza arriba por:
// const API_EMPLEADOS = "https://sasaapi-73d5de493985.herokuapp.com/apiEmpleados";

// ===============================
// Registrar empleado + usuario
// ===============================
export async function register(user) {
  try {
    const res = await fetch(`${API_EMPLEADOS}/registrar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
      credentials: "include",
    });

    const text = await res.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      console.warn("No se pudo parsear la respuesta del servidor.");
    }

    if (!res.ok) {
      const msg =
        data.message ||
        (data.errors
          ? Object.values(data.errors).join(" | ")
          : `Error ${res.status} al registrar el usuario`);
      throw new Error(msg);
    }

    return data?.data ?? data;
  } catch (err) {
    console.error("Error en registro:", err);
    throw new Error(err.message || "No se pudo conectar con el servidor");
  }
}

const API_URL = "http://localhost:8080/apiVehiculo";

// 🔹 Obtener todos los vehículos
export async function getVehiculos() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Error al obtener vehículos");
  return await res.json();
}

// 🔹 Crear nuevo vehículo
export async function createVehiculo(vehiculo) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vehiculo),
  });
  if (!res.ok) throw new Error("Error al crear vehículo");
  return await res.json();
}

// 🔹 Actualizar vehículo
export async function updateVehiculo(id, vehiculo) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vehiculo),
  });
  if (!res.ok) throw new Error("Error al actualizar vehículo");
  return await res.json();
}

// 🔹 Eliminar vehículo
export async function deleteVehiculo(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar vehículo");
  return true;
}

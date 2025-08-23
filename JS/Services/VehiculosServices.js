const API_URL = "http://localhost:8080/apiVehiculo";

// 🔹 Helper para normalizar la respuesta
function parseResponse(json) {
  if (Array.isArray(json)) return json;                // si ya es array
  if (json.data?.content) return json.data.content;    // si viene dentro de data.content
  if (json.content) return json.content;               // si viene como content
  if (json.data) return json.data;                     // si viene solo en data
  return [];                                           // vacío o estructura rara
}

// 🔹 Obtener todos los vehículos
export async function getVehiculos() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Error al obtener vehículos");
  const json = await res.json();
  return parseResponse(json);
}

// 🔹 Crear nuevo vehículo
export async function createVehiculo(vehiculo) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vehiculo),
  });
  if (!res.ok) throw new Error("Error al crear vehículo");
  const json = await res.json();
  return parseResponse(json);
}

// 🔹 Actualizar vehículo
export async function updateVehiculo(id, vehiculo) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vehiculo),
  });
  if (!res.ok) throw new Error("Error al actualizar vehículo");
  const json = await res.json();
  return parseResponse(json);
}

// 🔹 Eliminar vehículo
export async function deleteVehiculo(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar vehículo");
  return true;
}

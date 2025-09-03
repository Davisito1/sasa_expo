const API_URL = "http://localhost:8080/apiCitas";

function parseResponse(json) {
  if (Array.isArray(json)) return json;                // si ya es array
  if (json.data?.content) return json.data.content;    // si viene dentro de data.content
  if (json.content) return json.content;               // si viene como content
  if (json.data) return json.data;                     // si viene solo en data
  return [];                                           // vacío o estructura rara
}

export async function getCitas() {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Error al obtener citas");
    const json = res.json();
    return parseResponse(json)
}

export async function createCita(cita) {
    const res = await fetch(`${API_URL}/consultar`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(cita)
    });
    if(!res.ok) throw new Error("Error al crear cita");
    const json = await res.json;
    return parseResponse(json);
}

export async function updateCita(id, cita) {
    const res = await (`${API_URL}/registrar/${id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(cita)
    });
    if (!res.ok) throw new Error("Error al actualizar cita");
    const json = await res.json()
    return parseResponse(json);
}

export async function deleteCita(id) {
    const res = await fetch(`${API_URL}/eliminar/${id}`, {
        method: "DELETE"
    });
    if (!res.ok) throw new Error("Error al eliminar cita");
    return true;
}
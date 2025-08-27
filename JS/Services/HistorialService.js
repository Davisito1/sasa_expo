const API_BASE = "http://localhost:8080/api/historial";

export async function getHistorial(page = 0, size = 10) {
  try {
    const response = await fetch(`${API_BASE}/consultar?page=${page}&size=${size}`);
    if (!response.ok) throw new Error('Error en la respuesta del servidor');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching historial:', error);
    throw error;
  }
}

export async function deleteHistorial(id) {
  try {
    const response = await fetch(`${API_BASE}/eliminar/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error eliminando historial:', error);
    throw error;
  }
}

export async function getHistorialPorVehiculo(idVehiculo) {
  try {
    const response = await fetch(`${API_BASE}/vehiculo/${idVehiculo}`);
    if (!response.ok) throw new Error('Error en la respuesta del servidor');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching historial por vehículo:', error);
    throw error;
  }
}

export async function registrarHistorial(historialData) {
  try {
    const response = await fetch(`${API_BASE}/registrar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(historialData)
    });
    if (!response.ok) throw new Error('Error en la respuesta del servidor');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error registrando historial:', error);
    throw error;
  }
}
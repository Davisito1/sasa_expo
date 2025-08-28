const API_URL = "http://localhost:8080/apiPagos";

async function fetchJsonOrThrow(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let errorData = {};
    try {
      errorData = await res.json();
    } catch {}
    throw new Error(`${res.status} -> ${url}\n${JSON.stringify(errorData)}`);
  }
  return res.json();
}

export async function getPagos() {
  const res = await fetchJsonOrThrow(`${API_URL}/consultar`);
  return res.data ?? res;
}

export async function createPago(dto) {
  return fetchJsonOrThrow(`${API_URL}/registrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

export async function updatePago(id, dto) {
  return fetchJsonOrThrow(`${API_URL}/actualizar/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

export async function deletePago(id) {
  return fetchJsonOrThrow(`${API_URL}/eliminar/${id}`, {
    method: "DELETE",
  });
}

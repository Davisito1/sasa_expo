// ===============================
// FacturasService.js
// ===============================

// URL base de la API de facturas
const API_BASE = "http://localhost:8080/apiFactura";

// ===============================
// FUNCIONES AUXILIARES
// ===============================

// -------- Utilidad base para fetch --------
// Hace la llamada a la API, valida errores y devuelve JSON o texto
async function fetchJsonOrThrow(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();

  // Si la respuesta es error HTTP lanza excepción con detalles
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} -> ${url}\n${text}`);

  // Intenta parsear JSON, si falla devuelve texto plano
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

// -------- Normalización de paginación --------
// Asegura que todas las respuestas tengan la misma estructura {content, totalPages}
function normalizePage(json) {
  if (json?.data?.content) {
    return {
      content: json.data.content,
      totalPages: json.data.totalPages ?? 1
    };
  }
  if (json?.content) {
    return {
      content: json.content,
      totalPages: json.totalPages ?? 1
    };
  }
  if (Array.isArray(json)) {
    return { content: json, totalPages: 1 };
  }
  return { content: [], totalPages: 0 };
}

// ===============================
// SERVICIOS FACTURA (CRUD)
// ===============================

// -------- LISTAR PAGINADO --------
export async function getFacturas(page = 0, size = 10) {
  const json = await fetchJsonOrThrow(`${API_BASE}/consultar?page=${page}&size=${size}`);
  return normalizePage(json);
}

// -------- OBTENER FACTURA POR ID --------
export async function getFacturaById(id) {
  const json = await fetchJsonOrThrow(`${API_BASE}/${id}`);
  return json?.data ?? json;
}


export async function createFactura(data) {
  const payload = {
    fecha: data.fecha,
    montoTotal: data.montoTotal,
    idEmpleado: data.idEmpleado,
    idMantenimiento: data.idMantenimiento,
  };

  const body = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };

  const json = await fetchJsonOrThrow(`${API_BASE}/registrar`, body);
  return json?.data ?? json;
}


export async function updateFactura(id, data) {
  const payload = {
    fecha: data.fecha,
    montoTotal: data.montoTotal,
    idEmpleado: data.idEmpleado,
    idMantenimiento: data.idMantenimiento,
  };

  const body = {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };

  const json = await fetchJsonOrThrow(`${API_BASE}/actualizar/${id}`, body);
  return json?.data ?? json;
}


export async function deleteFactura(id) {
  const json = await fetchJsonOrThrow(`${API_BASE}/eliminar/${id}`, { method: "DELETE" });
  return json?.data ?? json;
}

const BASE="http://localhost:8080";

export async function getFacturas({page=0,size=10,archivada=false,onlyWithOrder=false}={}){
  const url=new URL(`${BASE}/apiFactura/consultar`);
  url.searchParams.set("page",page);
  url.searchParams.set("size",size);
  url.searchParams.set("archivada",archivada?"true":"false");
  if(onlyWithOrder) url.searchParams.set("onlyWithOrder","true");
  const r=await fetch(url.toString(),{credentials:"include"});
  if(!r.ok) return {content:[],totalPages:0,number:0};
  return r.json();
}

export async function archiveFactura(id){
  const r=await fetch(`${BASE}/apiFactura/${id}/archivar`,{method:"PUT",credentials:"include"});
  if(!r.ok) throw new Error("archivar");
  return r.json().catch(()=>({}));
}

export async function unarchiveFactura(id){
  const r=await fetch(`${BASE}/apiFactura/${id}/restaurar`,{method:"PUT",credentials:"include"});
  if(!r.ok) throw new Error("restaurar");
  return r.json().catch(()=>({}));
}

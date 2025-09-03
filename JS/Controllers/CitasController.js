import { getCitas, createCita, updateCita, deleteCita } from "../Services/CitasService.js";
import { getVehiculos } from "../Services/VehiculosServices";

const CLIENTES_API = "http://localhost:8080/apiCliente";

const tablaCitas = document.getElementById("tablaCitas");
const frmAgregar = document.getElementById("frmAgregarCita");
const frmEditar = document.getElementById("frmEditarCita");
const modalAgregar = document.getElementById("mdAgregarCita");
const modalEditar = document.getElementById("mdEditarCita");
const inpuBuscar = document.getElementById("buscar");

let citasCache = [];
let clientesCache = [];

function abrirModalAgregar() {
  modalAgregar.showModal();
}

function cerrarModalAgregar() {
  modalAgregar.close();
  frmAgregar.reset();
}

function abrirModalEditar() {
  modalEditar.showModal();
}

function cerrarModalEditar() {
  modalEditar.close();
  frmEditar.reset();
}

function parseResponse(apiResponse) {
    if (Array.isArray(apiResponse)) return apiResponse;
    if (apiResponse.data?.content) return apiResponse.data.content;
    if (apiResponse.content) return apiResponse.content;
    if (apiResponse.data) return apiResponse.data;
    return [];
}

document.addEventListener("DOMContentLoaded", async () => {
  await cargarClientes();
  await loadVehiculos();
});

async function loadCitas(){
    try{
        const citas = await getCitas();
        citasCache = citas;
        renderCitas(citasCache);
    } catch (e){
        console.error("Error al cargar citas:", err);
        Swal.fire("Error", "No se pudieron cargar las citas", "error");
    }
}

function renderCitas(lista) {
    tablaCitas.innerHTML = "";

    lista.forEach(cita => {
        const cliente = clientesCache(c => (c.id || c.idCliente) === cita.idCliente)

        const row = `
        <tr>
            <td>${cita.id || cita.idCita}</td>
            <td>${cita.fecha}</td>
            <td>${cita.hora}</td>
            <td>${cita.estado}</td>
            <td>${cliente ? cliente.nombre + " " + cliente.apellido : cita.idCliente}</td>
            <td></td>
        </tr>
    `
    });
}

frmAgregar.addEventListener("submit",async (e) => {
    e.preventDefault();

    const cita = {
        fecha: document.getElementById("fechaCita").value,
        hora: document.getElementById("horaCita").value.trim(),
        estado: document.getElementById("selectEstado").value,
        idCliente: parseInt(document.getElementById("txtCliente").value)
    }

    try{
        await createCita(cita)
        Swal.fire("Éxito", "Cita agregada correctamente", "success");
        cerrarModalAgregar();
        loadCitas();
    }
    catch (e){
        console.error("Error al guardar cita:", e);
        Swal.fire("Error", "No se pudo guardar la cita", "error");
    }
});

frmEditar.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("txtIdCita").value

    const cita = {
        fecha: document.getElementById("fechaCita").value,
        hora: document.getElementById("horaCita").value.trim(),
        estado: document.getElementById("selectEstado").value,
        idCliente: parseInt(document.getElementById("txtCliente").value)
    }

    try{
        await updateCita(id, cita);
        Swal.fire("Éxito", "Cita actualizada correctamente", "success");
        cerrarModalEditar();
        loadCitas();
    }
    catch (e){
        console.error("Error al guardar cita:", e);
        Swal.fire("Error", "No se pudo guardar la cita", "error");
    }
});


const API_URL = "https://retoolapi.dev/K3dg6S/citas"; // API de citas

const tabla = document.getElementById("tablaCitas");
const frmAgregar = document.getElementById("frmAgregarCita");
const frmEditar = document.getElementById("frmEditarCita");
const modalAgregar = document.getElementById("mdAgregarCita");
const modalEditar = document.getElementById("mdEditarCita");

// Establecer la fecha mínima para los campos de fecha (hoy)
document.addEventListener("DOMContentLoaded", function () {
    const fechaHoy = new Date();
    const anio = fechaHoy.getFullYear();
    const mes = String(fechaHoy.getMonth() + 1).padStart(2, '0'); // Mes empieza desde 0
    const dia = String(fechaHoy.getDate()).padStart(2, '0'); // Asegurarse de que tenga 2 dígitos

    const fechaHoyFormateada = `${anio}-${mes}-${dia}`;

    // Establecer la fecha mínima para los campos de fecha de agregar y editar
    document.getElementById("fechaCita").setAttribute("min", fechaHoyFormateada);
    document.getElementById("editarFechaCita").setAttribute("min", fechaHoyFormateada);

    // Llamamos a la función para obtener las citas al cargar la página
    ObtenerCitas();
});

function abrirModalAgregar() {
    modalAgregar.showModal();
}

function cerrarModalAgregar() {
    modalAgregar.close();
    frmAgregar.reset();
    document.getElementById("errorCliente").textContent = ""; // Limpiar mensajes de error
    document.getElementById("errorFecha").textContent = "";
}

function abrirModalEditar() {
    modalEditar.showModal();
}

function cerrarModalEditar() {
    modalEditar.close();
    frmEditar.reset();
    document.getElementById("errorCliente").textContent = ""; // Limpiar mensajes de error
    document.getElementById("errorFecha").textContent = "";
}

async function ObtenerCitas() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        MostrarCitas(data);
    } catch (e) {
        console.error("Error al cargar Citas:", e);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudieron cargar las citas"
        });
    }
}

function MostrarCitas(datos) {
    tabla.innerHTML = "";
    datos.forEach(cita => {
        tabla.innerHTML += `
        <tr>
            <td>${cita.id}</td> <!-- Aquí va el ID de la cita -->
            <td>${cita.cliente}</td> <!-- Aquí va el nombre del cliente -->
            <td>${cita.fecha}</td>   <!-- Aquí va la fecha de la cita -->
            <td>${cita.hora}</td>    <!-- Aquí va la hora de la cita -->
            <td>${cita.estado}</td>  <!-- Aquí va el estado de la cita -->
            <td>
                <button class="btn btn-sm btn-primary" onclick="CargarParaEditar(${cita.id})">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="EliminarCita(${cita.id})">Eliminar</button>
            </td>
        </tr>
        `;
    });
}

frmAgregar.addEventListener("submit", async (e) => {
    e.preventDefault();

    const cita = {
        cliente: document.getElementById("txtCliente").value.trim(),
        fecha: document.getElementById("fechaCita").value,
        hora: document.getElementById("horaCita").value,
        estado: document.getElementById("selectEstado").value
    };

    // Validación de campos
    let valido = true;
    
    // Validación Cliente: Solo letras y espacios
    const regexNombre = /^[A-Za-z\s]+$/;
    if (!regexNombre.test(cita.cliente)) {
        document.getElementById("errorCliente").textContent = "El nombre del cliente solo puede contener letras y espacios.";
        valido = false;
    } else {
        document.getElementById("errorCliente").textContent = "";
    }

    // Validación de la fecha
    if (!cita.fecha) {
        document.getElementById("errorFecha").textContent = "La fecha es obligatoria.";
        valido = false;
    } else {
        document.getElementById("errorFecha").textContent = "";
    }

    // Si los campos no son válidos, no continuar
    if (!valido) return;

    // Validación de la fecha no puede ser anterior a la actual
    const fechaSeleccionada = new Date(cita.fecha);
    const fechaHoy = new Date();
    if (fechaSeleccionada < fechaHoy) {
        document.getElementById("errorFecha").textContent = "La fecha no puede ser anterior a la fecha de hoy.";
        return;
    }

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify(cita),
        });

        cerrarModalAgregar();
        ObtenerCitas();
        Swal.fire({
            icon: 'success',
            title: 'Cita Agregada',
            text: 'La cita se agregó correctamente.',
            timer: 1800,
            showConfirmButton: false
        });
    } catch (e) {
        console.error("Error al agregar cita:", e);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo agregar la cita."
        });
    }
});

async function CargarParaEditar(id) {
    try {
        const res = await fetch(`${API_URL}/${id}`);
        const data = await res.json();

        document.getElementById("txtIdCita").value = data.id;
        document.getElementById("txtEditarCliente").value = data.cliente; 
        document.getElementById("editarFechaCita").value = data.fecha;
        document.getElementById("editarHoraCita").value = data.hora;
        document.getElementById("selectEditarEstado").value = data.estado;

        abrirModalEditar();
    } catch (e) {
        console.error("Error al cargar cita para editar:", e);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo cargar la cita."
        });
    }
}

frmEditar.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("txtIdCita").value;
    const cita = {
        cliente: document.getElementById("txtEditarCliente").value.trim(),
        fecha: document.getElementById("editarFechaCita").value,
        hora: document.getElementById("editarHoraCita").value,
        estado: document.getElementById("selectEditarEstado").value
    };

    // Validación de campos
    let valido = true;
    
    // Validación Cliente: Solo letras y espacios
    const regexNombre = /^[A-Za-z\s]+$/;
    if (!regexNombre.test(cita.cliente)) {
        document.getElementById("errorCliente").textContent = "El nombre del cliente solo puede contener letras y espacios.";
        valido = false;
    } else {
        document.getElementById("errorCliente").textContent = "";
    }

    // Validación de la fecha
    if (!cita.fecha) {
        document.getElementById("errorFecha").textContent = "La fecha es obligatoria.";
        valido = false;
    } else {
        document.getElementById("errorFecha").textContent = "";
    }

    // Si los campos no son válidos, no continuar
    if (!valido) return;

    // Validación de la fecha no puede ser anterior a la actual
    const fechaSeleccionada = new Date(cita.fecha);
    const fechaHoy = new Date();
    if (fechaSeleccionada < fechaHoy) {
        document.getElementById("errorFecha").textContent = "La fecha no puede ser anterior a la fecha de hoy.";
        return;
    }

    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify(cita),
        });

        cerrarModalEditar();
        ObtenerCitas();
        Swal.fire({
            icon: 'success',
            title: 'Cita Actualizada',
            text: 'La cita se actualizó correctamente.',
            timer: 1800,
            showConfirmButton: false
        });
    } catch (e) {
        console.error("Error al actualizar cita:", e);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo actualizar la cita."
        });
    }
});

async function EliminarCita(id) {
    const result = await Swal.fire({
        title: '¿Deseas eliminar esta cita?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            await fetch(`${API_URL}/${id}`, {
                method: "DELETE"
            });
            ObtenerCitas();
        } catch (e) {
            console.error("Error al eliminar cita:", e);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo eliminar la cita."
            });
        }
    }
}

function BuscarCita() {
    const texto = document.getElementById("buscar").value.toLowerCase()
    const filas = tabla.getElementsByTagName("tr")
    Array.from(filas).forEach((fila) => {
        const contenido = fila.textContent.toLowerCase()
        fila.style.display = contenido.includes(texto) ? "" : "none"
    })
}
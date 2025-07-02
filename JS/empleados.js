const API_URL = "https://retoolapi.dev/mm42wr/empleados";

const tabla = document.getElementById("tablaEmpleados");
const frmAgregar = document.getElementById("frmAgregarEmpleado");
const frmEditar = document.getElementById("frmEditarEmpleado");
const modalAgregar = document.getElementById("mdAgregarEmpleado");
const modalEditar = document.getElementById("mdEditarEmpleado");

function abrirModalAgregar() {
    modalAgregar.showModal();
}

function cerrarModalAgregar(){
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
    
//Validaciones
function ValidarDUI(dui) {
    return /^\d{8}-\d{1}$/.test(dui.trim());
}

function ValidarTelefono(telefono) {
    return /^\d{4}-\d{4}$/.test(telefono.trim());
}


function ValidarForm(empleado){
    if (!ValidarDUI(empleado.dui)) {
        alert("El DUI no posee el formato correcto");
        return false;
    }

    if (!ValidarTelefono(empleado.telefono)) {
        alert("El número de teléfono no posee el formato correcto");
        return false;
    }

    return true;
}

//Funciones principales
async function ObtenerEmpleados() {
   try{
    const res = await fetch(API_URL);
    const data = await res.json();
    MostrarEmpleados(data);
   }
   catch (e){
    console.error("Error al cargar Empleados:", e);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron cargar los empleados"
    });
   }
}

function MostrarEmpleados(datos) {
    tabla.innerHTML = "";
    datos.forEach(empleado => {
        tabla.innerHTML += `
        <tr>
            <td>${empleado.id}</td>
            <td>${empleado.nombre}</td>
            <td>${empleado.apellido}</td>
            <td>${empleado.cargo}</td>
            <td>${empleado.dui}</td>
            <td>${empleado.telefono}</td>
            <td>${empleado.direccion}</td>
            <td>${empleado.fechaContratacion}</td>
            <td>${empleado.correo}</td>
            <td>${empleado.usuario}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="CargarParaEditar(${empleado.id})">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="EliminarEmpleado(${empleado.id})">Eliminar</button>
            </td>
        </tr>
        `;
    })
}

//Agregar empleado
frmAgregar.addEventListener("submit", async (e) => {
    e.preventDefault();
    const empleado = {
        nombre: document.getElementById("txtNombre").value.trim(),
        apellido: document.getElementById("txtApellido").value.trim(),
        cargo: document.getElementById("selectCargo").value.trim(),
        dui: document.getElementById("txtDUI").value.trim(),
        telefono: document.getElementById("txtTelefono").value.trim(),
        direccion: document.getElementById("txtDireccion").value.trim(),
        fechaContratacion: document.getElementById("fechaContratacion").value,
        correo: document.getElementById("txtCorreo").value.trim(),
        usuario: document.getElementById("txtUsuario").value.trim()
    };

    if (!ValidarForm(empleado)) return;

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-type": "application/json"},
            body: JSON.stringify(empleado)
        });

        cerrarModalAgregar();
        ObtenerEmpleados();
        Swal.fire({
            icon: 'success',
            title: 'Empleado agregado',
            text: 'El empleado se agregó correctamente.',
            timer: 1800,
            showConfirmButton: false
        });
    }
    catch (e) {
        console.error("Error al agregar empleado:", e);
        Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo agregar el empleado."
        });
    }
})

async function CargarParaEditar(id) {
    try {
        const res = await fetch(`${API_URL}/${id}`);
        const data = await res.json();

        document.getElementById("txtIdEmpleado").value = data.id;
        document.getElementById("txtEditarNombre").value = data.nombre;
        document.getElementById("txtEditarApellido").value = data.apellido;
        document.getElementById("selectEditarCargo").value = data.cargo;
        document.getElementById("txtEditarDUI").value = data.dui;
        document.getElementById("txtEditarTelefono").value = data.telefono;
        document.getElementById("txtEditarDireccion").value = data.direccion;
        document.getElementById("editarFechaContratacion").value = data.fechaContratacion;
        document.getElementById("txtEditarCorreo").value = data.correo;
        document.getElementById("txtEditarUsuario").value = data.usuario;

        abrirModalEditar();
    }
    catch (e) {
        console.error("Error al cargar empleado para editar:", e);
        Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cargar el empleado."
        });
    }
}

//Editar empleado
frmEditar.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("txtIdEmpleado").value;
    const empleado = {
        nombre: document.getElementById("txtEditarNombre").value.trim(),
        apellido: document.getElementById("txtEditarApellido").value.trim(),
        cargo: document.getElementById("selectEditarCargo").value.trim(),
        dui: document.getElementById("txtEditarDUI").value.trim(),
        telefono: document.getElementById("txtEditarTelefono").value.trim(),
        direccion: document.getElementById("txtEditarDireccion").value.trim(),
        fechaContratacion: document.getElementById("editarFechaContratacion").value,
        correo: document.getElementById("txtEditarCorreo").value.trim(),
        usuario: document.getElementById("txtEditarUsuario").value.trim()
    };

    if (!ValidarForm(empleado)) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {"Content-type": "application/json"},
            body: JSON.stringify(empleado)
        });

        cerrarModalEditar();
        ObtenerEmpleados();
        Swal.fire({
            icon: 'success',
            title: 'Empleado actualizado',
            text: 'El empleado se actualizó correctamente.',
            timer: 1800,
            showConfirmButton: false
        });
    }
    catch (e) {
        console.error("Error al actualizar empleado:", e);
        Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el empleado."
        });
    }
})

async function EliminarEmpleado(id) {
    const result = await Swal.fire({
    title: '¿Deseas eliminar este empleado?',
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
        ObtenerEmpleados();
    }
    catch (e) {
        console.error("Error al eliminar empleado:", error);
        Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar el empleado."
        });
    }
  }
}

function BuscarEmpleado() {
    const texto = document.getElementById("buscar").value.toLowerCase()
    const filas = tabla.getElementsByTagName("tr")
    Array.from(filas).forEach((fila) => {
        const contenido = fila.textContent.toLowerCase()
        fila.style.display = contenido.includes(texto) ? "" : "none"
    })
}

document.addEventListener("DOMContentLoaded", ObtenerEmpleados)
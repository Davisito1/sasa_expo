const API_URL = "https://retoolapi.dev/xGxDiT/sasa-prueba";

// Obtener y mostrar vehículos
async function ObtenerVehiculos() {
    try {
        const respuesta = await fetch(API_URL);
        const data = await respuesta.json();
        MostrarVehiculos(data);
    } catch (error) {
        Swal.fire('Error', 'No se pudo obtener la lista de vehículos.', 'error');
    }
}

function MostrarVehiculos(vehiculos) {
    const tabla = document.getElementById("tablaVehiculos");
    tabla.innerHTML = "";
    vehiculos.forEach(v => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${v.id}</td>
            <td>${v.Marca}</td>
            <td>${v.Modelo}</td>
            <td>${v.Anio}</td>
            <td class="acciones">
                <i class="fas fa-pen" onclick="abrirModalEditar('${v.id}', '${v.Marca}', '${v.Modelo}', '${v.Anio}')"></i>
                <i class="fas fa-trash" onclick="EliminarVehiculo(${v.id})"></i>
            </td>
        `;
        tabla.appendChild(fila);
    });
}

// Buscar vehículo en tabla
function buscarVehiculo() {
    const filtro = document.getElementById('buscar').value.toLowerCase();
    const filas = document.querySelectorAll("#tablaVehiculos tr");
    filas.forEach(fila => {
        const texto = fila.innerText.toLowerCase();
        fila.style.display = texto.includes(filtro) ? "" : "none";
    });
}

// Modales
function abrirModalAgregar() {
    document.getElementById("mdAgregarVehiculo").showModal();
}
function cerrarModalAgregar() {
    document.getElementById("frmAgregarVehiculo").reset();
    document.getElementById("mdAgregarVehiculo").close();
}
function abrirModalEditar(id, marca, modelo, anio) {
    document.getElementById("txtIdEditarVehiculo").value = id;
    document.getElementById("txtMarcaEditar").value = marca;
    document.getElementById("txtModeloEditar").value = modelo;
    document.getElementById("txtAnioEditar").value = anio;
    document.getElementById("mdEditarVehiculo").showModal();
}
function cerrarModalEditar() {
    document.getElementById("frmEditarVehiculo").reset();
    document.getElementById("mdEditarVehiculo").close();
}

// Crear vehículo
document.getElementById("frmAgregarVehiculo").addEventListener("submit", async e => {
    e.preventDefault();
    const marca = document.getElementById("txtMarca").value.trim();
    const modelo = document.getElementById("txtModelo").value.trim();
    const anio = parseInt(document.getElementById("txtAnio").value.trim());

    if (!marca || !modelo || isNaN(anio)) {
        return Swal.fire('Campos incompletos', 'Por favor completa todos los campos correctamente.', 'warning');
    }

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Marca: marca, Modelo: modelo, Anio: anio })
        });
        if (!res.ok) throw new Error();
        Swal.fire('¡Agregado!', 'Vehículo agregado correctamente.', 'success');
        cerrarModalAgregar();
        ObtenerVehiculos();
    } catch {
        Swal.fire('Error', 'No se pudo agregar el vehículo.', 'error');
    }
});

// Editar vehículo
document.getElementById("frmEditarVehiculo").addEventListener("submit", async e => {
    e.preventDefault();
    const id = document.getElementById("txtIdEditarVehiculo").value;
    const marca = document.getElementById("txtMarcaEditar").value.trim();
    const modelo = document.getElementById("txtModeloEditar").value.trim();
    const anio = parseInt(document.getElementById("txtAnioEditar").value.trim());

    if (!id || !marca || !modelo || isNaN(anio)) {
        return Swal.fire('Campos incompletos', 'Completa todos los campos correctamente.', 'warning');
    }

    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Marca: marca, Modelo: modelo, Anio: anio })
        });
        if (!res.ok) throw new Error();
        Swal.fire('¡Actualizado!', 'Vehículo editado correctamente.', 'success');
        cerrarModalEditar();
        ObtenerVehiculos();
    } catch {
        Swal.fire('Error', 'No se pudo editar el vehículo.', 'error');
    }
});

// Eliminar vehículo
async function EliminarVehiculo(id) {
    const result = await Swal.fire({
        title: '¿Eliminar vehículo?',
        text: "Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            Swal.fire('Eliminado', 'El vehículo ha sido eliminado.', 'success');
            ObtenerVehiculos();
        } catch {
            Swal.fire('Error', 'Ocurrió un error al eliminar.', 'error');
        }
    }
}

// Inicializar
ObtenerVehiculos();

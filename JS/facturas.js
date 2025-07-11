// Definir la URL de la API para cargar las facturas
const apiUrl = 'https://retoolapi.dev/AE88w9/data';

// Variables globales para los modales y formularios
const modalAgregar = document.getElementById('mdAgregarFactura');
const modalEditar = document.getElementById('mdEditarFactura');
const tablaFacturas = document.getElementById('tablaFacturas');

// Función para cargar las facturas desde la API
async function cargarFacturas() {
  try {
    const response = await fetch(apiUrl);
    const facturas = await response.json();
    actualizarTabla(facturas);
  } catch (error) {
    console.error('Error al cargar las facturas:', error);
  }
}

// Función para actualizar la tabla de facturas
function actualizarTabla(facturas) {
  tablaFacturas.innerHTML = ''; // Limpiar tabla
  facturas.forEach(factura => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${factura.id}</td>
      <td>${factura.Empleado}</td>
      <td>${factura.Mantenimiento}</td>
      <td>${factura.Monto}</td>
      <td>${factura.Fecha}</td>
      <td>
        <button class="btn btn-sm btn-primary me-2 icon-btn editar" data-id="${factura.id}" title="Editar">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="btn btn-sm btn-danger icon-btn eliminar" data-id="${factura.id}" title="Eliminar">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tablaFacturas.appendChild(row);
  });

  // Asignar eventos de edición y eliminación después de cargar las facturas
  const btnEditar = document.querySelectorAll('.editar');
  const btnEliminar = document.querySelectorAll('.eliminar');

  btnEditar.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('button').getAttribute('data-id');
      editarFactura(id);
    });
  });

  btnEliminar.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('button').getAttribute('data-id');
      eliminarFactura(id);
    });
  });
}

// Función para abrir el modal de agregar factura
function abrirModalAgregar() {
  modalAgregar.showModal();
}

// Función para cerrar el modal de agregar factura
function cerrarModalAgregar() {
  modalAgregar.close();
}

// Función para abrir el modal de editar factura con los datos precargados
async function editarFactura(id) {
  try {
    const response = await fetch(`${apiUrl}/${id}`);
    const factura = await response.json();
    document.getElementById('txtIdFactura').value = factura.id;
    document.getElementById('txtEditarEmpleadoFactura').value = factura.Empleado;
    document.getElementById('txtEditarMantenimientoFactura').value = factura.Mantenimiento;
    document.getElementById('txtEditarMontoFactura').value = factura.Monto;
    document.getElementById('editarFechaFactura').value = factura.Fecha;
    modalEditar.showModal();
  } catch (error) {
    console.error('Error al obtener los datos de la factura:', error);
  }
}

// Función para cerrar el modal de editar factura
function cerrarModalEditar() {
  modalEditar.close();
}

// Función para agregar una nueva factura
document.getElementById('frmAgregarFactura').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const nuevoEmpleado = document.getElementById('txtEmpleadoFactura').value;
  const nuevoMantenimiento = document.getElementById('txtMantenimientoFactura').value;
  const nuevoMonto = document.getElementById('txtMontoFactura').value;
  const nuevaFecha = document.getElementById('fechaFactura').value;

  const nuevaFactura = {
    Empleado: nuevoEmpleado,
    Mantenimiento: nuevoMantenimiento,
    Monto: nuevoMonto,
    Fecha: nuevaFecha
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(nuevaFactura)
    });
    const result = await response.json();
    if (response.ok) {
      Swal.fire('¡Éxito!', 'Factura agregada correctamente.', 'success');
      cargarFacturas(); // Recargar las facturas
      cerrarModalAgregar(); // Cerrar el modal
    } else {
      Swal.fire('Error', result.message || 'Hubo un problema al agregar la factura.', 'error');
    }
  } catch (error) {
    console.error('Error al agregar la factura:', error);
    Swal.fire('Error', 'Hubo un problema al agregar la factura.', 'error');
  }
});

// Función para actualizar una factura
document.getElementById('frmEditarFactura').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const idFactura = document.getElementById('txtIdFactura').value;
  const editarEmpleado = document.getElementById('txtEditarEmpleadoFactura').value;
  const editarMantenimiento = document.getElementById('txtEditarMantenimientoFactura').value;
  const editarMonto = document.getElementById('txtEditarMontoFactura').value;
  const editarFecha = document.getElementById('editarFechaFactura').value;

  const facturaActualizada = {
    Empleado: editarEmpleado,
    Mantenimiento: editarMantenimiento,
    Monto: editarMonto,
    Fecha: editarFecha
  };

  try {
    const response = await fetch(`${apiUrl}/${idFactura}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(facturaActualizada)
    });
    const result = await response.json();
    if (response.ok) {
      Swal.fire('¡Éxito!', 'Factura actualizada correctamente.', 'success');
      cargarFacturas(); // Recargar las facturas
      cerrarModalEditar(); // Cerrar el modal
    } else {
      Swal.fire('Error', result.message || 'Hubo un problema al actualizar la factura.', 'error');
    }
  } catch (error) {
    console.error('Error al actualizar la factura:', error);
    Swal.fire('Error', 'Hubo un problema al actualizar la factura.', 'error');
  }
});

// Función para eliminar una factura
async function eliminarFactura(id) {
  const confirmacion = await Swal.fire({
    title: '¿Estás seguro?',
    text: "Esta factura será eliminada permanentemente.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar'
  });

  if (confirmacion.isConfirmed) {
    try {
      const response = await fetch(`${apiUrl}/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (response.ok) {
        Swal.fire('¡Eliminado!', 'La factura ha sido eliminada.', 'success');
        cargarFacturas(); // Recargar las facturas
      } else {
        Swal.fire('Error', result.message || 'Hubo un problema al eliminar la factura.', 'error');
      }
    } catch (error) {
      console.error('Error al eliminar la factura:', error);
      Swal.fire('Error', 'Hubo un problema al eliminar la factura.', 'error');
    }
  }
}

// Llamada inicial para cargar las facturas
cargarFacturas();

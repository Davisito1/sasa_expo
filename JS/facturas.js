const apiUrl = 'https://retoolapi.dev/AE88w9/data';

const modalAgregar = document.getElementById('mdAgregarFactura');
const modalEditar = document.getElementById('mdEditarFactura');
const tablaFacturas = document.getElementById('tablaFacturas');

async function cargarFacturas() {
  try {
    const response = await fetch(apiUrl);
    const facturas = await response.json();
    actualizarTabla(facturas);
  } catch (error) {
    console.error('Error al cargar las facturas:', error);
  }
}

function actualizarTabla(facturas) {
  tablaFacturas.innerHTML = '';
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

  document.querySelectorAll('.editar').forEach(btn =>
    btn.addEventListener('click', () => editarFactura(btn.dataset.id))
  );
  document.querySelectorAll('.eliminar').forEach(btn =>
    btn.addEventListener('click', () => eliminarFactura(btn.dataset.id))
  );
}

function abrirModalAgregar() {
  modalAgregar.showModal();
}
function cerrarModalAgregar() {
  modalAgregar.close();
}
function cerrarModalEditar() {
  modalEditar.close();
}

// ✅ Validaciones
function validarFactura({ Empleado, Mantenimiento, Monto, Fecha }) {
  if (!Empleado.trim() || !Mantenimiento.trim()) {
    alert('Empleado y Mantenimiento son obligatorios.');
    return false;
  }

  const montoNum = parseFloat(Monto);
  if (isNaN(montoNum) || montoNum <= 0) {
    alert('El monto debe ser un número mayor a 0.');
    return false;
  }

  const fecha = new Date(Fecha);
  const hoy = new Date();
  const seisMesesAtras = new Date();
  seisMesesAtras.setMonth(hoy.getMonth() - 6);

  if (fecha > hoy) {
    alert('La fecha no puede ser futura.');
    return false;
  }

  if (fecha < seisMesesAtras) {
    alert('La fecha no puede ser mayor a 6 meses atrás.');
    return false;
  }

  return true;
}

// Agregar
document.getElementById('frmAgregarFactura').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nuevaFactura = {
    Empleado: document.getElementById('txtEmpleadoFactura').value,
    Mantenimiento: document.getElementById('txtMantenimientoFactura').value,
    Monto: document.getElementById('txtMontoFactura').value,
    Fecha: document.getElementById('fechaFactura').value
  };

  if (!validarFactura(nuevaFactura)) return;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevaFactura)
    });

    if (response.ok) {
      Swal.fire('¡Éxito!', 'Factura agregada correctamente.', 'success');
      cargarFacturas();
      cerrarModalAgregar();
    } else {
      const result = await response.json();
      Swal.fire('Error', result.message || 'Error al agregar la factura.', 'error');
    }
  } catch (error) {
    console.error('Error al agregar la factura:', error);
    Swal.fire('Error', 'Hubo un problema al agregar la factura.', 'error');
  }
});

// Editar
async function editarFactura(id) {
  try {
    const res = await fetch(`${apiUrl}/${id}`);
    const factura = await res.json();

    document.getElementById('txtIdFactura').value = factura.id;
    document.getElementById('txtEditarEmpleadoFactura').value = factura.Empleado;
    document.getElementById('txtEditarMantenimientoFactura').value = factura.Mantenimiento;
    document.getElementById('txtEditarMontoFactura').value = factura.Monto;
    document.getElementById('editarFechaFactura').value = factura.Fecha;

    modalEditar.showModal();
  } catch (error) {
    console.error('Error al cargar factura:', error);
    Swal.fire('Error', 'No se pudo cargar la factura.', 'error');
  }
}

// Guardar edición
document.getElementById('frmEditarFactura').addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('txtIdFactura').value;

  const facturaActualizada = {
    Empleado: document.getElementById('txtEditarEmpleadoFactura').value,
    Mantenimiento: document.getElementById('txtEditarMantenimientoFactura').value,
    Monto: document.getElementById('txtEditarMontoFactura').value,
    Fecha: document.getElementById('editarFechaFactura').value
  };

  if (!validarFactura(facturaActualizada)) return;

  try {
    const res = await fetch(`${apiUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(facturaActualizada)
    });

    if (res.ok) {
      Swal.fire('¡Éxito!', 'Factura actualizada correctamente.', 'success');
      cargarFacturas();
      cerrarModalEditar();
    } else {
      const result = await res.json();
      Swal.fire('Error', result.message || 'Error al actualizar la factura.', 'error');
    }
  } catch (error) {
    console.error('Error al actualizar factura:', error);
    Swal.fire('Error', 'Hubo un problema al actualizar la factura.', 'error');
  }
});

// Eliminar
async function eliminarFactura(id) {
  const confirm = await Swal.fire({
    title: '¿Estás seguro?',
    text: 'Esta factura será eliminada permanentemente.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (confirm.isConfirmed) {
    try {
      const res = await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        Swal.fire('¡Eliminado!', 'La factura ha sido eliminada.', 'success');
        cargarFacturas();
      } else {
        const result = await res.json();
        Swal.fire('Error', result.message || 'No se pudo eliminar la factura.', 'error');
      }
    } catch (error) {
      console.error('Error al eliminar factura:', error);
      Swal.fire('Error', 'Hubo un problema al eliminar la factura.', 'error');
    }
  }
}

// Carga inicial
cargarFacturas();

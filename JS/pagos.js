const API_URL = "https://retoolapi.dev/Tym5QB/pagos";

document.addEventListener('DOMContentLoaded', () => {
  const btnNuevoPago = document.querySelector('.btn-nuevo');
  const modalPago = document.getElementById('modalPago');
  const formNuevoPago = document.getElementById('formNuevoPago');
  const tbody = document.querySelector('.tabla-pagos tbody');
  const inputBuscar = document.querySelector('.search-input');

  let idEditando = null;

  btnNuevoPago.addEventListener('click', () => {
    idEditando = null;
    formNuevoPago.reset();
    modalPago.showModal();
  });

  modalPago.addEventListener('click', (e) => {
    if (e.target.tagName === 'DIALOG') {
      modalPago.close();
    }
  });

 async function cargarPagos() {
  try {
    const res = await fetch(API_URL);
    const pagos = await res.json();
    tbody.innerHTML = "";
    pagos.forEach(pago => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${pago.id}</td>
        <td>${new Date(pago.fecha).toLocaleDateString('es-ES')}</td>
        <td>${parseFloat(pago.monto).toFixed(2).replace('.', ',')}</td>
        <td>${pago.metodo}</td>
        <td>${pago.factura}</td>
        <td>
      <button class="btn btn-sm btn-primary me-2 icon-btn editar" data-id="${pago.id}" title="Editar">
  <i class="bi bi-pencil-square"></i>
</button>
<button class="btn btn-sm btn-danger icon-btn eliminar" data-id="${pago.id}" title="Eliminar">
  <i class="bi bi-trash"></i>
</button>

        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    Swal.fire('Error', 'No se pudieron cargar los pagos.', 'error');
  }
}

  cargarPagos();

  formNuevoPago.addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = {
      fecha: formNuevoPago.fecha.value,
      monto: formNuevoPago.monto.value,
      metodo: formNuevoPago.metodo.value,
      factura: formNuevoPago.factura.value
    };

    if (!datos.fecha || !datos.monto || !datos.metodo || !datos.factura) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    // Validar monto
    if (isNaN(datos.monto) || parseFloat(datos.monto) <= 0) {
      alert("El monto debe ser un número mayor a cero.");
      return;
    }

    // Validar fecha dentro de los últimos 6 meses
    const fechaIngresada = new Date(datos.fecha);
    const hoy = new Date();
    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

    if (fechaIngresada > hoy) {
      alert("La fecha no puede ser futura.");
      return;
    }

    if (fechaIngresada < seisMesesAtras) {
      alert("La fecha no puede ser mayor a 6 meses atrás.");
      return;
    }

    try {
      if (idEditando) {
        await fetch(`${API_URL}/${idEditando}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datos)
        });
        Swal.fire('Pago actualizado', 'El pago fue actualizado correctamente.', 'success');
      } else {
        await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datos)
        });
        Swal.fire('Pago agregado', 'El nuevo pago ha sido registrado.', 'success');
      }
      idEditando = null;
      formNuevoPago.reset();
      modalPago.close();
      cargarPagos();
    } catch (error) {
      Swal.fire('Error', 'Error al guardar el pago.', 'error');
    }
  });

tbody.addEventListener('click', async (e) => {
  const btnEditar = e.target.closest('.editar');
  if (btnEditar) {
    const id = btnEditar.dataset.id;
    try {
      const res = await fetch(`${API_URL}/${id}`);
      const data = await res.json();
      idEditando = id;
      formNuevoPago.fecha.value = data.fecha;
      formNuevoPago.monto.value = data.monto;
      formNuevoPago.metodo.value = data.metodo;
      formNuevoPago.factura.value = data.factura;
      modalPago.showModal();
    } catch (error) {
      Swal.fire('Error', 'No se pudo cargar el pago.', 'error');
    }
    return; // evita que siga al siguiente if
  }

  const btnEliminar = e.target.closest('.eliminar');
  if (btnEliminar) {
    const id = btnEliminar.dataset.id;

    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el pago permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await fetch(`${API_URL}/${id}`, { method: "DELETE" });
          Swal.fire('Eliminado', 'El pago fue eliminado correctamente.', 'success');
          cargarPagos();
        } catch (error) {
          Swal.fire('Error', 'No se pudo eliminar el pago.', 'error');
        }
      }
    });
  }
});


  if (inputBuscar) {
    inputBuscar.addEventListener('input', () => {
      const texto = inputBuscar.value.toLowerCase();
      const filas = tbody.querySelectorAll('tr');
      filas.forEach(fila => {
        const visible = Array.from(fila.querySelectorAll('td')).some(celda =>
          celda.textContent.toLowerCase().includes(texto)
        );
        fila.style.display = visible ? '' : 'none';
      });
    });
  }
});

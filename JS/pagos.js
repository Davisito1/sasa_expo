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
            <i class="fas fa-pencil-alt editar" data-id="${pago.id}"></i>
            <i class="fas fa-trash eliminar" data-id="${pago.id}"></i>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (error) {
      alert("No se pudieron cargar los pagos.");
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
    try {
      if (idEditando) {
        await fetch(`${API_URL}/${idEditando}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datos)
        });
      } else {
        await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datos)
        });
      }
      idEditando = null;
      formNuevoPago.reset();
      modalPago.close();
      cargarPagos();
    } catch (error) {
      alert("Error al guardar el pago.");
    }
  });

  tbody.addEventListener('click', async (e) => {
    if (e.target.classList.contains('editar')) {
      const id = e.target.dataset.id;
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
        alert("Error al cargar el pago.");
      }
    }
    if (e.target.classList.contains('eliminar')) {
      const id = e.target.dataset.id;
      if (confirm("¿Desea eliminar este pago?")) {
        try {
          await fetch(`${API_URL}/${id}`, { method: "DELETE" });
          cargarPagos();
        } catch (error) {
          alert("Error al eliminar el pago.");
        }
      }
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

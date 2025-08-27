import { getHistorial, deleteHistorial } from "../Services/HistorialService.js";

const tablaHistorial = document.getElementById("tablaHistorial");
const pagWrap = document.getElementById("paginacion");
const inputBuscar = document.getElementById("buscarHistorial");
const selectPageSize = document.getElementById("registrosPorPagina");

let paginaActual = 0;
let tamPagina = selectPageSize ? parseInt(selectPageSize.value, 10) : 10;
let historialData = [];
let totalPages = 1;

async function cargarHistorial() {
  try {
    const response = await getHistorial(paginaActual, tamPagina);
    
    if (response && response.content) {
      historialData = response.content;
      totalPages = response.totalPages;
      renderHistorial(historialData);
      renderPaginacion(totalPages);
    } else {
      tablaHistorial.innerHTML = '<tr><td colspan="7" class="text-center">No hay registros de historial</td></tr>';
      pagWrap.innerHTML = '';
    }
  } catch (error) {
    console.error('Error cargando historial:', error);
    tablaHistorial.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error al cargar los datos</td></tr>';
    pagWrap.innerHTML = '';
  }
}

function renderHistorial(historial) {
  if (!tablaHistorial) return;
  
  tablaHistorial.innerHTML = '';

  if (historial.length === 0) {
    tablaHistorial.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron registros</td></tr>';
    return;
  }

  historial.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-center">${item.id || 'undefined'}</td>
      <td class="text-center">${item.fechaIngreso || '-'}</td>
      <td class="text-center">${item.fechaSalida || '-'}</td>
      <td>${item.trabajoRealizado || ''}</td>
      <td>${item.observaciones || ''}</td>
      <td class="text-center">${item.idVehiculo || ''}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-danger" onclick="eliminarRegistro(${item.id || 0})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tablaHistorial.appendChild(tr);
  });
}

function renderPaginacion(totalPages) {
  if (!pagWrap) return;
  
  pagWrap.innerHTML = '';

  if (totalPages <= 1) return;

  for (let i = 0; i < totalPages; i++) {
    const btn = document.createElement('button');
    btn.className = `btn btn-sm ${i === paginaActual ? 'btn-primary' : 'btn-outline-primary'} me-1`;
    btn.textContent = i + 1;
    btn.onclick = () => {
      paginaActual = i;
      cargarHistorial();
    };
    pagWrap.appendChild(btn);
  }
}

window.eliminarRegistro = async function(id) {
  if (!id || id === 0) {
    Swal.fire('Error', 'ID de registro inválido', 'error');
    return;
  }

  try {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esta acción!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      await deleteHistorial(id);
      
      Swal.fire(
        'Eliminado!',
        'El registro ha sido eliminado correctamente.',
        'success'
      );
      
      cargarHistorial();
    }
  } catch (error) {
    console.error('Error al eliminar:', error);
    Swal.fire(
      'Error!',
      'No se pudo eliminar el registro. El endpoint de eliminar no existe en la API.',
      'error'
    );
  }
};

if (inputBuscar) {
  inputBuscar.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = historialData.filter(item => 
      Object.values(item).some(value => 
        value && String(value).toLowerCase().includes(searchTerm)
      )
    );
    renderHistorial(filtered);
  });
}

if (selectPageSize) {
  selectPageSize.addEventListener('change', (e) => {
    tamPagina = parseInt(e.target.value, 10);
    paginaActual = 0;
    cargarHistorial();
  });
}

document.addEventListener('DOMContentLoaded', cargarHistorial);
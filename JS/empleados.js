/***************************************
 * Empleados — CRUD + búsqueda + paginación
 ***************************************/
const API_URL = "https://retoolapi.dev/mm42wr/empleados";

/* ====== Nodos ====== */
const tbody = document.getElementById("tablaEmpleados");
const frmAgregar = document.getElementById("frmAgregarEmpleado");
const frmEditar  = document.getElementById("frmEditarEmpleado");
const modalAgregar = document.getElementById("mdAgregarEmpleado");
const modalEditar  = document.getElementById("mdEditarEmpleado");

const inputBuscar = document.getElementById("buscar");
const selectPorPagina = document.getElementById("registrosPorPagina");
const paginacionWrap  = document.getElementById("paginacion");

/* ====== Estado ====== */
let empleados = [];
let filtrados = [];
let paginaActual = 1;
let porPagina = (selectPorPagina && parseInt(selectPorPagina.value,10)) || 10;

/* ====== Util modales ====== */
function abrirModal(modal, form) {
  modal?.showModal?.();
  if (form) form.reset();
}
function cerrarModal(modal, form) {
  modal?.close?.();
  if (form) form.reset();
}
function abrirModalAgregar(){ abrirModal(modalAgregar, frmAgregar); }
function cerrarModalAgregar(){ cerrarModal(modalAgregar, frmAgregar); }
function cerrarModalEditar(){  cerrarModal(modalEditar,  frmEditar);  }

/* ====== Validaciones ====== */
function validarDUI(dui){ return /^\d{8}-\d{1}$/.test((dui||"").trim()); }
function validarTelefono(t){ return /^\d{4}-\d{4}$/.test((t||"").trim()); }
function validarForm(e){
  if (!validarDUI(e.dui))      { Swal.fire("Error","El DUI debe tener el formato ########-#.","warning"); return false; }
  if (!validarTelefono(e.telefono)){ Swal.fire("Error","El teléfono debe tener el formato ####-####.","warning"); return false; }
  return true;
}

/* ====== Data ====== */
async function obtenerEmpleados(){
  try{
    const res = await fetch(API_URL);
    if(!res.ok) throw new Error("Error al cargar empleados");
    empleados = await res.json();
    aplicarFiltro();
    render();
  }catch(e){
    console.error(e);
    empleados = [];
    aplicarFiltro();
    render();
    Swal.fire("Error","No se pudieron cargar los empleados.","error");
  }
}

/* ====== Filtro + paginación ====== */
function aplicarFiltro(){
  const q = (inputBuscar?.value || "").trim().toLowerCase();
  if(!q){
    filtrados = [...empleados];
  }else{
    filtrados = empleados.filter(e=>{
      const campos = [
        e.id, e.nombre, e.apellido, e.cargo, e.dui, e.telefono,
        e.direccion, e.fechaContratacion, e.correo, e.usuario
      ];
      return campos.some(v => String(v ?? "").toLowerCase().includes(q));
    });
  }
  paginaActual = 1; // reset al cambiar filtro
}

function setPorPagina(){
  porPagina = (selectPorPagina && parseInt(selectPorPagina.value,10)) || 10;
  paginaActual = 1;
  render();
}

/* Expuesta para el onkeyup del HTML (opcional) */
function BuscarEmpleado(){
  aplicarFiltro();
  render();
}
window.BuscarEmpleado = BuscarEmpleado;

/* ====== Render ====== */
function render(){
  renderTabla();
  renderPaginacion();
  rewireRowActions();
}

function renderTabla(){
  if(!tbody) return;

  const total = filtrados.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  // clamp
  if(paginaActual > totalPaginas) paginaActual = totalPaginas;
  if(paginaActual < 1) paginaActual = 1;

  const start = (paginaActual - 1) * porPagina;
  const end   = start + porPagina;
  const vista = filtrados.slice(start, end);

  if(vista.length === 0){
    tbody.innerHTML = `<tr><td colspan="11" class="text-center">Sin resultados</td></tr>`;
    return;
  }

  tbody.innerHTML = vista.map(empleado => `
    <tr>
      <td>${empleado.id ?? ""}</td>
      <td>${empleado.nombre ?? ""}</td>
      <td>${empleado.apellido ?? ""}</td>
      <td>${empleado.cargo ?? ""}</td>
      <td>${empleado.dui ?? ""}</td>
      <td>${empleado.telefono ?? ""}</td>
      <td>${empleado.direccion ?? ""}</td>
      <td>${empleado.fechaContratacion ?? ""}</td>
      <td>${empleado.correo ?? ""}</td>
      <td>${empleado.usuario ?? ""}</td>
      <td>
        <button class="icon-btn btn-primary btn-editar" data-id="${empleado.id}" title="Editar">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="icon-btn btn-danger btn-eliminar" data-id="${empleado.id}" title="Eliminar">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join("");
}

function renderPaginacion(){
  if(!paginacionWrap) return;

  const total = filtrados.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const btn = (label, disabled, onClick, extra='') =>
    `<button class="btn ${extra}" ${disabled?'disabled':''} data-action="${onClick}">${label}</button>`;

  // Construimos un paginador simple: Anterior, números, Siguiente
  let html = "";
  html += btn("Anterior", paginaActual===1, "prev");
  for(let p=1; p<=totalPaginas; p++){
    html += btn(p, false, `page-${p}`, ` ${p===paginaActual?'btn-primary':''} `);
  }
  html += btn("Siguiente", paginaActual===totalPaginas, "next");

  paginacionWrap.innerHTML = html;

  // Listeners
  paginacionWrap.querySelectorAll("button[data-action]").forEach(b=>{
    const action = b.getAttribute("data-action");
    b.addEventListener("click", ()=>{
      if(action==="prev" && paginaActual>1){ paginaActual--; render(); }
      else if(action==="next"){
        const totalPag = Math.max(1, Math.ceil(filtrados.length / porPagina));
        if(paginaActual<totalPag){ paginaActual++; render(); }
      }else if(action?.startsWith("page-")){
        paginaActual = parseInt(action.split("-")[1],10) || 1;
        render();
      }
    });
  });
}

function rewireRowActions(){
  document.querySelectorAll(".btn-editar").forEach(btn=>{
    btn.onclick = () => cargarParaEditar(btn.dataset.id);
  });
  document.querySelectorAll(".btn-eliminar").forEach(btn=>{
    btn.onclick = () => eliminarEmpleado(btn.dataset.id);
  });
}

/* ====== CRUD ====== */
// Agregar
frmAgregar?.addEventListener("submit", async e=>{
  e.preventDefault();

  const empleado = {
    nombre:  frmAgregar.txtNombre.value.trim(),
    apellido:frmAgregar.txtApellido.value.trim(),
    cargo:   frmAgregar.selectCargo.value.trim(),
    dui:     frmAgregar.txtDUI.value.trim(),
    telefono:frmAgregar.txtTelefono.value.trim(),
    direccion:frmAgregar.txtDireccion.value.trim(),
    fechaContratacion: frmAgregar.fechaContratacion.value,
    correo:  frmAgregar.txtCorreo.value.trim(),
    usuario: frmAgregar.txtUsuario.value.trim(),
  };

  if (!validarForm(empleado)) return;

  try{
    const res = await fetch(API_URL, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(empleado)
    });
    if(!res.ok) throw new Error("Error al agregar empleado");
    cerrarModalAgregar();
    await obtenerEmpleados();
    Swal.fire("Éxito","Empleado agregado correctamente.","success");
  }catch(e){
    console.error(e);
    Swal.fire("Error","No se pudo agregar el empleado.","error");
  }
});

// Cargar para editar
async function cargarParaEditar(id){
  try{
    const res = await fetch(`${API_URL}/${id}`);
    if(!res.ok) throw new Error("Error al cargar empleado");
    const data = await res.json();

    frmEditar.txtIdEmpleado.value = data.id;
    frmEditar.txtEditarNombre.value = data.nombre ?? "";
    frmEditar.txtEditarApellido.value = data.apellido ?? "";
    frmEditar.selectEditarCargo.value = data.cargo ?? "administrador";
    frmEditar.txtEditarDUI.value = data.dui ?? "";
    frmEditar.txtEditarTelefono.value = data.telefono ?? "";
    frmEditar.txtEditarDireccion.value = data.direccion ?? "";
    frmEditar.editarFechaContratacion.value = data.fechaContratacion ?? "";
    frmEditar.txtEditarCorreo.value = data.correo ?? "";
    frmEditar.txtEditarUsuario.value = data.usuario ?? "";

    abrirModal(modalEditar);
  }catch(e){
    console.error(e);
    Swal.fire("Error","No se pudo cargar el empleado para editar.","error");
  }
}

// Editar
frmEditar?.addEventListener("submit", async e=>{
  e.preventDefault();

  const id = frmEditar.txtIdEmpleado.value;
  const empleado = {
    nombre:  frmEditar.txtEditarNombre.value.trim(),
    apellido:frmEditar.txtEditarApellido.value.trim(),
    cargo:   frmEditar.selectEditarCargo.value.trim(),
    dui:     frmEditar.txtEditarDUI.value.trim(),
    telefono:frmEditar.txtEditarTelefono.value.trim(),
    direccion:frmEditar.txtEditarDireccion.value.trim(),
    fechaContratacion: frmEditar.editarFechaContratacion.value,
    correo:  frmEditar.txtEditarCorreo.value.trim(),
    usuario: frmEditar.txtEditarUsuario.value.trim(),
  };

  if (!validarForm(empleado)) return;

  try{
    const res = await fetch(`${API_URL}/${id}`, {
      method:"PUT",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(empleado)
    });
    if(!res.ok) throw new Error("Error al actualizar empleado");
    cerrarModalEditar();
    await obtenerEmpleados();
    Swal.fire("Éxito","Empleado actualizado correctamente.","success");
  }catch(e){
    console.error(e);
    Swal.fire("Error","No se pudo actualizar el empleado.","error");
  }
});

// Eliminar
async function eliminarEmpleado(id){
  const result = await Swal.fire({
    title:"¿Deseas eliminar este empleado?",
    icon:"warning",
    showCancelButton:true,
    confirmButtonText:"Sí, eliminar",
    cancelButtonText:"Cancelar"
  });
  if(!result.isConfirmed) return;

  try{
    const res = await fetch(`${API_URL}/${id}`, { method:"DELETE" });
    if(!res.ok) throw new Error("Error al eliminar empleado");
    await obtenerEmpleados();
    Swal.fire("Eliminado","Empleado eliminado correctamente.","success");
  }catch(e){
    console.error(e);
    Swal.fire("Error","No se pudo eliminar el empleado.","error");
  }
}

/* ====== Eventos ====== */
inputBuscar?.addEventListener("input", ()=>{ aplicarFiltro(); render(); });
selectPorPagina?.addEventListener("change", setPorPagina);

/* ====== Inicio ====== */
document.addEventListener("DOMContentLoaded", obtenerEmpleados);

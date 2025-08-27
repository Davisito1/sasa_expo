import {
  getMantenimientos,
  createMantenimiento,
  updateMantenimiento,
  deleteMantenimiento
} from "../Services/MantenimientoService.js";

const VEHICULOS_API = "http://localhost:8080/apiVehiculo";

const tabla = document.getElementById("tablaMantenimiento");
const pagWrap = document.getElementById("paginacion");
const inputBuscar = document.getElementById("buscar");
const selectSize = document.getElementById("registrosPorPagina");

const mantenimientoModal = new bootstrap.Modal(document.getElementById("mantenimientoModal"));
const form = document.getElementById("mantenimientoForm");

const txtId = document.getElementById("mantenimientoId");
const txtDesc = document.getElementById("descripcionTrabajo");
const txtFecha = document.getElementById("fechaRealizacion");
const txtCodigo = document.getElementById("codigoMantenimiento");
const selVeh = document.getElementById("idVehiculo");

let vehiculosCache = [];
let mantenimientosCache = [];
let paginaActual = 1;
let tamPagina = parseInt(selectSize?.value ?? "10",10);
let totalPaginas = 1;

// ===== Utils =====
const fmtDateYMD = d => {
  if (!d) return "";
  if (typeof d === "string") return d.split("T")[0];
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;
};
const fmtHuman = d => {
  const s = fmtDateYMD(d);
  if (!s) return "";
  const [y,m,dd] = s.split("-");
  return `${dd}/${m}/${y}`;
};

// ===== Validaciones =====
function validar(dto) {
  // Descripción
  if (!dto.descripcionTrabajo || /^\d+$/.test(dto.descripcionTrabajo)) {
    Swal.fire({ icon:"error", title:"Error", text:"La descripción no puede estar vacía ni ser solo números" });
    return false;
  }
  if (dto.descripcionTrabajo.length > 500) {
    Swal.fire({ icon:"error", title:"Error", text:"La descripción no puede exceder 500 caracteres" });
    return false;
  }

  // Fecha
  if (!dto.fechaRealizacion) {
    Swal.fire({ icon:"error", title:"Error", text:"La fecha de realización es obligatoria" });
    return false;
  }
  const fecha = new Date(dto.fechaRealizacion);
  if (isNaN(fecha.getTime())) {
    Swal.fire({ icon:"error", title:"Error", text:"Fecha inválida" });
    return false;
  }
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const min = new Date("2000-01-01");
  if (fecha > hoy) {
    Swal.fire({ icon:"error", title:"Error", text:"La fecha no puede ser futura" });
    return false;
  }
  if (fecha < min) {
    Swal.fire({ icon:"error", title:"Error", text:"La fecha no puede ser anterior al año 2000" });
    return false;
  }

  // Vehículo
  if (!dto.idVehiculo || dto.idVehiculo <= 0) {
    Swal.fire({ icon:"error", title:"Error", text:"Debe seleccionar un vehículo válido" });
    return false;
  }
  return true;
}

// ===== Form Submit =====
form.addEventListener("submit", async e => {
  e.preventDefault();
  const dto = {
    descripcionTrabajo: txtDesc.value.trim(),
    fechaRealizacion: txtFecha.value,
    codigoMantenimiento: txtCodigo.value.trim(),
    idVehiculo: parseInt(selVeh.value,10)
  };

  if (!validar(dto)) return;

  try {
    if (txtId.value) {
      await updateMantenimiento(parseInt(txtId.value,10), dto);
      Swal.fire("Éxito","Mantenimiento actualizado","success");
    } else {
      await createMantenimiento(dto);
      Swal.fire("Éxito","Mantenimiento registrado","success");
    }
    mantenimientoModal.hide();
    await loadMantenimientos(true);
  } catch(err){
    mostrarErroresDeBackend(err,"Error al guardar");
  }
});

// ===== Editar =====
window.editarMantenimiento = (id) => {
  const m = mantenimientosCache.find(x => (x.id ?? x.idMantenimiento) === id);
  if (!m) return;
  txtId.value = m.id ?? m.idMantenimiento;
  txtDesc.value = m.descripcionTrabajo ?? m.descripcion ?? "";
  txtFecha.value = fmtDateYMD(m.fechaRealizacion);
  txtCodigo.value = m.codigoMantenimiento ?? "";
  selVeh.value = m.idVehiculo ?? m.vehiculo?.idVehiculo ?? "";
  document.getElementById("mantenimientoModalLabel").textContent = "Editar Mantenimiento";
  mantenimientoModal.show();
};

// ===== Nuevo =====
document.getElementById("btnAddMantenimiento")?.addEventListener("click",()=>{
  form.reset();
  txtId.value="";
  txtCodigo.value="";
  txtFecha.max=fmtDateYMD(new Date());
  document.getElementById("mantenimientoModalLabel").textContent="Agregar Mantenimiento";
  mantenimientoModal.show();
});

// ===== Eliminar =====
window.eliminarMantenimiento = async (id) => {
  const ok = await Swal.fire({
    title:"¿Eliminar mantenimiento?",
    icon:"warning",
    showCancelButton:true,
    confirmButtonColor:"#d33",
    cancelButtonText:"Cancelar",
    confirmButtonText:"Sí, eliminar"
  }).then(r=>r.isConfirmed);
  if (!ok) return;

  try {
    await deleteMantenimiento(id);
    Swal.fire("Eliminado","Mantenimiento borrado","success");
    await loadMantenimientos();
  } catch(err){
    Swal.fire("Error","No se pudo eliminar","error");
  }
};

// ===== Render =====
function renderTabla(lista){
  tabla.innerHTML="";
  lista.forEach(m=>{
    const id=m.id??m.idMantenimiento;
    const v=vehiculosCache.find(vh=>(vh.id||vh.idVehiculo)===(m.idVehiculo??m.vehiculo?.idVehiculo));
    const vehTxt=v?`${v.marca} — ${v.placa}`: (m.idVehiculo??"");
    tabla.insertAdjacentHTML("beforeend",`
      <tr>
        <td>${id}</td>
        <td>${m.descripcionTrabajo??m.descripcion??""}</td>
        <td>${fmtHuman(m.fechaRealizacion)}</td>
        <td>${m.codigoMantenimiento??""}</td>
        <td>${vehTxt}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-primary me-2" onclick="editarMantenimiento(${id})"><i class="bi bi-pencil-square"></i></button>
          <button class="btn btn-sm btn-danger" onclick="eliminarMantenimiento(${id})"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `);
  });
}
function renderPaginacion(totalPag){
  pagWrap.innerHTML="";
  for(let p=1;p<=totalPag;p++){
    const btn=document.createElement("button");
    btn.className=`btn btn-sm ${p===paginaActual?"btn-primary":"btn-outline-primary"}`;
    btn.textContent=p;
    btn.onclick=()=>{paginaActual=p;loadMantenimientos();};
    pagWrap.appendChild(btn);
  }
}

// ===== Data =====
async function cargarVehiculos(){
  const res=await fetch(`${VEHICULOS_API}/consultar?page=0&size=50`);
  const json=await res.json();
  vehiculosCache=json?.content||json?.data||json||[];
  selVeh.innerHTML='<option value="">Seleccione un vehículo</option>'+
    vehiculosCache.map(v=>`<option value="${v.id||v.idVehiculo}">${v.marca} — ${v.placa}</option>`).join("");
}
async function loadMantenimientos(reset=false){
  const query=inputBuscar?.value??"";
  const res=await getMantenimientos(paginaActual-1,tamPagina,query);
  mantenimientosCache=res.content??[];
  totalPaginas=res.totalPages??1;
  if(reset) paginaActual=1;
  renderTabla(mantenimientosCache);
  renderPaginacion(totalPaginas);
}

// ===== Errores backend =====
function mostrarErroresDeBackend(err,msg){
  console.error(err);
  let body;
  try{
    const raw=String(err.message||"");
    body=JSON.parse(raw.substring(raw.indexOf("{")));
  }catch{}
  const errores=body?.errors;
  if(errores){
    const html=Object.entries(errores).map(([k,v])=>`<div><b>${k}:</b> ${v}</div>`).join("");
    Swal.fire({icon:"error",title:"Error",html});
  }else{
    Swal.fire("Error",msg,"error");
  }
}

// ===== Init =====
document.addEventListener("DOMContentLoaded", async ()=>{
  txtFecha.max=fmtDateYMD(new Date());
  await cargarVehiculos();
  await loadMantenimientos(true);
});
inputBuscar?.addEventListener("input",()=>{paginaActual=1;loadMantenimientos(true);});
selectSize?.addEventListener("change",()=>{tamPagina=parseInt(selectSize.value,10);paginaActual=1;loadMantenimientos(true);});

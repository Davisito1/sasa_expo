import { crearOrden, actualizarOrden } from "../Services/OrdenTrabajoService.js";
import { agregarDetalle, eliminarDetalle } from "../Services/DetalleOrdenService.js";
import { listarMantenimientos } from "../Services/MantenimientosService.js";
import { buscarVehiculo } from "../Services/VehiculoService.js";
import { obtenerFacturaPorOrden, crearActualizarFactura, anularFactura, listarEmpleados, listarMetodosPago } from "../Services/FacturaService.js";

const $=(id)=>document.getElementById(id);
const vehiculoBusqueda=$("vehiculoBusqueda");
const btnBuscarVehiculo=$("btnBuscarVehiculo");
const vehiculoSel=$("vehiculoSeleccionado");
const fechaOrden=$("fechaOrden");
const idOrden=$("idOrden");
const btnNuevaOrden=$("btnNuevaOrden");
const btnGuardarOrden=$("btnGuardarOrden");
const btnCancelarOrden=$("btnCancelarOrden");
const selMantenimiento=$("selMantenimiento");
const precioMant=$("precioMant");
const btnAgregarDetalle=$("btnAgregarDetalle");
const tbodyDetalle=document.querySelector("#tablaDetalle tbody");
const montoTotal=$("montoTotal");
const idFactura=$("idFactura");
const fechaFactura=$("fechaFactura");
const selEmpleado=$("selEmpleado");
const selMetodoPago=$("selMetodoPago");
const estadoFactura=$("estadoFactura");
const montoFactura=$("montoFactura");
const descripcionFactura=$("descripcionFactura");
const btnCargarFactura=$("btnCargarFactura");
const btnGenerarFactura=$("btnGenerarFactura");
const btnAnularFactura=$("btnAnularFactura");

let state={vehiculo:null,orden:null,detalles:[],total:0};

function setVehiculoBadge(ok,text){
  vehiculoSel.textContent=text||(ok?"Vehículo seleccionado":"Ninguno");
  vehiculoSel.className="badge "+(ok?"bg-success":"bg-danger");
}
function todayISO(){const d=new Date();const z=d.getTimezoneOffset()*60000;return new Date(Date.now()-z).toISOString().slice(0,10)}
function toast(msg,type="info"){Swal.fire({text:msg,icon:type==="error"?"error":"info",timer:1600,showConfirmButton:false})}
function calcTotal(){
  state.total=state.detalles.reduce((s,d)=>s+(Number(d.precio)||0),0);
  montoTotal.textContent=state.total.toFixed(2);
  if(!montoFactura.value||Number(montoFactura.value)===0){montoFactura.value=state.total.toFixed(2)}
}
function renderDetalles(){
  if(!state.detalles.length){tbodyDetalle.innerHTML=`<tr><td colspan="4" class="text-center text-muted">Sin detalles</td></tr>`;calcTotal();return}
  tbodyDetalle.innerHTML=state.detalles.map(d=>`
    <tr>
      <td>${d.idDetalle??"-"}</td>
      <td>${d.nombre??("ID "+d.idMantenimiento)}</td>
      <td><input type="number" class="form-control form-control-sm precio-input" step="0.01" min="0" max="5000" value="${Number(d.precio||0).toFixed(2)}"/></td>
      <td><button class="btn btn-sm btn-outline-danger btn-del"><i class="fa fa-trash"></i></button></td>
    </tr>`).join("");
  calcTotal();
}

function validarFechaRango(input){
  const v=input.value;
  if(!v)return false;
  if(v<todayISO()){toast("La fecha no puede ser pasada","error");input.value=todayISO();return false}
  if(v>"2026-12-31"){toast("La fecha no puede superar 2026","error");input.value="2026-12-31";return false}
  return true;
}
function validarOrden(){
  const errs=[];
  if(!state.vehiculo?.idVehiculo) errs.push("Debe seleccionar un vehículo");
  if(!fechaOrden.value) errs.push("Debe seleccionar una fecha de orden");
  if(state.detalles.length===0) errs.push("Agregue al menos un mantenimiento");
  if(fechaOrden.value){if(fechaOrden.value<todayISO()) errs.push("La fecha de orden no puede ser pasada"); if(fechaOrden.value>"2026-12-31") errs.push("La fecha de orden no puede superar 2026")}
  return errs;
}
function validarFactura(){
  const errs=[];
  if(!state.orden?.idOrden) errs.push("Debe guardar la orden antes de facturar");
  if(!fechaFactura.value) errs.push("Seleccione fecha de factura");
  const mt=Number(montoFactura.value);
  if(isNaN(mt)||mt<0) errs.push("Monto total inválido");
  if(mt>5000) errs.push("El monto de la factura no puede superar $5000");
  if(!selEmpleado.value) errs.push("Seleccione empleado");
  if(!selMetodoPago.value) errs.push("Seleccione método de pago");
  if(!["Pendiente","Pagada","Cancelada"].includes(estadoFactura.value)) errs.push("Estado de factura inválido");
  if(fechaFactura.value){if(fechaFactura.value<todayISO()) errs.push("La fecha de factura no puede ser pasada"); if(fechaFactura.value>"2026-12-31") errs.push("La fecha de factura no puede superar 2026")}
  return errs;
}

vehiculoBusqueda?.addEventListener("input",()=>{
  let v=vehiculoBusqueda.value;
  const looksLikePlaca=/^[a-zA-Z]{1,3}\d{0,6}$/.test(v.replace(/-/g,""))||/^[a-zA-Z]\d{0,3}-?\d{0,3}$/i.test(v);
  if(!looksLikePlaca) return;
  v=v.toUpperCase().replace(/[^A-Z0-9]/g,"");
  const letras=v.match(/^[A-Z]{1,3}/)?.[0]||"";
  const dig=v.slice(letras.length).replace(/\D/g,"").slice(0,6);
  const d1=dig.slice(0,3);
  const d2=dig.slice(3,6);
  vehiculoBusqueda.value=letras+(d2?d1+"-"+d2:d1);
});
vehiculoBusqueda?.setAttribute("maxlength","10");

btnBuscarVehiculo?.addEventListener("click",async()=>{
  const filtro=vehiculoBusqueda.value?.trim();
  if(!filtro) return setVehiculoBadge(false,"Ingrese criterio de búsqueda");
  try{
    const {data=[]}=await buscarVehiculo(filtro);
    if(!data.length) return setVehiculoBadge(false,"Sin resultados");
    const v=data[0];
    state.vehiculo={idVehiculo:v.idVehiculo,placa:v.placa,clienteNombre:v.clienteNombre};
    setVehiculoBadge(true,`ID ${v.idVehiculo} · ${v.placa??""} · ${v.clienteNombre??""}`);
  }catch(e){
    setVehiculoBadge(false,"Error al buscar");
  }
});

selMantenimiento?.addEventListener("change",()=>{
  const opt=selMantenimiento.options[selMantenimiento.selectedIndex];
  const precioSugerido=opt?.dataset?.precio;
  if(precioSugerido) precioMant.value=Number(precioSugerido).toFixed(2);
});
precioMant?.addEventListener("input",()=>{
  let n=Number(precioMant.value);
  if(isNaN(n)||n<0) n=0;
  if(n>5000) n=5000;
  precioMant.value=n.toFixed(2);
});

btnAgregarDetalle?.addEventListener("click",()=>{
  const idM=Number(selMantenimiento.value);
  if(!idM) return toast("Seleccione un mantenimiento","error");
  const nombre=selMantenimiento.options[selMantenimiento.selectedIndex]?.textContent?.trim()||`ID ${idM}`;
  const precio=Number(precioMant.value);
  if(isNaN(precio)||precio<0) return toast("Precio inválido","error");
  if(precio>5000) return toast("El precio por mantenimiento no puede superar $5000","error");
  state.detalles.push({idMantenimiento:idM,nombre,precio});
  renderDetalles();
});

tbodyDetalle?.addEventListener("input",(e)=>{
  if(!e.target.classList.contains("precio-input")) return;
  const tr=e.target.closest("tr");
  const idx=Array.from(tbodyDetalle.children).indexOf(tr);
  if(idx<0) return;
  let v=Number(e.target.value);
  if(isNaN(v)||v<0) v=0;
  if(v>5000) v=5000;
  e.target.value=v.toFixed(2);
  state.detalles[idx].precio=v;
  calcTotal();
});
tbodyDetalle?.addEventListener("click",async(e)=>{
  const btn=e.target.closest(".btn-del");
  if(!btn) return;
  const tr=e.target.closest("tr");
  const idx=Array.from(tbodyDetalle.children).indexOf(tr);
  if(idx<0) return;
  const det=state.detalles[idx];
  if(det.idDetalle){try{await eliminarDetalle(det.idDetalle)}catch{}}
  state.detalles.splice(idx,1);
  renderDetalles();
});

function setDateLimits(){
  const t=todayISO();
  fechaOrden.setAttribute("min",t);
  fechaOrden.setAttribute("max","2026-12-31");
  fechaFactura.setAttribute("min",t);
  fechaFactura.setAttribute("max","2026-12-31");
}
fechaOrden?.addEventListener("change",()=>validarFechaRango(fechaOrden));
fechaFactura?.addEventListener("change",()=>validarFechaRango(fechaFactura));

btnNuevaOrden?.addEventListener("click",()=>{
  state={vehiculo:null,orden:null,detalles:[],total:0};
  vehiculoBusqueda.value="";
  vehiculoSel.className="badge bg-secondary";
  vehiculoSel.textContent="Ninguno";
  fechaOrden.value=todayISO();
  idOrden.value="";
  idFactura.value="";
  fechaFactura.value=todayISO();
  selEmpleado.value="";
  selMetodoPago.value="";
  estadoFactura.value="Pendiente";
  montoFactura.value="";
  descripcionFactura.value="";
  renderDetalles();
});

btnGuardarOrden?.addEventListener("click",async()=>{
  const errs=validarOrden();
  if(errs.length) return toast(errs[0],"error");
  try{
    let resp;
    if(!state.orden?.idOrden){
      resp=await crearOrden({idVehiculo:state.vehiculo.idVehiculo,fecha:fechaOrden.value});
    }else{
      resp=await actualizarOrden(state.orden.idOrden,{idVehiculo:state.vehiculo.idVehiculo,fecha:fechaOrden.value});
    }
    const orden=resp.data||resp;
    state.orden=orden;
    idOrden.value=orden.idOrden;
    for(const d of state.detalles){
      if(!d.idDetalle){
        const r=await agregarDetalle({idOrden:orden.idOrden,idMantenimiento:d.idMantenimiento,precio:d.precio});
        d.idDetalle=(r.data||r).idDetalle;
      }
    }
    toast("Orden guardada");
  }catch(e){
    toast("Error al guardar la orden","error");
  }
});
btnCancelarOrden?.addEventListener("click",()=>{btnNuevaOrden.click()});

btnCargarFactura?.addEventListener("click",async()=>{
  if(!state.orden?.idOrden) return toast("Primero guarde la orden","error");
  try{
    const r=await obtenerFacturaPorOrden(state.orden.idOrden);
    const fac=r.data||r;
    if(!fac||!fac.idFactura) return toast("La orden no tiene factura aún");
    idFactura.value=fac.idFactura;
    fechaFactura.value=(fac.fecha??todayISO()).slice(0,10);
    montoFactura.value=Number(fac.montoTotal??state.total).toFixed(2);
    selEmpleado.value=fac.idEmpleado??"";
    selMetodoPago.value=fac.idMetodoPago??"";
    estadoFactura.value=fac.estado??"Pendiente";
    descripcionFactura.value=fac.descripcion??"";
    toast("Factura cargada");
  }catch(e){
    toast("No se pudo cargar la factura","error");
  }
});
montoFactura?.addEventListener("input",()=>{
  let n=Number(montoFactura.value);
  if(isNaN(n)||n<0) n=0;
  if(n>5000) n=5000;
  montoFactura.value=n.toFixed(2);
});

btnGenerarFactura?.addEventListener("click",async()=>{
  const errs=validarFactura();
  if(errs.length) return toast(errs[0],"error");
  const payload={
    idFactura:idFactura.value||undefined,
    idOrden:state.orden.idOrden,
    fecha:fechaFactura.value,
    montoTotal:Number(montoFactura.value),
    idEmpleado:Number(selEmpleado.value),
    idMetodoPago:Number(selMetodoPago.value),
    estado:estadoFactura.value,
    descripcion:(descripcionFactura.value||"").trim()||null
  };
  try{
    const r=await crearActualizarFactura(payload);
    const fac=r.data||r;
    idFactura.value=fac.idFactura;
    toast("Factura generada/actualizada");
    window.location.href="../facturas/facturas.html";
  }catch(e){
    toast("Error al generar/actualizar la factura","error");
  }
});

btnAnularFactura?.addEventListener("click",async()=>{
  if(!idFactura.value) return toast("No hay factura para anular","error");
  try{
    await anularFactura(idFactura.value);
    estadoFactura.value="Cancelada";
    toast("Factura anulada");
  }catch(e){
    toast("No se pudo anular la factura","error");
  }
});

$("gotoCliente")?.addEventListener("click",()=>window.location.href="../clientes/clientes.html");
$("gotoVehiculo")?.addEventListener("click",()=>window.location.href="../vehiculos/vehiculos.html");
$("gotoHistorial")?.addEventListener("click",()=>window.location.href="../historial/historial.html");
$("gotoCitas")?.addEventListener("click",()=>window.location.href="../citas/citas.html");

async function cargarCombos(){
  try{
    const {data:mans=[]}=await listarMantenimientos();
    selMantenimiento.innerHTML=`<option value="">Seleccione…</option>`+mans.map(m=>`<option value="${m.idMantenimiento}" data-precio="${m.precio??""}">${m.nombre??("ID "+m.idMantenimiento)}</option>`).join("");
  }catch{selMantenimiento.innerHTML=`<option value="">(sin datos)</option>`}
  try{
    const {data:emps=[]}=await listarEmpleados();
    selEmpleado.innerHTML=`<option value="">Seleccione…</option>`+emps.map(e=>`<option value="${e.idEmpleado}">${e.nombre??("ID "+e.idEmpleado)}</option>`).join("");
  }catch{selEmpleado.innerHTML=`<option value="">(sin datos)</option>`}
  try{
    const {data:mps=[]}=await listarMetodosPago();
    selMetodoPago.innerHTML=`<option value="">Seleccione…</option>`+mps.map(mp=>`<option value="${mp.idMetodoPago}">${mp.nombre??("ID "+mp.idMetodoPago)}</option>`).join("");
  }catch{selMetodoPago.innerHTML=`<option value="">(sin datos)</option>`}
}

document.addEventListener("DOMContentLoaded",async()=>{
  setDateLimits();
  btnNuevaOrden.click();
  await cargarCombos();
});

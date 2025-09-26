import { getFacturas, archiveFactura, unarchiveFactura } from "../Services/FacturasService.js";

const tabla=document.getElementById("tablaFacturas");
const pagWrap=document.getElementById("paginacion");
const pageSizeSel=document.getElementById("registrosPorPagina");
const buscar=document.getElementById("buscar");
const tabs=document.getElementById("tabsFacturas");

let pagina=0;
let size=parseInt(pageSizeSel.value,10);
let tab="activas";
let cache=[];

function badgeEstado(e){const m={Pendiente:"warning",Pagada:"success",Cancelada:"secondary"};const c=m[e]||"light";return `<span class="badge text-bg-${c}">${e||"—"}</span>`}
function renderTabla(rows){
  tabla.innerHTML="";
  if(!rows||!rows.length){tabla.innerHTML=`<tr><td colspan="6" class="text-center">Sin facturas</td></tr>`;return}
  rows.forEach(f=>{
    if(!f.idOrden) return;
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${f.id||f.idFactura}</td>
      <td><button class="btn btn-sm icon-btn" data-ver="${f.idOrden}"><i class="fa-solid fa-up-right-from-square"></i></button></td>
      <td>${f.fecha||""}</td>
      <td>${badgeEstado(f.estado)}</td>
      <td>${f.descripcion||"—"}</td>
      <td class="text-center">
        ${tab==="activas"
          ? `<button class="btn btn-sm btn-outline-secondary icon-btn" data-archivar="${f.id||f.idFactura}"><i class="fa-solid fa-box-archive"></i></button>`
          : `<button class="btn btn-sm btn-outline-primary icon-btn" data-restaurar="${f.id||f.idFactura}"><i class="fa-solid fa-rotate-left"></i></button>`
        }
      </td>
    `;
    tabla.appendChild(tr);
  });
}
function renderPaginacion(p){
  pagWrap.innerHTML="";
  if(!p||p.totalPages<=1) return;
  for(let i=0;i<p.totalPages;i++){
    const b=document.createElement("button");
    b.textContent=i+1;
    b.className=`btn ${i===p.number?"btn-primary":"btn-outline-primary"} btn-sm`;
    b.onclick=()=>{pagina=i;cargar()};
    pagWrap.appendChild(b);
  }
}
function filtrar(busq){
  if(!busq) return cache;
  const q=busq.toLowerCase();
  return cache.filter(f=>{
    const s=[f.id,f.idOrden,f.estado,f.descripcion,f.fecha].map(x=>String(x||"").toLowerCase()).join(" ");
    return s.includes(q);
  });
}
async function cargar(){
  const archivada = tab==="archivadas";
  const data = await getFacturas({page:pagina,size,archivada,onlyWithOrder:true});
  const content = Array.isArray(data)?data:(data.content||[]);
  cache = content.filter(f=>!!f.idOrden);
  renderTabla(filtrar(buscar?.value||""));
  renderPaginacion(Array.isArray(data)?null:data);
}
tabla.addEventListener("click",async e=>{
  const a=e.target.closest("[data-archivar]");
  const r=e.target.closest("[data-restaurar]");
  const v=e.target.closest("[data-ver]");
  if(a){const id=parseInt(a.getAttribute("data-archivar"),10);try{await archiveFactura(id);await cargar()}catch{Swal.fire("Error","No se pudo archivar","error")}}
  if(r){const id=parseInt(r.getAttribute("data-restaurar"),10);try{await unarchiveFactura(id);await cargar()}catch{Swal.fire("Error","No se pudo restaurar","error")}}
  if(v){const idOrden=parseInt(v.getAttribute("data-ver"),10);if(idOrden) window.location.href=`../OrdenDetalle/OrdenDetalle.html?idOrden=${idOrden}`}
});
pageSizeSel.addEventListener("change",()=>{size=parseInt(pageSizeSel.value,10);pagina=0;cargar()});
if(buscar){buscar.addEventListener("input",()=>renderTabla(filtrar(buscar.value)))}
if(tabs){tabs.addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(!b)return;tabs.querySelectorAll(".nav-link").forEach(x=>x.classList.remove("active"));b.classList.add("active");tab=b.getAttribute("data-tab");pagina=0;cargar()})}
document.addEventListener("DOMContentLoaded",cargar);

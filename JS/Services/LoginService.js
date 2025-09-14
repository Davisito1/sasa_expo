const API_BASE   = "http://localhost:8080";
const LOGIN_URL  = `${API_BASE}/auth/login`;
const LOGOUT_URL = `${API_BASE}/auth/logout`;
const ME_URL     = `${API_BASE}/auth/me`;

const TOKEN_KEY = "authToken";
const USER_KEY  = "user";

function setToken(t){ localStorage.setItem(TOKEN_KEY, t); }
function getToken(){ return localStorage.getItem(TOKEN_KEY); }
function clearToken(){ localStorage.removeItem(TOKEN_KEY); }
function setUsuario(u){ localStorage.setItem(USER_KEY, JSON.stringify(u)); }
function getUsuario(){ try{ return JSON.parse(localStorage.getItem(USER_KEY)) || null; }catch{return null;} }
function clearUsuario(){ localStorage.removeItem(USER_KEY); }

let fetchPatched = false;
export function attachAuthInterceptor({ onUnauthorizedRedirect = "../Autenticacion/login.html" } = {}) {
  if (fetchPatched) return;
  fetchPatched = true;
  const _fetch = window.fetch;
  window.fetch = async (input, init={}) => {
    const headers = new Headers(init.headers||{});
    const t = getToken();
    if (t) headers.set("Authorization", `Bearer ${t}`);
    init.headers = headers;
    init.credentials = init.credentials || "include";
    const res = await _fetch(input, init);
    if (res.status === 401) {
      clearToken(); clearUsuario();
      if (onUnauthorizedRedirect) window.location.href = onUnauthorizedRedirect;
    }
    return res;
  };
}

export async function login(userOrEmail, password){
  const payload = userOrEmail.includes("@")
    ? { correo: userOrEmail, contrasena: password }
    : { nombreUsuario: userOrEmail, contrasena: password };

  const r = await fetch(LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  const data = await r.json().catch(()=> ({}));
  if (!r.ok) throw new Error(data?.message || "Credenciales inválidas");

  if (data?.token) setToken(data.token);
  if (data?.user) setUsuario({ ...data.user, autenticado:true });

  return { status:"success", data:data.user };
}

export async function checkAuth(){
  if (!getToken()) return { status:"fail" };
  const r = await fetch(ME_URL, { credentials:"include" });
  if (!r.ok) return { status:"fail" };
  return { status:"success", data: await r.json().catch(()=>true) };
}

export async function logout({ redirectTo="../Autenticacion/login.html" }={}){
  try { await fetch(LOGOUT_URL, { method:"POST", credentials:"include" }); } catch {}
  clearToken(); clearUsuario();
  if (redirectTo) window.location.href = redirectTo;
}

export function isLoggedIn(){ return !!getToken(); }
export function getUsuarioLogueado(){ return getUsuario(); }

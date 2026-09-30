// static/js/auth.js
//
// Une el frontend (este HTML) con el backend (FastAPI) así:
//   1. iniciarSesion()  -> POST /api/v1/auth/login  (definido en api/v1/auth.py)
//   2. obtenerPerfil()  -> GET  /api/v1/auth/me     (definido en api/v1/auth.py)
// Las URLs son RELATIVAS ("/api/v1/...") porque main.py sirve este mismo
// archivo y la API desde el mismo servidor/puerto -> mismo origen -> sin
// CORS, sin URL base que configurar, sin nada más que correr:
//   uvicorn main:app --reload
// y abrir http://127.0.0.1:8000/login

(function () {
  const TOKEN_KEY = "victoria_token";

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  function clearToken() {
    sessionStorage.removeItem(TOKEN_KEY);
  }

  async function iniciarSesion(numeroDocumento, contrasena) {
    // OAuth2PasswordRequestForm en el backend espera
    // application/x-www-form-urlencoded con "username" y "password".
    const body = new URLSearchParams();
    body.set("username", numeroDocumento);
    body.set("password", contrasena);

    const respuesta = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      const detalle = datos.detail || "No fue posible iniciar sesión.";
      throw new Error(detalle);
    }

    setToken(datos.access_token);
    return datos;
  }

  async function obtenerPerfil() {
    const token = getToken();
    if (!token) return null;

    const respuesta = await fetch("/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!respuesta.ok) {
      clearToken();
      return null;
    }

    return respuesta.json();
  }

  function cerrarSesion() {
    clearToken();
    window.location.href = "/login";
  }

  // ---- Página de login ----
  const formLogin = document.getElementById("login-form");
  if (formLogin) {
    const errorBox = document.getElementById("login-error");
    const botonSubmit = document.getElementById("login-submit");

    formLogin.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      errorBox.style.display = "none";

      const usuario = document.getElementById("username").value.trim();
      const contrasena = document.getElementById("password").value;

      botonSubmit.disabled = true;
      try {
        await iniciarSesion(usuario, contrasena);
        window.location.href = "/dashboard";
      } catch (err) {
        errorBox.textContent = err.message;
        errorBox.style.display = "block";
      } finally {
        botonSubmit.disabled = false;
      }
    });
  }

  // ---- Página de dashboard ----
  const dashboardRoot = document.getElementById("dashboard-root");
  if (dashboardRoot) {
    obtenerPerfil().then((perfil) => {
      if (!perfil) {
        window.location.href = "/login";
        return;
      }

      const nombreCompleto = [perfil.nombre, perfil.apellido].filter(Boolean).join(" ");
      document.getElementById("dashboard-nombre").textContent = nombreCompleto;
      document.getElementById("dashboard-documento").textContent =
        `${perfil.tipo_documento} ${perfil.numero_documento}`;
      document.getElementById("dashboard-correo-sena").textContent = perfil.correo_sena;
      document.getElementById("dashboard-correo-personal").textContent = perfil.correo_personal;
      document.getElementById("dashboard-estado").textContent = perfil.estado;
      document.getElementById("dashboard-rol").textContent = `Rol ID: ${perfil.id_rol}`;
    });

    const botonLogout = document.getElementById("logout-btn");
    if (botonLogout) {
      botonLogout.addEventListener("click", cerrarSesion);
    }
  }
})();

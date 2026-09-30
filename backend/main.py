import os
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from routes.usuario import router as usuario_router
from routes.coordinacion import router as coordinacion_router
from routes.programa import router as programa_router
from routes.proyecto import router as proyecto_router
from routes.ficha import router as ficha_router
from routes.competencia import router as competencia_router
from routes.materiales import router as materiales_router
from routes.nota import router as nota_router
from routes.rol import router as rol_router
from routes.sede import router as sede_router
from routes.notificaciones import router as notificaciones_router
from routes.coordinador import router as coordinador_router
from routes.instructor import router as instructor_router
from api.v1 import auth
from routes import tarea
from models.archivo_tarea import ArchivoTarea
from models.archivo_entrega import ArchivoEntrega
from models.archivo_portafolio import ArchivoPortafolio
from routes import portafolio
from routes import seguimiento

from db.database import engine, Base
# Se importa el paquete "models" completo (no un modelo suelto) para que
# TODOS los modelos queden registrados en Base.metadata ANTES de llamar a
# create_all(), sin depender del orden en que se importen los routers.
import models  # noqa: F401

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="API VICTORIA", version="1.0.0")

# ==========================================================================
# 1. CONTROL DE RED (CORS)
# ==========================================================================
# El login (templates/login.html + static/js/auth.js) lo sirve esta MISMA
# API con Jinja2, así que navegador y servidor comparten origen ahí y no
# hace falta CORS para ese login.
#
# PERO la app Expo (appm) corre en su PROPIO servidor de desarrollo (por
# ejemplo http://localhost:8081 cuando la abres con "npx expo start
# --web"), que es un origen DISTINTO al de esta API (http://127.0.0.1:8000
# o http://localhost:8000). Sin CORS habilitado para ese origen, el
# navegador bloquea la respuesta y en pantalla se ve como "No se pudo
# conectar con el servidor" -- aunque el terminal de uvicorn muestre que
# la petición sí llegó y sí se respondió (403, 200, lo que sea): el
# bloqueo lo hace el navegador, no el backend.
#
# Por eso, mientras no definas ALLOWED_ORIGINS a mano en el .env, se
# habilita CORS por defecto para cualquier origen local de desarrollo
# (localhost/127.0.0.1, en cualquier puerto) -- cubre la app Expo, un
# `expo start --web`, o cualquier otra cosa que corras en tu propia
# máquina mientras desarrollas. Para producción, define ALLOWED_ORIGINS
# con el/los dominios reales (ej. https://victoria.tudominio.edu.co) y eso
# reemplaza este valor por defecto.
origins_raw = os.getenv("ALLOWED_ORIGINS")
if origins_raw:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[origen.strip() for origen in origins_raw.split(",")],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )


# ==========================================================================
# 2. CABECERAS DE SEGURIDAD (Anti-Clickjacking / Anti-Sniffing de tipo MIME)
# ==========================================================================
@app.middleware("http")
async def añadir_cabeceras_seguridad(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


# ==========================================================================
# 3. RUTAS DE LA API
# ==========================================================================
# --- Datos maestros / gestión (coordinador, y en algunos casos instructor;
#     ver cada archivo de rutas para el detalle exacto de permisos) ---
app.include_router(usuario_router, prefix="/api/usuarios", tags=["Usuarios"])
app.include_router(coordinacion_router, prefix="/api/coordinaciones", tags=["Coordinaciones"])
app.include_router(programa_router, prefix="/api/programas", tags=["Programas"])
app.include_router(proyecto_router, prefix="/api/proyectos", tags=["Proyectos"])
app.include_router(ficha_router, prefix="/api/fichas", tags=["Fichas"])
app.include_router(competencia_router, prefix="/api/competencias", tags=["Competencias"])
app.include_router(materiales_router, prefix="/api/materiales", tags=["Materiales"])
app.include_router(sede_router, prefix="/api/sedes", tags=["Sedes"])
app.include_router(rol_router, prefix="/api/roles", tags=["Roles"])
app.include_router(tarea.router, prefix="/api/tareas", tags=["tareas"])
app.include_router(portafolio.router, prefix="/api/portafolio", tags=["portafolio"])
app.include_router(seguimiento.router, prefix="/api/seguimiento", tags=["seguimiento"])

# --- Personales (cualquier rol autenticado, solo ve lo suyo) ---
app.include_router(nota_router, prefix="/api/notas", tags=["Notas"])
app.include_router(notificaciones_router, prefix="/api/notificaciones", tags=["Notificaciones"])

# --- Exclusivas de un rol ---
app.include_router(coordinador_router, prefix="/api/coordinador", tags=["Coordinador"])
app.include_router(instructor_router, prefix="/api/instructor", tags=["Instructor"])

# --- Autenticación (pública + /me) ---
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Autenticación"])


# ==========================================================================
# 4. FRONTEND WEB (HTML servido por la misma API, mismo origen -> sin CORS)
# ==========================================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")
os.makedirs(os.path.join(BASE_DIR, "static", "uploads"), exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, "uploads"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=os.path.join(BASE_DIR, "uploads")), name="uploads")
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))


@app.get("/")
async def root(request: Request):
    return RedirectResponse(url="/login")


@app.get("/login")
async def pagina_login(request: Request):
    return templates.TemplateResponse(request, "login.html")


@app.get("/dashboard")
async def pagina_dashboard(request: Request):
    return templates.TemplateResponse(request, "dashboard.html")


@app.get("/api")
async def api_status():
    return {"message": "Servidor VICTORIA corriendo"}


def custom_openapi():
    """Configura Swagger para aceptar tokens JWT y mostrar el candado."""
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="API Proyecto VICTORIA",
        version="1.0.0",
        description="Sistema de gestión académica y roles (coordinador, instructor, aprendiz)",
        routes=app.routes,
    )

    openapi_schema["components"]["securitySchemes"] = {
        "Bearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Pega aquí tu token JWT.",
        }
    }

    # Le pone candado a TODAS las rutas, EXCEPTO a las de registro y login
    for path, path_item in openapi_schema.get("paths", {}).items():
        if path.startswith("/api") and "/auth" not in path:
            for method, operation in path_item.items():
                operation["security"] = [{"Bearer": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

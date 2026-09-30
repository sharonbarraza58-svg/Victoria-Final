"""
Módulo central de seguridad de VICTORIA-FINAL.

Fusiona lo mejor de las dos versiones que traía el proyecto:

1. De `victoria-admin-completo`: hashing de contraseñas con PBKDF2+salt,
   generación/lectura de JWT, y el candado de "usuario activo".

2. De la carpeta `coordinación`: el control de acceso por ROL usando
   `require_roles(...)`, en vez de comparar `id_rol != 1` a mano en cada
   endpoint (así era en `victoria-admin-completo`). Comparar por NOMBRE de
   rol es más seguro: no depende del orden en que se hayan insertado los
   roles en la base de datos, y un solo lugar decide quién entra a cada
   endpoint (principio de "no acumular código").

Con la fusión de roles (administrador -> coordinador), el antiguo
`get_current_admin` (id_rol == 1) se reemplaza en TODO el proyecto por
`require_coordinador`, que ahora protege exactamente las mismas rutas.
"""
import os
import hashlib
import hmac
import binascii
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from db.database import get_db
from models.usuario import Usuario

load_dotenv()

# ==========================================
# 0. CONFIGURACIÓN
# ==========================================
_PBKDF2_ITERATIONS = 100_000
_SALT_BYTES = 16

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")

if not SECRET_KEY:
    raise RuntimeError(
        "❌ ERROR CRÍTICO DE CONFIGURACIÓN: La variable 'SECRET_KEY' no está definida en el archivo .env."
    )
if not ACCESS_TOKEN_EXPIRE_MINUTES:
    raise RuntimeError(
        "❌ ERROR CRÍTICO DE CONFIGURACIÓN: La variable 'ACCESS_TOKEN_EXPIRE_MINUTES' no está definida en el archivo .env."
    )
ACCESS_TOKEN_EXPIRE_MINUTES = int(ACCESS_TOKEN_EXPIRE_MINUTES)


# ==========================================
# 1. FUNCIONES DE ENCRIPTACIÓN DE CONTRASEÑA
# ==========================================
def hash_password(password: str) -> str:
    """Convierte la contraseña plana en un hash irreversible (PBKDF2-SHA256)."""
    salt = os.urandom(_SALT_BYTES)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _PBKDF2_ITERATIONS)
    return f"{_PBKDF2_ITERATIONS}${binascii.hexlify(salt).decode()}${binascii.hexlify(dk).decode()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Compara la contraseña digitada con el hash guardado en la base de datos."""
    try:
        iterations, salt_hex, dk_hex = hashed_password.split("$")
        salt = binascii.unhexlify(salt_hex)
        dk_stored = binascii.unhexlify(dk_hex)
        dk_new = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, int(iterations))
        return hmac.compare_digest(dk_new, dk_stored)
    except Exception:
        return False


# ==========================================
# 2. FUNCIONES DE TOKEN JWT
# ==========================================
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Fabrica el token JWT guardando el número de documento del usuario en 'sub'."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_token_from_request(request: Request) -> str:
    """Extrae el token de la cabecera HTTP (quita la palabra 'Bearer ')."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token Bearer inválido o ausente",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return auth_header[7:]


# ==========================================
# 3. PRIMER ESCUDO: token válido -> usuario
# ==========================================
def get_current_user(request: Request, db: Session = Depends(get_db)) -> Usuario:
    """Lee el token, extrae el número de documento y busca al usuario dueño."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = get_token_from_request(request)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        numero_doc: str = payload.get("sub")
        if numero_doc is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    usuario = db.query(Usuario).filter(Usuario.numero_documento == numero_doc).first()
    if usuario is None:
        raise credentials_exception

    return usuario


# ==========================================
# 4. SEGUNDO ESCUDO: el usuario debe estar activo
# ==========================================
def get_current_active_user(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    """Además de tener un token válido, el usuario debe estar 'activo'. Si un
    coordinador desactiva a alguien, su token deja de servir en la siguiente
    petición sin tener que esperar a que expire solo."""
    if (current_user.estado or "").strip().lower() != "activo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta está inactiva. Contacta a un coordinador.",
        )
    return current_user


# ==========================================
# 5. TERCER ESCUDO: control de acceso por ROL
# ==========================================
# require_roles(...) es una fábrica de dependencias: exige que el usuario
# autenticado tenga alguno de los roles indicados, comparando por NOMBRE
# (usuario.rol.nombre_rol), no por un id numérico "mágico". Se usa así:
#
#     @router.post("/", dependencies=[Depends(require_coordinador)])
#     def crear_ficha(...): ...
#
# o guardando el usuario ya validado:
#
#     def crear_ficha(usuario_actual: Usuario = Depends(require_coordinador)): ...
def require_roles(*nombres_permitidos: str):
    permitidos = {n.strip().lower() for n in nombres_permitidos}

    def _dependencia(usuario_actual: Usuario = Depends(get_current_active_user)) -> Usuario:
        nombre_rol = (usuario_actual.rol.nombre_rol or "").strip().lower() if usuario_actual.rol else ""
        if nombre_rol not in permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "No tienes permisos para acceder a este recurso. "
                    f"Se requiere el rol: {', '.join(sorted(permitidos))}."
                ),
            )
        return usuario_actual

    return _dependencia


# Atajos ya listos para las rutas exclusivas de cada rol. Solo existen 3
# roles en VICTORIA-FINAL: coordinador (fusiona al antiguo "administrador"),
# instructor y aprendiz.
require_coordinador = require_roles("coordinador")
require_instructor = require_roles("instructor")
require_aprendiz = require_roles("aprendiz")

# Algunas vistas las comparten instructor y coordinador (por ejemplo, ver el
# portafolio de un aprendiz). Se define aquí, una sola vez, para que no se
# repita la tupla de roles en cada archivo de rutas que la necesite.
require_instructor_o_coordinador = require_roles("instructor", "coordinador")

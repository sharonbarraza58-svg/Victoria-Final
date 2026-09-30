import csv
import io
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from db.database import get_db
from models.usuario import Usuario
from models.rol import Rol
from schemas.usuario import UsuarioCreate, UsuarioUpdate, UsuarioResponse
from services import usuario_service as services
from core.security import get_current_active_user, require_coordinador, hash_password

router = APIRouter()


def _es_coordinador(usuario: Usuario) -> bool:
    return (usuario.rol.nombre_rol or "").strip().lower() == "coordinador" if usuario.rol else False


@router.get("/", response_model=List[UsuarioResponse], tags=["Usuarios"])
def listar_usuarios(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_active_user),
):
    return services.obtener_usuarios(db)


@router.post("/", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED, tags=["Usuarios"])
def guardar_usuario(
    usuario: UsuarioCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_coordinador),
):
    try:
        return services.crear_usuario(db, usuario)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Error de Integridad: el número de documento o alguno de los correos ya existe, o alguna de las llaves foráneas no es válida.",
        )


@router.put("/{id_usuario}", response_model=UsuarioResponse, tags=["Usuarios"])
def modificar_usuario(
    id_usuario: int,
    usuario_actualizado: UsuarioUpdate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_active_user),
):
    # Un usuario puede editar su propia información; solo un coordinador
    # puede editar a otros.
    es_coordinador = _es_coordinador(usuario_actual)
    if not es_coordinador and usuario_actual.id_usuario != id_usuario:
        raise HTTPException(status_code=403, detail="No tienes permisos para editar este usuario.")

    datos_actualizados = usuario_actualizado.model_dump(exclude_unset=True)
    if not es_coordinador:
        # Un usuario normal no puede reactivarse/desactivarse a sí mismo.
        datos_actualizados.pop("estado", None)

    db_usuario = services.actualizar_usuario(db, id_usuario, datos_actualizados)
    if not db_usuario:
        raise HTTPException(status_code=404, detail="No se encontró el Usuario que deseas modificar")
    return db_usuario


@router.delete("/{id_usuario}", tags=["Usuarios"])
def borrar_usuario(
    id_usuario: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_coordinador),
):
    exito = services.eliminar_usuario(db, id_usuario)
    if not exito:
        raise HTTPException(status_code=404, detail="No se encontró el Usuario que deseas eliminar")
    return {"message": f"Usuario con ID {id_usuario} eliminado correctamente"}


def generar_password_temporal(numero_documento: str) -> str:
    """Contraseña temporal para aprendices cargados por CSV: cumple la
    política de seguridad (mayúscula, minúscula, número, especial) sin
    dejar de ser fácil de comunicar. El aprendiz debe cambiarla luego."""
    return f"Sena@{numero_documento}"


@router.post("/carga-masiva", tags=["Usuarios"])
def cargar_aprendices_desde_archivo(
    id_ficha: int = Form(...),
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_coordinador),
):
    """
    Crea varios aprendices de una sola vez a partir de un archivo CSV.

    Columnas esperadas (encabezado en la primera fila):
    nombre,apellido,tipo_documento,numero_documento,fecha_nacimiento,
    correo_personal,correo_sena,telefono

    - fecha_nacimiento en formato AAAA-MM-DD.
    - La contraseña inicial de cada aprendiz es una temporal generada a
      partir de su documento (ver generar_password_temporal).
    - id_ficha se elige en el formulario, no va dentro del CSV.
    """
    if not archivo.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="El archivo debe ser un .csv")

    rol_aprendiz = db.query(Rol).filter(Rol.nombre_rol.ilike("aprendiz")).first()
    if not rol_aprendiz:
        raise HTTPException(
            status_code=500,
            detail="No existe el rol 'aprendiz'. Corre seed_roles.py primero.",
        )

    contenido = archivo.file.read().decode("utf-8-sig")
    lector = csv.DictReader(io.StringIO(contenido))

    creados, errores = [], []

    for i, fila in enumerate(lector, start=2):  # la fila 1 es el encabezado
        try:
            nuevo = Usuario(
                nombre=fila["nombre"].strip(),
                apellido=(fila.get("apellido") or "").strip() or None,
                id_rol=rol_aprendiz.id_rol,
                estado="activo",
                fecha_nacimiento=date.fromisoformat(fila["fecha_nacimiento"].strip()),
                numero_documento=fila["numero_documento"].strip(),
                tipo_documento=fila["tipo_documento"].strip(),
                telefono=(fila.get("telefono") or "").strip() or None,
                correo_personal=fila["correo_personal"].strip(),
                correo_sena=fila["correo_sena"].strip(),
                id_ficha=id_ficha,
                contrasena=hash_password(generar_password_temporal(fila["numero_documento"].strip())),
            )
            db.add(nuevo)
            db.commit()
            creados.append(nuevo.numero_documento)
        except Exception as e:
            db.rollback()
            errores.append({"fila": i, "error": str(e)})

    return {"creados": creados, "errores": errores}

from sqlalchemy.orm import Session
from models import usuario as models
from schemas import usuario as schemas
from core.security import hash_password

# La gestión de Roles vive aparte, en services/rol_service.py (clase
# RolService), que es la que usa routes/rol.py. No se duplica aquí.


def obtener_usuarios(db: Session):
    return db.query(models.Usuario).all()


def crear_usuario(db: Session, usuario: schemas.UsuarioCreate):
    datos = usuario.model_dump()
    datos["contrasena"] = hash_password(datos.pop("contrasena"))
    db_usuario = models.Usuario(**datos)
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario


def eliminar_usuario(db: Session, id_usuario: int):
    """Busca un usuario por su ID y lo elimina."""
    db_usuario = db.query(models.Usuario).filter(models.Usuario.id_usuario == id_usuario).first()
    if db_usuario:
        db.delete(db_usuario)
        db.commit()
        return True
    return False


def actualizar_usuario(db: Session, id_usuario: int, datos_actualizados: dict):
    """Actualiza solo los campos presentes en 'datos_actualizados'. La ruta
    (routes/usuario.py) ya quitó los campos sensibles (como "estado")
    cuando quien edita no es coordinador, ANTES de llegar aquí."""
    db_usuario = db.query(models.Usuario).filter(models.Usuario.id_usuario == id_usuario).first()
    if db_usuario:
        for key, value in datos_actualizados.items():
            setattr(db_usuario, key, value)
        db.commit()
        db.refresh(db_usuario)
    return db_usuario

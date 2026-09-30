from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from models.usuario import Usuario
from schemas.notificacion import NotificacionResponse
from services.notificacion_service import NotificacionService
from core.security import get_current_active_user

router = APIRouter()


@router.get("/", response_model=List[NotificacionResponse])
def listar_mis_notificaciones(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_active_user),
):
    return NotificacionService(db).obtener_de_usuario(usuario_actual.id_usuario)


@router.put("/{id_notificacion}/leer", response_model=NotificacionResponse)
def marcar_como_leida(
    id_notificacion: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_active_user),
):
    return NotificacionService(db).marcar_leida(id_notificacion, usuario_actual.id_usuario)


@router.delete("/{id_notificacion}")
def eliminar_notificacion(
    id_notificacion: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_active_user),
):
    return NotificacionService(db).eliminar(id_notificacion, usuario_actual.id_usuario)

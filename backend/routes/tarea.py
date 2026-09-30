from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from models.usuario import Usuario
from schemas.tarea import TareaParaAprendiz, TareaProximaAprendiz, TareaDetalleParaAprendiz
from services.tarea_service import TareaService
from core.security import get_current_active_user

router = APIRouter()


@router.get("/proximas", response_model=List[TareaProximaAprendiz])
def listar_proximas_tareas(
    limite: int = 5,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_active_user),
):
    """Tareas con entrega próxima del aprendiz logueado. La usa el dashboard."""
    return TareaService(db).obtener_proximas_para_aprendiz(usuario_actual, limite)


@router.get("/competencia/{id_competencia}", response_model=List[TareaParaAprendiz])
def listar_tareas_de_competencia(
    id_competencia: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_active_user),
):
    """Tareas de una competencia para el aprendiz logueado, con el estado de
    su propia entrega. La usa /victoria/competencias/[trimestre]/[materia]."""
    return TareaService(db).obtener_tareas_por_competencia_para_aprendiz(id_competencia, usuario_actual)


# IMPORTANTE: esta ruta va AL FINAL. Es un patrón genérico "/{id}" que, si
# se declara antes de "/proximas" o "/competencia/...", intercepta esas
# rutas literales (FastAPI intenta convertir "proximas" a int y falla) en
# vez de dejarlas pasar a su propio endpoint.
@router.get("/{id_tarea}", response_model=TareaDetalleParaAprendiz)
def detalle_tarea_aprendiz(
    id_tarea: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_active_user),
):
    """Detalle completo de una tarea para el aprendiz logueado: título,
    descripción, archivos de referencia del instructor, y el estado +
    archivos de su propia entrega. La usa /victoria/tarea/[id]."""
    return TareaService(db).obtener_detalle_para_aprendiz(id_tarea, usuario_actual)
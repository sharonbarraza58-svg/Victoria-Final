from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from models.usuario import Usuario
from schemas.seguimiento import ResumenTrimestre, MateriaSeguimiento, DetalleMateria
from services.seguimiento_service import SeguimientoService
from core.security import get_current_active_user

router = APIRouter()


@router.get("/resumen", response_model=List[ResumenTrimestre])
def obtener_resumen(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_active_user),
):
    """Conteo de competencias y evidencias por trimestre (T1-T4) del
    aprendiz logueado. La usa /victoria/seguimiento/[trimestre] (pestañas)."""
    return SeguimientoService(db).obtener_resumen(usuario_actual)


@router.get("/{trimestre}/materias", response_model=List[MateriaSeguimiento])
def obtener_materias(
    trimestre: str,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_active_user),
):
    """Materias (competencias) del trimestre para el aprendiz logueado."""
    return SeguimientoService(db).obtener_materias(trimestre.upper(), usuario_actual)


@router.get("/{trimestre}/materias/{id_competencia}", response_model=DetalleMateria)
def obtener_notas(
    trimestre: str,
    id_competencia: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_active_user),
):
    """Tareas, notas y promedio de una materia puntual para el aprendiz
    logueado (pantalla "Ver Notas")."""
    return SeguimientoService(db).obtener_notas_materia(trimestre.upper(), id_competencia, usuario_actual)
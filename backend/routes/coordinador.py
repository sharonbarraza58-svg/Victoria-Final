"""
Rutas del módulo de coordinador. Todas exigen (vía require_coordinador,
core/security.py) que el usuario autenticado tenga el rol "coordinador" --
son las mismas rutas que appm/src/lib/coordinador.ts espera encontrar bajo
/api/coordinador/*.

Esto es la vista de SOLO LECTURA/consolidada (dashboard, panorama de
sedes e instructores, portafolio de un instructor). La gestión de datos
maestros (crear/editar/borrar fichas, programas, usuarios, sedes...) vive
en los routers de cada dominio (routes/ficha.py, routes/sede.py,
routes/usuario.py, etc.), también protegidos con require_coordinador --
así no se duplica lógica de escritura en dos lugares distintos.
"""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from core.security import require_coordinador
from db.database import get_db
from models.usuario import Usuario
from schemas.coordinador import (
    CompetenciaDetalleResponse,
    DashboardCoordinadorResponse,
    InstructorDetalleResponse,
    InstructorResumenResponse,
    PortafolioInstructorResponse,
)
from schemas.sede import SedeResponse
from services.coordinador_service import CoordinadorService

router = APIRouter()


@router.get("/dashboard", response_model=DashboardCoordinadorResponse)
def dashboard(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_coordinador),
):
    return CoordinadorService(db).obtener_dashboard()


@router.get("/sedes", response_model=list[SedeResponse])
def listar_sedes(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_coordinador),
):
    return CoordinadorService(db).obtener_sedes()


@router.get("/sedes/{id_sede}", response_model=SedeResponse)
def sede_detalle(
    id_sede: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_coordinador),
):
    return CoordinadorService(db).obtener_sede_por_id(id_sede)


@router.get("/sedes/{id_sede}/instructores", response_model=list[InstructorResumenResponse])
def instructores_de_sede(
    id_sede: int,
    tipo: Optional[str] = Query(None, description="Filtra por 'planta' | 'tecnico' | 'transversal' | 'contratista'"),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_coordinador),
):
    return CoordinadorService(db).obtener_instructores_sede(id_sede, tipo)


@router.get("/instructores/{id_instructor}", response_model=InstructorDetalleResponse)
def instructor_detalle(
    id_instructor: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_coordinador),
):
    return CoordinadorService(db).obtener_instructor_detalle(id_instructor)


@router.get("/instructores/{id_instructor}/portafolio", response_model=PortafolioInstructorResponse)
def portafolio_instructor(
    id_instructor: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_coordinador),
):
    return CoordinadorService(db).obtener_portafolio_instructor(id_instructor)


@router.get(
    "/instructores/{id_instructor}/portafolio/{trimestre}/competencias/{id_competencia}",
    response_model=CompetenciaDetalleResponse,
)
def competencia_detalle(
    id_instructor: int,
    trimestre: int,
    id_competencia: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_coordinador),
):
    return CoordinadorService(db).obtener_competencia_detalle(id_instructor, trimestre, id_competencia)

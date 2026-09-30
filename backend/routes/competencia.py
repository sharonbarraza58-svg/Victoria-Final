from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from db.database import get_db
from models.usuario import Usuario
from schemas.competencia import CompetenciaCreate, CompetenciaResponse
from services.competencia_service import CompetenciaService
from core.security import get_current_active_user, require_coordinador, require_roles

router = APIRouter()

require_gestion_competencia = require_roles("coordinador", "instructor")

@router.get("/mis-competencias", response_model=List[CompetenciaResponse])
def listar_mis_competencias(db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_active_user)):
    """
    Competencias del programa de formación del aprendiz logueado (ver
    CompetenciaService.obtener_competencias_por_aprendiz). La usa la
    pantalla /victoria/competencias del rol aprendiz.
    """
    return CompetenciaService(db).obtener_competencias_por_aprendiz(usuario_actual)

@router.post("/", response_model=CompetenciaResponse, status_code=201, dependencies=[Depends(require_gestion_competencia)])
def crear_competencia(data: CompetenciaCreate, db: Session = Depends(get_db)):
    return CompetenciaService(db).crear_competencia(data)


@router.get("/", response_model=List[CompetenciaResponse])
def listar_competencias(db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_active_user)):
    return CompetenciaService(db).obtener_competencias()


@router.put("/{id_competencia}", response_model=CompetenciaResponse, dependencies=[Depends(require_gestion_competencia)])
def actualizar_competencia(id_competencia: int, data: CompetenciaCreate, db: Session = Depends(get_db)):
    return CompetenciaService(db).actualizar_competencia(id_competencia, data)


@router.delete("/{id_competencia}", dependencies=[Depends(require_coordinador)])
def eliminar_competencia(id_competencia: int, db: Session = Depends(get_db)):
    service = CompetenciaService(db)
    try:
        return service.eliminar_competencia(id_competencia)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="No se puede eliminar: todavía hay un programa que apunta a esta competencia.")

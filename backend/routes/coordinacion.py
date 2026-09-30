from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from models.usuario import Usuario
from schemas.coordinacion import CoordinacionCreate, CoordinacionResponse
from services.coordinacion_service import CoordinacionService
from core.security import get_current_active_user, require_coordinador

router = APIRouter()


@router.post("/", response_model=CoordinacionResponse, status_code=201, dependencies=[Depends(require_coordinador)])
def crear_coordinacion(data: CoordinacionCreate, db: Session = Depends(get_db)):
    return CoordinacionService(db).crear_coordinacion(data)


@router.get("/", response_model=List[CoordinacionResponse])
def listar_coordinaciones(db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_active_user)):
    # Cualquier usuario logueado puede verlas (se usan en formularios de alta).
    return CoordinacionService(db).obtener_coordinaciones()


@router.get("/{id_coordinacion}", response_model=CoordinacionResponse)
def obtener_coordinacion(
    id_coordinacion: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_active_user),
):
    return CoordinacionService(db).obtener_coordinacion_por_id(id_coordinacion)


@router.put("/{id_coordinacion}", response_model=CoordinacionResponse, dependencies=[Depends(require_coordinador)])
def actualizar_coordinacion(id_coordinacion: int, data: CoordinacionCreate, db: Session = Depends(get_db)):
    return CoordinacionService(db).actualizar_coordinacion(id_coordinacion, data)


@router.delete("/{id_coordinacion}", dependencies=[Depends(require_coordinador)])
def eliminar_coordinacion(id_coordinacion: int, db: Session = Depends(get_db)):
    return CoordinacionService(db).eliminar_coordinacion(id_coordinacion)

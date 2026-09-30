from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from db.database import get_db
from models.usuario import Usuario
from schemas.ficha import FichaCreate, FichaResponse
from services.ficha_service import FichaService
from core.security import get_current_active_user, require_coordinador, require_roles

router = APIRouter()

# Crear/editar: coordinador o instructor (mismo criterio que ya traía el
# proyecto: administrador + instructor, ahora fusionado en coordinador).
require_gestion_ficha = require_roles("coordinador", "instructor")


@router.post("/", response_model=FichaResponse, status_code=201, dependencies=[Depends(require_gestion_ficha)])
def crear_ficha(data: FichaCreate, db: Session = Depends(get_db)):
    service = FichaService(db)
    try:
        return service.crear_ficha(data)
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Ya existe una ficha con ese número, o el programa/director indicado no existe.",
        )


@router.get("/", response_model=List[FichaResponse])
def listar_fichas(db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_active_user)):
    return FichaService(db).obtener_fichas()


@router.get("/{id_ficha}", response_model=FichaResponse)
def obtener_ficha(id_ficha: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_active_user)):
    return FichaService(db).obtener_ficha_por_id(id_ficha)


@router.put("/{id_ficha}", response_model=FichaResponse, dependencies=[Depends(require_gestion_ficha)])
def actualizar_ficha(id_ficha: int, data: FichaCreate, db: Session = Depends(get_db)):
    return FichaService(db).actualizar_ficha(id_ficha, data)


@router.delete("/{id_ficha}", dependencies=[Depends(require_coordinador)])
def eliminar_ficha(id_ficha: int, db: Session = Depends(get_db)):
    service = FichaService(db)
    try:
        return service.eliminar_ficha(id_ficha)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="No se puede eliminar: todavía hay un programa que apunta a esta ficha.")

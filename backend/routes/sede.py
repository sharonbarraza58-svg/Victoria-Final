"""CRUD de Sede. Lectura abierta a cualquier usuario autenticado (se usa en
formularios de alta de instructor); escritura exclusiva del coordinador."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from models.usuario import Usuario
from schemas.sede import SedeCreate, SedeResponse
from services.sede_service import SedeService
from core.security import get_current_active_user, require_coordinador

router = APIRouter()


@router.post("/", response_model=SedeResponse, status_code=201, dependencies=[Depends(require_coordinador)])
def crear_sede(data: SedeCreate, db: Session = Depends(get_db)):
    return SedeService(db).crear_sede(data)


@router.get("/", response_model=List[SedeResponse])
def listar_sedes(db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_active_user)):
    return SedeService(db).obtener_sedes()


@router.get("/{id_sede}", response_model=SedeResponse)
def obtener_sede(id_sede: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_active_user)):
    return SedeService(db).obtener_sede_por_id(id_sede)


@router.put("/{id_sede}", response_model=SedeResponse, dependencies=[Depends(require_coordinador)])
def actualizar_sede(id_sede: int, data: SedeCreate, db: Session = Depends(get_db)):
    return SedeService(db).actualizar_sede(id_sede, data)


@router.delete("/{id_sede}", dependencies=[Depends(require_coordinador)])
def eliminar_sede(id_sede: int, db: Session = Depends(get_db)):
    return SedeService(db).eliminar_sede(id_sede)

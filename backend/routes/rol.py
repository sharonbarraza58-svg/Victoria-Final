from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from models.usuario import Usuario
from schemas.rol import RolCreate, RolResponse
from services.rol_service import RolService
from core.security import get_current_active_user, require_coordinador

router = APIRouter()


@router.post("/", response_model=RolResponse, status_code=201, dependencies=[Depends(require_coordinador)])
def crear_rol(data: RolCreate, db: Session = Depends(get_db)):
    return RolService(db).crear_rol(data)


@router.get("/", response_model=List[RolResponse])
def listar_roles(db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_active_user)):
    return RolService(db).obtener_roles()


@router.put("/{id_rol}", response_model=RolResponse, dependencies=[Depends(require_coordinador)])
def actualizar_rol(id_rol: int, data: RolCreate, db: Session = Depends(get_db)):
    return RolService(db).actualizar_rol(id_rol, data)


@router.delete("/{id_rol}", dependencies=[Depends(require_coordinador)])
def eliminar_rol(id_rol: int, db: Session = Depends(get_db)):
    return RolService(db).eliminar_rol(id_rol)

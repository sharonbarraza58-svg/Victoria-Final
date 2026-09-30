from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from models.usuario import Usuario
from schemas.proyecto import ProyectoCreate, ProyectoResponse
from services.proyecto_service import ProyectoService
from core.security import get_current_active_user, require_coordinador

router = APIRouter()


@router.post("/", response_model=ProyectoResponse, status_code=201, dependencies=[Depends(require_coordinador)])
def crear_proyecto(data: ProyectoCreate, db: Session = Depends(get_db)):
    return ProyectoService(db).crear_proyecto(data)


@router.get("/", response_model=List[ProyectoResponse])
def listar_proyectos(db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_active_user)):
    return ProyectoService(db).obtener_proyectos()


@router.get("/{id_proyecto}", response_model=ProyectoResponse)
def obtener_proyecto(
    id_proyecto: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_active_user)
):
    return ProyectoService(db).obtener_proyecto_por_id(id_proyecto)


@router.put("/{id_proyecto}", response_model=ProyectoResponse, dependencies=[Depends(require_coordinador)])
def actualizar_proyecto(id_proyecto: int, data: ProyectoCreate, db: Session = Depends(get_db)):
    return ProyectoService(db).actualizar_proyecto(id_proyecto, data)


@router.delete("/{id_proyecto}", dependencies=[Depends(require_coordinador)])
def eliminar_proyecto(id_proyecto: int, db: Session = Depends(get_db)):
    return ProyectoService(db).eliminar_proyecto(id_proyecto)

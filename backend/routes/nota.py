"""Notas personales: cada usuario (cualquier rol) ve, crea y borra
únicamente sus propias notas -- no hay vista de coordinador aquí porque
son privadas por diseño."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from models.usuario import Usuario
from schemas.nota import NotaCreate, NotaResponse
from services.nota_service import NotaService
from core.security import get_current_active_user

router = APIRouter()


@router.post("/", response_model=NotaResponse, status_code=status.HTTP_201_CREATED)
def crear_nota(
    data: NotaCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_active_user),
):
    return NotaService(db).crear_nota(data, usuario_actual.id_usuario)


@router.get("/", response_model=List[NotaResponse])
def listar_mis_notas(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_active_user),
):
    return NotaService(db).obtener_notas_de_usuario(usuario_actual.id_usuario)


@router.delete("/{id_nota}")
def eliminar_nota(
    id_nota: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_active_user),
):
    return NotaService(db).eliminar_nota(id_nota, usuario_actual.id_usuario)

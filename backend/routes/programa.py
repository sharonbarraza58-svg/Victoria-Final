from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from db.database import get_db
from models.usuario import Usuario
from schemas.programa import ProgramaCreate, ProgramaResponse
from services.programa_service import ProgramaService
from core.security import get_current_active_user, require_coordinador

router = APIRouter()


@router.post("/", response_model=ProgramaResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_coordinador)])
def crear_programa(data: ProgramaCreate, db: Session = Depends(get_db)):
    service = ProgramaService(db)
    try:
        return service.crear_programa(data)
    except IntegrityError:
        # _validar_coordinacion ya cubre id_coordinacion con un 404 claro.
        # id_ficha, id_proyecto e id_competencia son opcionales y no se
        # validan a mano, así que si mandas un id que no existe para
        # cualquiera de esos tres, esto es lo que lo atrapa.
        db.rollback()
        raise HTTPException(status_code=400, detail="El id_ficha, id_proyecto o id_competencia indicado no existe.")


@router.get("/", response_model=List[ProgramaResponse])
def listar_programas(db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_active_user)):
    return ProgramaService(db).obtener_programas()


@router.get("/{id_programa}", response_model=ProgramaResponse)
def obtener_programa(id_programa: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_active_user)):
    return ProgramaService(db).obtener_programa_por_id(id_programa)


@router.put("/{id_programa}", response_model=ProgramaResponse, dependencies=[Depends(require_coordinador)])
def actualizar_programa(id_programa: int, data: ProgramaCreate, db: Session = Depends(get_db)):
    service = ProgramaService(db)
    try:
        return service.actualizar_programa(id_programa, data)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="El id_ficha, id_proyecto o id_competencia indicado no existe.")


@router.delete("/{id_programa}", status_code=status.HTTP_200_OK, dependencies=[Depends(require_coordinador)])
def eliminar_programa(id_programa: int, db: Session = Depends(get_db)):
    service = ProgramaService(db)
    try:
        return service.eliminar_programa(id_programa)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="No se puede eliminar: todavía hay otros registros que apuntan a este programa.")

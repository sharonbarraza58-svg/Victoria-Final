from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from models.usuario import Usuario
from schemas.materiales import MaterialCreate, MaterialResponse
from services.material_service import MaterialService
from core.security import get_current_active_user, require_coordinador, require_roles

router = APIRouter()

# Coordinador o instructor pueden agregar/editar material educativo.
require_gestion_material = require_roles("coordinador", "instructor")


@router.get("/", response_model=List[MaterialResponse], tags=["Materiales"])
def listar_materiales(db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_active_user)):
    return MaterialService(db).obtener_materiales()


@router.get("/{id_material}", response_model=MaterialResponse, tags=["Materiales"])
def obtener_material(id_material: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_current_active_user)):
    return MaterialService(db).obtener_material_por_id(id_material)


@router.post("/", response_model=MaterialResponse, status_code=201, tags=["Materiales"], dependencies=[Depends(require_gestion_material)])
def guardar_material(material: MaterialCreate, db: Session = Depends(get_db)):
    return MaterialService(db).crear_material(material)


@router.put("/{id_material}", response_model=MaterialResponse, tags=["Materiales"], dependencies=[Depends(require_gestion_material)])
def modificar_material(id_material: int, material_actualizado: MaterialCreate, db: Session = Depends(get_db)):
    return MaterialService(db).actualizar_material(id_material, material_actualizado)


@router.delete("/{id_material}", tags=["Materiales"], dependencies=[Depends(require_coordinador)])
def eliminar_material_ruta(id_material: int, db: Session = Depends(get_db)):
    return MaterialService(db).eliminar_material(id_material)

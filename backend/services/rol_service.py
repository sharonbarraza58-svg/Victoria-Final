from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.rol import Rol
from schemas.rol import RolCreate


class RolService:
    def __init__(self, db: Session):
        self.db = db

    def crear_rol(self, data_in: RolCreate):
        nuevo_rol = Rol(**data_in.model_dump())
        self.db.add(nuevo_rol)
        self.db.commit()
        self.db.refresh(nuevo_rol)
        return nuevo_rol

    def obtener_roles(self):
        return self.db.query(Rol).all()

    def obtener_rol_por_id(self, id_rol: int):
        rol = self.db.query(Rol).filter(Rol.id_rol == id_rol).first()
        if not rol:
            raise HTTPException(status_code=404, detail="Rol no encontrado.")
        return rol

    def actualizar_rol(self, id_rol: int, data_in: RolCreate):
        rol = self.obtener_rol_por_id(id_rol)
        rol.nombre_rol = data_in.nombre_rol
        self.db.commit()
        self.db.refresh(rol)
        return rol

    def eliminar_rol(self, id_rol: int):
        rol = self.obtener_rol_por_id(id_rol)
        self.db.delete(rol)
        self.db.commit()
        return {"mensaje": "Rol eliminado correctamente."}

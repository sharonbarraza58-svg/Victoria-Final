from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.coordinacion import Coordinacion
from schemas.coordinacion import CoordinacionCreate


class CoordinacionService:
    def __init__(self, db: Session):
        self.db = db

    def crear_coordinacion(self, data_in: CoordinacionCreate):
        existe = self.db.query(Coordinacion).filter(
            Coordinacion.nombre_coordinacion == data_in.nombre_coordinacion
        ).first()
        if existe:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe una coordinación con este nombre.")

        nueva_coordinacion = Coordinacion(**data_in.model_dump())
        self.db.add(nueva_coordinacion)
        self.db.commit()
        self.db.refresh(nueva_coordinacion)
        return nueva_coordinacion

    def obtener_coordinaciones(self):
        return self.db.query(Coordinacion).all()

    def obtener_coordinacion_por_id(self, id_coordinacion: int):
        coordinacion = self.db.query(Coordinacion).filter(Coordinacion.id_coordinacion == id_coordinacion).first()
        if not coordinacion:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coordinación no encontrada.")
        return coordinacion

    def actualizar_coordinacion(self, id_coordinacion: int, data_in: CoordinacionCreate):
        coordinacion_actual = self.obtener_coordinacion_por_id(id_coordinacion)
        coordinacion_actual.nombre_coordinacion = data_in.nombre_coordinacion
        coordinacion_actual.descripcion_coordinacion = data_in.descripcion_coordinacion
        coordinacion_actual.area_enfoque = data_in.area_enfoque
        self.db.commit()
        self.db.refresh(coordinacion_actual)
        return coordinacion_actual

    def eliminar_coordinacion(self, id_coordinacion: int):
        coordinacion = self.obtener_coordinacion_por_id(id_coordinacion)
        self.db.delete(coordinacion)
        self.db.commit()
        return {"mensaje": "Coordinación eliminada exitosamente."}

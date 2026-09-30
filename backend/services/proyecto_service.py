from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.proyecto import Proyecto
from schemas.proyecto import ProyectoCreate


class ProyectoService:
    def __init__(self, db: Session):
        self.db = db

    def crear_proyecto(self, data_in: ProyectoCreate):
        nuevo_proyecto = Proyecto(**data_in.model_dump())
        self.db.add(nuevo_proyecto)
        self.db.commit()
        self.db.refresh(nuevo_proyecto)
        return nuevo_proyecto

    def obtener_proyectos(self):
        return self.db.query(Proyecto).all()

    def obtener_proyecto_por_id(self, id_proyecto: int):
        proyecto = self.db.query(Proyecto).filter(Proyecto.id_proyecto == id_proyecto).first()
        if not proyecto:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado.")
        return proyecto

    def actualizar_proyecto(self, id_proyecto: int, data_in: ProyectoCreate):
        proyecto_actual = self.obtener_proyecto_por_id(id_proyecto)
        proyecto_actual.nombre_proyecto = data_in.nombre_proyecto
        proyecto_actual.descripcion = data_in.descripcion
        proyecto_actual.fecha_inicio = data_in.fecha_inicio
        proyecto_actual.fecha_fin = data_in.fecha_fin
        proyecto_actual.url_proyecto = data_in.url_proyecto
        self.db.commit()
        self.db.refresh(proyecto_actual)
        return proyecto_actual

    def eliminar_proyecto(self, id_proyecto: int):
        proyecto = self.obtener_proyecto_por_id(id_proyecto)
        self.db.delete(proyecto)
        self.db.commit()
        return {"mensaje": "Proyecto eliminado exitosamente."}

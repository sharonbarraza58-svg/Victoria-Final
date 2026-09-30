from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.programa import Programa
from models.coordinacion import Coordinacion
from schemas.programa import ProgramaCreate


class ProgramaService:
    def __init__(self, db: Session):
        self.db = db

    def _validar_coordinacion(self, id_coordinacion: int):
        existe = self.db.query(Coordinacion).filter(Coordinacion.id_coordinacion == id_coordinacion).first()
        if not existe:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"La coordinación con id {id_coordinacion} no existe.",
            )

    def crear_programa(self, programa_in: ProgramaCreate):
        existe = self.db.query(Programa).filter(Programa.nombre == programa_in.nombre).first()
        if existe:
            raise HTTPException(status_code=400, detail="Ya existe un programa con ese nombre.")

        self._validar_coordinacion(programa_in.id_coordinacion)

        nuevo_programa = Programa(**programa_in.model_dump())
        self.db.add(nuevo_programa)
        self.db.commit()
        self.db.refresh(nuevo_programa)
        return nuevo_programa

    def obtener_programas(self):
        return self.db.query(Programa).all()

    def obtener_programa_por_id(self, id_programa: int):
        programa = self.db.query(Programa).filter(Programa.id_programa == id_programa).first()
        if not programa:
            raise HTTPException(status_code=404, detail="Programa no encontrado.")
        return programa

    def actualizar_programa(self, id_programa: int, programa_in: ProgramaCreate):
        programa_actual = self.obtener_programa_por_id(id_programa)
        self._validar_coordinacion(programa_in.id_coordinacion)

        programa_actual.nombre = programa_in.nombre
        programa_actual.nivel_formacion = programa_in.nivel_formacion
        programa_actual.descripcion = programa_in.descripcion
        programa_actual.url_programa = programa_in.url_programa
        programa_actual.id_coordinacion = programa_in.id_coordinacion
        programa_actual.id_ficha = programa_in.id_ficha
        programa_actual.id_proyecto = programa_in.id_proyecto
        programa_actual.id_competencia = programa_in.id_competencia

        self.db.commit()
        self.db.refresh(programa_actual)
        return programa_actual

    def eliminar_programa(self, id_programa: int):
        programa = self.obtener_programa_por_id(id_programa)
        self.db.delete(programa)
        self.db.commit()
        return {"mensaje": "Programa eliminado exitosamente."}

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.competencia import Competencia
from models.usuario import Usuario
from schemas.competencia import CompetenciaCreate


class CompetenciaService:
    def __init__(self, db: Session):
        self.db = db

    def crear_competencia(self, data_in: CompetenciaCreate):
        nueva_competencia = Competencia(**data_in.model_dump())
        self.db.add(nueva_competencia)
        self.db.commit()
        self.db.refresh(nueva_competencia)
        return self._con_nombre_instructor(nueva_competencia)

    def obtener_competencias(self):
        competencias = self.db.query(Competencia).all()
        return [self._con_nombre_instructor(c) for c in competencias]

    def obtener_competencias_por_aprendiz(self, aprendiz: Usuario):
        """
        Competencias del programa de formación del aprendiz logueado, vía
        aprendiz -> ficha -> programa -> competencias. Si el aprendiz no
        tiene ficha o la ficha no tiene programa asignado, devuelve una
        lista vacía (mismo comportamiento que "Sin ficha asignada" en el
        dashboard).
        """
        if not aprendiz.ficha or not aprendiz.ficha.id_programa:
            return []

        competencias = (
            self.db.query(Competencia)
            .filter(Competencia.id_programa == aprendiz.ficha.id_programa)
            .all()
        )
        return [self._con_nombre_instructor(c) for c in competencias]

    def obtener_competencia_por_id(self, id_competencia: int):
        competencia = self.db.query(Competencia).filter(Competencia.id_competencia == id_competencia).first()
        if not competencia:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competencia no encontrada.")
        return competencia

    def actualizar_competencia(self, id_competencia: int, data_in: CompetenciaCreate):
        competencia_actual = self.obtener_competencia_por_id(id_competencia)
        competencia_actual.nombre = data_in.nombre
        competencia_actual.descripcion = data_in.descripcion
        competencia_actual.trimestre = data_in.trimestre
        competencia_actual.fecha_carga = data_in.fecha_carga
        competencia_actual.id_programa = data_in.id_programa
        competencia_actual.id_instructor = data_in.id_instructor
        self.db.commit()
        self.db.refresh(competencia_actual)
        return self._con_nombre_instructor(competencia_actual)

    def eliminar_competencia(self, id_competencia: int):
        competencia = self.obtener_competencia_por_id(id_competencia)
        self.db.delete(competencia)
        self.db.commit()
        return {"mensaje": "Competencia eliminada correctamente."}

    @staticmethod
    def _con_nombre_instructor(competencia: Competencia):
        if competencia.instructor:
            nombre = competencia.instructor.nombre
            apellido = competencia.instructor.apellido or ""
            competencia.nombre_instructor = f"{nombre} {apellido}".strip()
        else:
            competencia.nombre_instructor = None
        return competencia
"""
Tabla AsignacionInstructor: qué instructor (id_instructor) dicta qué
materia (id_competencia) a qué ficha (id_ficha) en qué trimestre. Con esto
se arma el árbol "Competencias > Trimestre > Materia > Ficha" del
dashboard de instructor con una sola consulta por instructor autenticado,
y el coordinador puede ver la carga académica de cada instructor.

Quién puede crear filas aquí: solo un coordinador (ver routes/instructor.py)
-- asignar instructores a fichas es una decisión administrativa, no algo
que el propio instructor se autoasigne.
"""
from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from db.database import Base


class AsignacionInstructor(Base):
    __tablename__ = "asignacion_instructor"

    id_asignacion = Column(Integer, primary_key=True, autoincrement=True)

    id_instructor = Column(Integer, ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False)
    id_ficha = Column(Integer, ForeignKey("ficha.id_ficha", ondelete="CASCADE"), nullable=False)
    id_competencia = Column(Integer, ForeignKey("competencia.id_competencia", ondelete="CASCADE"), nullable=False)

    # 1 a 4 -- los 4 trimestres de una formación SENA. Se valida en el schema.
    trimestre = Column(Integer, nullable=False)

    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    instructor = relationship("Usuario", foreign_keys=[id_instructor])
    ficha = relationship("Ficha", foreign_keys=[id_ficha])
    competencia = relationship("Competencia", foreign_keys=[id_competencia])

    __table_args__ = (
        UniqueConstraint(
            "id_instructor", "id_ficha", "id_competencia", "trimestre",
            name="uq_asignacion_instructor_ficha_competencia_trimestre",
        ),
    )

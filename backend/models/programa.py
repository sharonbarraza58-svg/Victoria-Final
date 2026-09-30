from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from db.database import Base


class Programa(Base):
    __tablename__ = 'programa'

    id_programa = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(120), nullable=False)
    nivel_formacion = Column(String(20), nullable=True)
    descripcion = Column(String(300), nullable=True)
    url_programa = Column(String(200), nullable=False)

    # Llave foránea obligatoria: todo programa pertenece a una coordinación
    id_coordinacion = Column(Integer, ForeignKey('coordinacion.id_coordinacion'), nullable=False)

    # Llaves foráneas opcionales, tal como las define el script
    id_ficha = Column(Integer, ForeignKey('ficha.id_ficha'), nullable=True)
    id_proyecto = Column(Integer, ForeignKey('proyecto.id_proyecto'), nullable=True)
    id_competencia = Column(Integer, ForeignKey('competencia.id_competencia'), nullable=True)

    # Relaciones
    coordinacion = relationship("Coordinacion", foreign_keys=[id_coordinacion])
    proyecto = relationship("Proyecto", back_populates="programas", foreign_keys=[id_proyecto])
    competencia = relationship("Competencia", foreign_keys=[id_competencia])

    # Relación inversa con las fichas que apuntan a este programa
    # (Ficha.id_programa es la llave foránea "principal" ficha -> programa,
    # separada del id_ficha que Programa también guarda como referencia suelta)
    fichas = relationship("Ficha", back_populates="programa", foreign_keys="Ficha.id_programa")

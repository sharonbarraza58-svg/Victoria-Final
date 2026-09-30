"""
Tabla Tarea: reemplaza y unifica lo que antes eran dos conceptos separados
y superpuestos en las carpetas viejas (Evidencia "asignada" del admin, y
Entregable del fork de instructor). El instructor ve una lista de
tareas/evidencias para una ficha+materia puntual y puede crear una nueva
(título, descripción, fecha límite, adjunto de referencia).
"""
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from db.database import Base


class Tarea(Base):
    __tablename__ = "tarea"

    id_tarea = Column(Integer, primary_key=True, autoincrement=True)
    titulo = Column(String(150), nullable=False)
    descripcion = Column(Text, nullable=True)
    fecha_limite = Column(Date, nullable=True)

    # Adjunto de REFERENCIA que sube el instructor al crear la tarea (ej. la
    # guía/plantilla del ejercicio).
    archivo_url = Column(String(300), nullable=True)

    id_ficha = Column(Integer, ForeignKey("ficha.id_ficha", ondelete="CASCADE"), nullable=False)
    id_competencia = Column(Integer, ForeignKey("competencia.id_competencia", ondelete="CASCADE"), nullable=False)

    # Dueño de la tarea: el instructor que la creó. Un instructor no puede
    # ver/editar/borrar tareas creadas por OTRO instructor, aunque ambos
    # compartan la misma ficha.
    id_instructor = Column(Integer, ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False)

    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    ficha = relationship("Ficha", foreign_keys=[id_ficha])
    competencia = relationship("Competencia", foreign_keys=[id_competencia])
    instructor = relationship("Usuario", foreign_keys=[id_instructor])
    entregas = relationship("Entrega", back_populates="tarea", cascade="all, delete-orphan")
    archivos = relationship("ArchivoTarea", back_populates="tarea", cascade="all, delete-orphan")
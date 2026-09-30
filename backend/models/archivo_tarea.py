from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from db.database import Base


class ArchivoTarea(Base):
    """Adjuntos de REFERENCIA de una tarea (guía, plantilla) subidos por el
    instructor al crearla. Reemplaza en la práctica al campo único
    Tarea.archivo_url (que se conserva por compatibilidad): ahora una
    tarea puede tener varios archivos."""
    __tablename__ = "archivo_tarea"

    id_archivo = Column(Integer, primary_key=True, autoincrement=True)
    nombre_archivo = Column(String(200), nullable=False)
    url = Column(String(300), nullable=False)
    id_tarea = Column(Integer, ForeignKey("tarea.id_tarea", ondelete="CASCADE"), nullable=False)
    fecha_subida = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    tarea = relationship("Tarea", back_populates="archivos")
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from db.database import Base


class ArchivoEntrega(Base):
    """Adjuntos que sube el APRENDIZ como parte de su entrega. Reemplaza
    en la práctica al campo único Entrega.archivo_url (se conserva por
    compatibilidad): una entrega ahora puede tener varios archivos."""
    __tablename__ = "archivo_entrega"

    id_archivo = Column(Integer, primary_key=True, autoincrement=True)
    nombre_archivo = Column(String(200), nullable=False)
    url = Column(String(300), nullable=False)
    id_entrega = Column(Integer, ForeignKey("entrega.id_entrega", ondelete="CASCADE"), nullable=False)
    fecha_subida = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    entrega = relationship("Entrega", back_populates="archivos")
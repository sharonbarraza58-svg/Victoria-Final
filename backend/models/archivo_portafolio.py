from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from db.database import Base
from models.carpeta_portafolio import CarpetaAprendiz  # noqa: F401  (registra la tabla referenciada)


class ArchivoPortafolio(Base):
    """Archivo de libre subida del aprendiz en su Portafolio, clasificado
    en una de las 5 carpetas fijas (ver CARPETAS_PORTAFOLIO en
    services/portafolio_service.py) y, dentro de cada una, en una de las
    4 subcarpetas de trimestre (ver SUBCARPETAS_PORTAFOLIO). Si id_carpeta
    tiene valor, el archivo está dentro de una carpeta creada por el
    aprendiz (CarpetaAprendiz); si es NULL, está suelto en el trimestre.
    No está ligado a una Tarea puntual -- a diferencia de ArchivoEntrega."""
    __tablename__ = "archivo_portafolio"

    id_archivo = Column(Integer, primary_key=True, autoincrement=True)
    categoria = Column(String(50), nullable=False)
    subcarpeta = Column(String(20), nullable=True)
    id_carpeta = Column(Integer, ForeignKey("carpeta_portafolio.id_carpeta", ondelete="CASCADE"), nullable=True)
    nombre_archivo = Column(String(200), nullable=False)
    url = Column(String(300), nullable=False)
    id_aprendiz = Column(Integer, ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False)
    fecha_subida = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    aprendiz = relationship("Usuario", foreign_keys=[id_aprendiz])
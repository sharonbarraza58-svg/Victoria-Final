from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from db.database import Base


class CarpetaAprendiz(Base):
    """Carpeta que el aprendiz crea dentro de una subcarpeta de trimestre
    de su Portafolio (botón "Carpeta Nueva"). Los archivos subidos dentro
    de ella apuntan a esta fila con ArchivoPortafolio.id_carpeta."""
    __tablename__ = "carpeta_portafolio"
    __table_args__ = (
        UniqueConstraint(
            "id_aprendiz", "categoria", "subcarpeta", "nombre",
            name="uq_carpeta_portafolio_nombre",
        ),
    )

    id_carpeta = Column(Integer, primary_key=True, autoincrement=True)
    categoria = Column(String(50), nullable=False)
    subcarpeta = Column(String(20), nullable=False)
    nombre = Column(String(100), nullable=False)
    id_aprendiz = Column(Integer, ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    aprendiz = relationship("Usuario", foreign_keys=[id_aprendiz])
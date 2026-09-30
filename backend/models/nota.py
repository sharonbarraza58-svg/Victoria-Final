from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from db.database import Base


class Nota(Base):
    __tablename__ = "nota"

    id_nota = Column(Integer, primary_key=True, index=True, autoincrement=True)
    titulo = Column(String(120), nullable=False)
    materia = Column(String(80), nullable=True)
    contenido = Column(Text, nullable=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Cada nota es personal: pertenece a un único usuario.
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)

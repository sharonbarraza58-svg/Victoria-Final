"""
Tabla Notificacion: aviso dirigido a un usuario puntual (nueva tarea
asignada, entrega calificada, cuenta creada, etc). Es la única pieza de
este dominio que aportaba la carpeta de instructor y que no existía en
ninguna otra parte del proyecto -- se conserva porque no compite con
Tarea/Entrega, los complementa.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base


class Notificacion(Base):
    __tablename__ = "notificacion"

    id_notificacion = Column(Integer, primary_key=True, autoincrement=True)
    titulo_notificacion = Column(String(160), nullable=False)
    tipo = Column(String(60), nullable=False, default="manual")
    mensaje = Column(Text, nullable=True)
    origen = Column(String(60), nullable=False, default="sistema")
    estado = Column(String(30), nullable=False, default="no_leida")
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False, index=True)

    usuario = relationship("Usuario")

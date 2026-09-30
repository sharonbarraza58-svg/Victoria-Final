"""
Tabla Sede: sede física del SENA donde trabajan los instructores. El
coordinador organiza y consulta instructores agrupados por sede (vista
"Sedes - SENA": tarjeta con nombre + descripción, y al expandirla
dirección/teléfono/horario de atención).
"""
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from db.database import Base


class Sede(Base):
    __tablename__ = "sede"

    id_sede = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(120), nullable=False)
    descripcion = Column(String(300), nullable=True)

    # Solo se muestran al expandir la tarjeta de la sede.
    direccion_principal = Column(String(200), nullable=True)
    telefono_atencion = Column(String(20), nullable=True)
    horario_atencion = Column(String(100), nullable=True)

    usuarios = relationship("Usuario", back_populates="sede")

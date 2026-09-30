from sqlalchemy import Column, Integer, String
from db.database import Base

class Coordinacion(Base):
    __tablename__ = 'coordinacion'

    id_coordinacion = Column(Integer, primary_key=True, autoincrement=True)
    nombre_coordinacion = Column(String(120), nullable=False)
    descripcion_coordinacion = Column(String(300), nullable=False)
    area_enfoque = Column(String(20), nullable=False)
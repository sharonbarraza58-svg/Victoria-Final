from sqlalchemy import Column, Integer, String
from db.database import Base

class Material(Base):
    __tablename__ = "material"

    id_material = Column(Integer, primary_key=True, index=True)
    nombre_material = Column(String(120), nullable=False)
    tipo_material = Column(String(20), nullable=False)
    formato_material = Column(String(10), nullable=False)
    url_material = Column(String(200), nullable=False)
    cantidad = Column(Integer, nullable=False)
    estado = Column(String(20), nullable=False)
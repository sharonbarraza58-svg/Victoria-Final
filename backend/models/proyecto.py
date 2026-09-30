from sqlalchemy import Column, Integer, String, Date
from sqlalchemy.orm import relationship
from db.database import Base


class Proyecto(Base):
    __tablename__ = "proyecto"

    id_proyecto = Column(Integer, primary_key=True, autoincrement=True)
    nombre_proyecto = Column(String(120), nullable=False)
    descripcion = Column(String(300), nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    url_proyecto = Column(String(200), nullable=False)

    # Relación inversa con los programas que usan este proyecto
    programas = relationship("Programa", back_populates="proyecto")

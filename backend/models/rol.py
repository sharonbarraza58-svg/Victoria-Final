from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from db.database import Base


class Rol(Base):
    """Tabla de roles. VICTORIA-FINAL solo maneja 3 roles:
    coordinador (fusiona lo que antes era 'administrador' + 'coordinador'),
    instructor y aprendiz. El nombre de columna es 'nombre_rol' (estándar
    heredado de victoria-admin-completo, usado en todo el proyecto)."""

    __tablename__ = "rol"

    id_rol = Column(Integer, primary_key=True, autoincrement=True)
    nombre_rol = Column(String(50), nullable=False, unique=True)

    usuarios = relationship("Usuario", back_populates="rol")

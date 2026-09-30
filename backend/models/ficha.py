from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from db.database import Base


class Ficha(Base):
    __tablename__ = "ficha"

    # autoincrement=False: el número de ficha lo escribe el coordinador (el
    # número real del SENA, ej. 3407169) -- así no hace falta un id interno
    # y un "numero_ficha" de exhibición por separado: son el mismo dato.
    id_ficha = Column(Integer, primary_key=True, autoincrement=False)
    estado = Column(String(10), nullable=False)
    fecha_inicio = Column(DateTime, nullable=False)
    fecha_fin = Column(DateTime, nullable=False)
    trimestre = Column(String(2), nullable=True)

    # Horario visible en el perfil del instructor (Doc3), ej. "Diurna,
    # Lun-Vie 7am-1pm". Aportado por la carpeta de coordinación.
    horario = Column(String(100), nullable=True)

    # use_alter=True + name=...: hay dependencia circular real entre
    # 'ficha' y 'programa' (Ficha.id_programa <-> Programa.id_ficha).
    # SQLAlchemy crea la columna primero y añade la FK después con ALTER
    # TABLE -- igual que hace el script SQL a mano.
    id_programa = Column(
        Integer,
        ForeignKey("programa.id_programa", ondelete="SET NULL", use_alter=True, name="fk_ficha_programa"),
        nullable=True,
    )
    id_director = Column(
        Integer,
        ForeignKey("usuario.id_usuario", ondelete="SET NULL", use_alter=True, name="fk_ficha_director"),
        nullable=True,
    )

    usuarios = relationship("Usuario", back_populates="ficha", foreign_keys="[Usuario.id_ficha]")
    programa = relationship("Programa", back_populates="fichas", foreign_keys=[id_programa])
    director = relationship("Usuario", foreign_keys=[id_director])

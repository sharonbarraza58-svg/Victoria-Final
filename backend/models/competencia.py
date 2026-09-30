from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from db.database import Base

class Competencia(Base):
    __tablename__ = 'competencia'

    id_competencia = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(120), nullable=False)
    descripcion = Column(String(300), nullable=True)
    trimestre = Column(String(2), nullable=False)
    fecha_carga = Column(DateTime, nullable=False)

    # NOTA: el script agrega, vía ALTER TABLE, dos columnas más en
    # competencia: id_programa e id_resultado. No se mapean aquí:
    # - id_programa crearía una segunda llave foránea circular entre
    #   'competencia' y 'programa' (Programa ya tiene su propio
    #   id_competencia); no la necesita ningún endpoint hoy.
    # - id_resultado apunta a 'resultado_aprendizaje', tabla que no forma
    #   parte de este recorte de 8 tablas -- mapearla haría que la app
    #   fallara al arrancar (Base.metadata.create_all() no encuentra esa
    #   tabla en el registro de modelos).

    id_programa = Column(
        Integer,
        ForeignKey("programa.id_programa", ondelete="SET NULL", use_alter=True, name="fk_competencia_programa"),
        nullable=True,
    )
    id_instructor = Column(
        Integer,
        ForeignKey("usuario.id_usuario", ondelete="SET NULL"),
        nullable=True,
    )

    programa = relationship("Programa", foreign_keys=[id_programa])
    instructor = relationship("Usuario", foreign_keys=[id_instructor])

    # NOTA: el script agrega, vía ALTER TABLE, la columna id_resultado
    # también. No se mapea aquí: apunta a 'resultado_aprendizaje', tabla
    # que no forma parte de este recorte de 8 tablas -- mapearla haría
    # que la app fallara al arrancar (Base.metadata.create_all() no
    # encuentra esa tabla en el registro de modelos).
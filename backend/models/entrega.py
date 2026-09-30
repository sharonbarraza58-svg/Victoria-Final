"""
Tabla Entrega: la entrega de UN aprendiz para UNA tarea. Aquí vive tanto el
archivo que sube el aprendiz como la calificación y el comentario que le
deja el instructor -- unificados en una sola fila porque la calificación
es por aprendiz, no por tarea.

Cuando el instructor crea una Tarea nueva (ver services/instructor_service.py),
se genera automáticamente una fila "pendiente" por cada aprendiz que ya
está en esa ficha, para que los contadores (Aprobados / En revisión /
Pendientes) sean correctos desde el primer momento.
"""
from sqlalchemy import Column, Integer, Numeric, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from db.database import Base

# Único lugar donde se define la lista de estados válidos -- reutilizado
# por schemas/tarea.py para validar el campo con un Literal.
ESTADOS_ENTREGA = ("pendiente", "en_revision", "aprobado", "rechazado")


class Entrega(Base):
    __tablename__ = "entrega"

    id_entrega = Column(Integer, primary_key=True, autoincrement=True)

    id_tarea = Column(Integer, ForeignKey("tarea.id_tarea", ondelete="CASCADE"), nullable=False)
    id_aprendiz = Column(Integer, ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False)

    estado = Column(String(20), nullable=False, default="pendiente")
    archivo_url = Column(String(300), nullable=True)
    fecha_entrega = Column(DateTime(timezone=True), nullable=True)
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Calificación del instructor (escala SENA 0.0 a 5.0, un decimal) y
    # retroalimentación escrita.
    nota = Column(Numeric(3, 1), nullable=True)
    comentario = Column(Text, nullable=True)

    tarea = relationship("Tarea", back_populates="entregas")
    aprendiz = relationship("Usuario", foreign_keys=[id_aprendiz])
    archivos = relationship("ArchivoEntrega", back_populates="entrega", cascade="all, delete-orphan")

    __table_args__ = (
        # Un aprendiz solo puede tener UNA entrega por tarea.
        UniqueConstraint("id_tarea", "id_aprendiz", name="uq_entrega_tarea_aprendiz"),
    )

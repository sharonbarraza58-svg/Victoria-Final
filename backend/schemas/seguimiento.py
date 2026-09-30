from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ResumenTrimestre(BaseModel):
    """Conteo de competencias y evidencias por trimestre, para las
    pestañas T1-T4 de /victoria/seguimiento."""
    trimestre: str
    numero: str
    competencias: int = 0
    evidencias: int = 0


class MateriaSeguimiento(BaseModel):
    """Una materia (competencia) dentro de un trimestre, con cuántos
    archivos ya subió el aprendiz para ella."""
    id_competencia: int
    nombre: str
    total_archivos: int = 0


class NotaTarea(BaseModel):
    """Una tarea de la materia con la entrega del aprendiz logueado
    (si existe)."""
    id_tarea: int
    titulo: str
    descripcion: Optional[str] = None
    estado: str
    nota: Optional[float] = None
    comentario: Optional[str] = None
    tiene_archivo: bool = False
    fecha: Optional[datetime] = None


class DetalleMateria(BaseModel):
    """Pantalla completa de 'Ver Notas': la materia, su promedio y la
    lista de tareas con la calificación de cada una."""
    id_competencia: int
    nombre: str
    trimestre: str
    numero: str
    promedio: Optional[float] = None
    estado_promedio: str
    tareas: List[NotaTarea]
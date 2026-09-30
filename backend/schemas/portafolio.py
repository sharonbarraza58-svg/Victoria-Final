from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class CarpetaPortafolio(BaseModel):
    """Una de las 5 carpetas fijas del portafolio del aprendiz, con el
    conteo de archivos y la fecha del último subido (para la vista tipo
    Drive de /victoria/portafolio)."""
    categoria: str
    nombre: str
    total_archivos: int = 0
    ultima_modificacion: Optional[datetime] = None


class SubcarpetaPortafolio(BaseModel):
    """Una de las 4 subcarpetas de trimestre dentro de una carpeta del
    portafolio (para la vista tipo Drive de
    /victoria/portafolio/[categoria])."""
    subcarpeta: str
    nombre: str
    total_archivos: int = 0
    ultima_modificacion: Optional[datetime] = None


class CarpetaAprendizCrear(BaseModel):
    """Cuerpo del POST para crear una carpeta dentro de un trimestre."""
    nombre: str


class CarpetaAprendizResponse(BaseModel):
    """Carpeta creada por el aprendiz dentro de un trimestre. La fecha es
    la del último archivo subido a ella, o la de creación si está vacía."""
    id_carpeta: int
    nombre: str
    total_archivos: int = 0
    ultima_modificacion: datetime


class ArchivoPortafolioResponse(BaseModel):
    id_archivo: int
    categoria: str
    subcarpeta: Optional[str] = None
    id_carpeta: Optional[int] = None
    nombre_archivo: str
    url: str
    fecha_subida: datetime

    class Config:
        from_attributes = True
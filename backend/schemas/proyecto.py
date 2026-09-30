from pydantic import BaseModel, field_validator
from datetime import date

from core.validators import anti_scripting


class ProyectoBase(BaseModel):
    nombre_proyecto: str
    descripcion: str
    fecha_inicio: date
    fecha_fin: date
    url_proyecto: str


class ProyectoCreate(ProyectoBase):
    # ESCUDO ANTI-XSS en los campos de texto libre.
    @field_validator("nombre_proyecto", "descripcion", "url_proyecto")
    @classmethod
    def _bloquear_scripting(cls, valor):
        return anti_scripting(valor)


class ProyectoResponse(ProyectoBase):
    id_proyecto: int

    class Config:
        from_attributes = True

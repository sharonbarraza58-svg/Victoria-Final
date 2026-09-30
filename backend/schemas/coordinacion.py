from pydantic import BaseModel, field_validator

from core.validators import anti_scripting

class CoordinacionBase(BaseModel):
    nombre_coordinacion: str
    descripcion_coordinacion: str
    area_enfoque: str

class CoordinacionCreate(CoordinacionBase):
    # ESCUDO ANTI-XSS: bloquea HTML/JS en los 3 campos de texto libre.
    @field_validator("nombre_coordinacion", "descripcion_coordinacion", "area_enfoque")
    @classmethod
    def _bloquear_scripting(cls, valor):
        return anti_scripting(valor)

class CoordinacionResponse(CoordinacionBase):
    id_coordinacion: int

    class Config:
        from_attributes = True
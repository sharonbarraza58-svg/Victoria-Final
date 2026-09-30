from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional

from core.validators import anti_scripting


class NotaBase(BaseModel):
    titulo: str
    materia: Optional[str] = None
    contenido: str


class NotaCreate(NotaBase):
    @field_validator("titulo", "materia", "contenido")
    @classmethod
    def _bloquear_scripting(cls, valor):
        return anti_scripting(valor)


class NotaResponse(NotaBase):
    id_nota: int
    fecha_creacion: datetime
    id_usuario: int

    class Config:
        from_attributes = True

from pydantic import BaseModel, field_validator
from typing import Optional

from core.validators import anti_scripting


class ProgramaBase(BaseModel):
    nombre: str
    nivel_formacion: Optional[str] = None
    descripcion: Optional[str] = None
    url_programa: str
    id_coordinacion: int
    id_ficha: Optional[int] = None
    id_proyecto: Optional[int] = None
    id_competencia: Optional[int] = None


class ProgramaCreate(ProgramaBase):
    # ESCUDO ANTI-XSS en los campos de texto libre (los Optional ya son
    # manejados por anti_scripting cuando llegan como None).
    @field_validator("nombre", "nivel_formacion", "descripcion", "url_programa")
    @classmethod
    def _bloquear_scripting(cls, valor):
        return anti_scripting(valor)


class ProgramaResponse(ProgramaBase):
    id_programa: int

    class Config:
        from_attributes = True

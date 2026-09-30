from pydantic import BaseModel, field_validator
from typing import Optional

from core.validators import anti_scripting


class SedeBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    direccion_principal: Optional[str] = None
    telefono_atencion: Optional[str] = None
    horario_atencion: Optional[str] = None


class SedeCreate(SedeBase):
    # ESCUDO ANTI-XSS en todos los campos de texto libre.
    @field_validator("nombre", "descripcion", "direccion_principal", "telefono_atencion", "horario_atencion")
    @classmethod
    def _bloquear_scripting(cls, valor):
        return anti_scripting(valor)


class SedeResponse(SedeBase):
    id_sede: int

    class Config:
        from_attributes = True

from pydantic import BaseModel, field_validator

from core.validators import anti_scripting


class RolBase(BaseModel):
    nombre_rol: str

class RolCreate(RolBase):
    # ESCUDO ANTI-XSS en el único campo de texto libre.
    @field_validator("nombre_rol")
    @classmethod
    def _bloquear_scripting(cls, valor):
        return anti_scripting(valor)

class RolResponse(RolBase):
    id_rol: int

    class Config:
        from_attributes = True
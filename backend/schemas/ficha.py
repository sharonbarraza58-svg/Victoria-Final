from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional, Literal

from core.validators import anti_scripting

Trimestre = Literal["T1", "T2", "T3", "T4"]


class FichaBase(BaseModel):
    estado: str
    fecha_inicio: datetime
    fecha_fin: datetime
    id_programa: Optional[int] = None
    trimestre: Optional[Trimestre] = None
    id_director: Optional[int] = None
    horario: Optional[str] = None


class FichaCreate(FichaBase):
    # El número de ficha real del SENA, escrito por el coordinador. Como es
    # la llave primaria, si ya existe uno igual, Postgres rechaza la
    # creación (routes/ficha.py atrapa ese error y lo explica).
    id_ficha: int

    @field_validator("estado", "horario")
    @classmethod
    def _bloquear_scripting(cls, valor):
        return anti_scripting(valor)

    @field_validator("id_ficha")
    @classmethod
    def _numero_de_ficha_valido(cls, valor: int) -> int:
        if len(str(valor)) != 7:
            raise ValueError("El número de ficha debe tener exactamente 7 dígitos.")
        return valor


class FichaUpdate(BaseModel):
    estado: Optional[str] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    id_programa: Optional[int] = None
    trimestre: Optional[Trimestre] = None
    id_director: Optional[int] = None
    horario: Optional[str] = None

    @field_validator("estado", "horario")
    @classmethod
    def _bloquear_scripting(cls, valor):
        return anti_scripting(valor)


class FichaResponse(FichaBase):
    id_ficha: int

    class Config:
        from_attributes = True

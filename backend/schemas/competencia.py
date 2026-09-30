from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional

from core.validators import anti_scripting

TRIMESTRES_VALIDOS = {"T1", "T2", "T3", "T4"}

class CompetenciaBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    trimestre: str
    fecha_carga: datetime
    id_programa: Optional[int] = None
    id_instructor: Optional[int] = None

class CompetenciaCreate(CompetenciaBase):
    @field_validator("nombre", "descripcion")
    @classmethod
    def _bloquear_scripting(cls, valor):
        return anti_scripting(valor)

    @field_validator("trimestre")
    @classmethod
    def _validar_trimestre(cls, valor: str) -> str:
        valor = valor.strip().upper()
        if valor not in TRIMESTRES_VALIDOS:
            raise ValueError("El trimestre debe ser uno de: T1, T2, T3, T4.")
        return valor

class CompetenciaResponse(CompetenciaBase):
    id_competencia: int
    # Nombre del instructor ya "aplanado" (armado en el service a partir
    # de la relación), para que el frontend no tenga que hacer un
    # segundo fetch para mostrar "- Sandra profe".
    nombre_instructor: Optional[str] = None

    class Config:
        from_attributes = True
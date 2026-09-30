from pydantic import BaseModel, field_validator

from core.validators import anti_scripting

class MaterialBase(BaseModel):
    nombre_material: str
    tipo_material: str
    formato_material: str
    url_material: str
    cantidad: int
    estado: str

class MaterialCreate(MaterialBase):
    # ESCUDO ANTI-XSS en todos los campos de texto libre.
    # OJO: url_material también se valida aquí porque un <script> disfrazado
    # de URL es un vector de XSS clásico (ej. "javascript:alert(1)").
    @field_validator(
        "nombre_material", "tipo_material", "formato_material",
        "url_material", "estado",
    )
    @classmethod
    def _bloquear_scripting(cls, valor):
        return anti_scripting(valor)

class MaterialResponse(MaterialBase):
    id_material: int
    class Config:
        from_attributes = True
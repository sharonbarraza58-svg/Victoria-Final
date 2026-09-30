from pydantic import BaseModel, EmailStr, field_validator


class SolicitudRecuperacion(BaseModel):
    correo: EmailStr


class ConfirmarRecuperacion(BaseModel):
    correo: EmailStr
    codigo: str
    nueva_contrasena: str

    @field_validator("codigo")
    @classmethod
    def _codigo_de_6_digitos(cls, valor: str) -> str:
        if not valor.isdigit() or len(valor) != 6:
            raise ValueError("El código debe tener exactamente 6 dígitos.")
        return valor

    @field_validator("nueva_contrasena")
    @classmethod
    def _minimo_8_caracteres(cls, valor: str) -> str:
        if len(valor) < 8:
            raise ValueError("La nueva contraseña debe tener al menos 8 caracteres.")
        return valor

    
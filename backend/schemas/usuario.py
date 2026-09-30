from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime, date
from typing import Optional

from core.validators import anti_scripting

import re

_PATRON_MAYUSCULA = re.compile(r"[A-Z]")
_PATRON_MINUSCULA = re.compile(r"[a-z]")
_PATRON_NUMERO = re.compile(r"[0-9]")
_PATRON_ESPECIAL = re.compile(r"[^A-Za-z0-9]")


def validar_password_segura(valor: str) -> str:
    """Contraseña segura: mínimo 8 caracteres, con al menos una mayúscula,
    una minúscula, un número y un carácter especial."""
    errores = []
    if len(valor) < 8:
        errores.append("mínimo 8 caracteres")
    if not _PATRON_MAYUSCULA.search(valor):
        errores.append("al menos una mayúscula")
    if not _PATRON_MINUSCULA.search(valor):
        errores.append("al menos una minúscula")
    if not _PATRON_NUMERO.search(valor):
        errores.append("al menos un número")
    if not _PATRON_ESPECIAL.search(valor):
        errores.append("al menos un carácter especial")

    if errores:
        raise ValueError("La contraseña debe tener " + ", ".join(errores) + ".")
    return valor


class UsuarioBase(BaseModel):
    nombre: str = Field(..., max_length=100)
    apellido: Optional[str] = Field(None, max_length=100)
    id_rol: int
    estado: Optional[str] = "activo"
    fecha_nacimiento: date
    numero_documento: str = Field(..., max_length=20)
    tipo_documento: str = Field(..., max_length=20)
    telefono: Optional[str] = Field(None, max_length=20)
    correo_personal: EmailStr = Field(..., max_length=100)
    correo_sena: EmailStr = Field(..., max_length=100)

    # Todos estos ID son opcionales para permitir la creación de
    # coordinadores o instructores sin ficha/coordinación asignada aún.
    id_ficha: Optional[int] = None
    id_coordinacion: Optional[int] = None

    # Nota libre que un instructor puede dejar sobre un aprendiz al darlo
    # de alta.
    informacion_adicional: Optional[str] = Field(None, max_length=500)

    # --- Perfil de instructor (solo aplica si id_rol corresponde al rol
    # "instructor"; en cualquier otro caso se quedan en None). ---
    id_sede: Optional[int] = None
    tipo_instructor: Optional[str] = Field(None, max_length=20)
    especialidad: Optional[str] = Field(None, max_length=150)
    tipo_contrato: Optional[str] = Field(None, max_length=50)
    vigencia_contrato: Optional[date] = None
    hoja_vida_url: Optional[str] = Field(None, max_length=300)


class UsuarioCreate(UsuarioBase):
    contrasena: str = Field(..., min_length=8)

    @field_validator("contrasena")
    @classmethod
    def _validar_password(cls, valor):
        return validar_password_segura(valor)

    # ESCUDO ANTI-XSS. No incluye "contrasena" (se hashea de inmediato) ni
    # los correos (EmailStr ya obliga un formato válido).
    @field_validator(
        "nombre", "apellido", "estado", "numero_documento", "tipo_documento",
        "telefono", "informacion_adicional", "tipo_instructor", "especialidad",
        "tipo_contrato", "hoja_vida_url",
    )
    @classmethod
    def _bloquear_scripting(cls, valor):
        return anti_scripting(valor)


# Esquema para el registro PÚBLICO (POST /api/v1/auth/register).
#
# A propósito NO hereda de UsuarioBase/UsuarioCreate: esos dos tienen
# "id_rol: int" como campo obligatorio que el cliente controla libremente.
# Usar esos schemas en una ruta pública le permitiría a CUALQUIER persona
# autoasignarse "id_rol": 1 (coordinador) al registrarse. Este schema
# deliberadamente no tiene "id_rol" ni "estado": ambos los asigna el
# servidor (ver AuthService.registrar_usuario), nunca el cliente.
class UsuarioRegistroPublico(BaseModel):
    nombre: str = Field(..., max_length=100)
    apellido: Optional[str] = Field(None, max_length=100)
    fecha_nacimiento: date
    numero_documento: str = Field(..., max_length=20)
    tipo_documento: str = Field(..., max_length=20)
    telefono: Optional[str] = Field(None, max_length=20)
    correo_personal: EmailStr = Field(..., max_length=100)
    correo_sena: EmailStr = Field(..., max_length=100)
    id_ficha: Optional[int] = None
    id_coordinacion: Optional[int] = None
    contrasena: str = Field(..., min_length=8)

    @field_validator("contrasena")
    @classmethod
    def _validar_password(cls, valor):
        return validar_password_segura(valor)

    @field_validator("nombre", "apellido", "numero_documento", "tipo_documento", "telefono")
    @classmethod
    def _bloquear_scripting(cls, valor):
        return anti_scripting(valor)


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    # "estado" se queda como campo del schema (lo necesita el coordinador
    # para activar/desactivar a otros), pero la ruta ignora este valor
    # cuando quien edita NO es coordinador.
    estado: Optional[str] = None
    telefono: Optional[str] = None
    correo_personal: Optional[EmailStr] = None
    id_ficha: Optional[int] = None
    id_coordinacion: Optional[int] = None
    informacion_adicional: Optional[str] = Field(None, max_length=500)

    id_sede: Optional[int] = None
    tipo_instructor: Optional[str] = Field(None, max_length=20)
    especialidad: Optional[str] = Field(None, max_length=150)
    tipo_contrato: Optional[str] = Field(None, max_length=50)
    vigencia_contrato: Optional[date] = None
    hoja_vida_url: Optional[str] = Field(None, max_length=300)

    @field_validator(
        "nombre", "apellido", "estado", "telefono", "informacion_adicional",
        "tipo_instructor", "especialidad", "tipo_contrato", "hoja_vida_url",
    )
    @classmethod
    def _bloquear_scripting(cls, valor):
        return anti_scripting(valor)


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    numero_documento: Optional[str] = None

class FichaInfo(BaseModel):
    id_ficha: int
    trimestre: Optional[str] = None
    programa: Optional[str] = None
    director: Optional[str] = None

    class Config:
        from_attributes = True
        
class UsuarioResponse(UsuarioBase):
    id_usuario: int
    fecha_creacion: datetime
    nombre_rol: Optional[str] = None
    # Datos de la ficha ya "aplanados" (programa, trimestre, director),
    # armados en la ruta /me a partir de las relaciones de Ficha/Programa.
    # None si el usuario no tiene ficha asignada (coordinador/instructor sin ficha).
    ficha_info: Optional[FichaInfo] = None

    class Config:
        from_attributes = True
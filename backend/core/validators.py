"""
Validadores de seguridad reutilizables para los schemas de Pydantic.

EL ESCUDO ANTI-XSS (perimetral)
================================
Este módulo centraliza la lógica anti-XSS en un solo lugar. En vez de
copiar el mismo bloque de regex en cada uno de los schemas del proyecto,
se define UNA sola vez aquí y cada schema solo importa y aplica
`anti_scripting` sobre los campos de texto libre que le correspondan.

Ventajas de centralizarlo:
- Si mañana hay que afinar el patrón (agregar "onmouseover", por ejemplo),
  se cambia en un solo lugar y protege a TODOS los schemas automáticamente.
- Evita que un desarrollador olvide blindar un campo nuevo por copiar mal
  el bloque de código.
"""
import re
from typing import Optional

# Patrón peligroso: etiquetas HTML, protocolo javascript: y manejadores de
# eventos inline que son el vector clásico de un ataque XSS almacenado.
_PATRON_PELIGROSO = re.compile(
    r"<[^>]*>|javascript:|onerror|onload|onclick|onmouseover|onfocus|onblur",
    re.IGNORECASE,
)


def anti_scripting(valor: Optional[str]) -> Optional[str]:
    """
    Si el usuario intenta meter código HTML o JS en un campo de texto,
    Pydantic destruye la petición en la frontera de la API (422 Unprocessable
    Entity) ANTES de que ese dato toque la base de datos o la lógica de
    negocio.

    Se usa como función de apoyo dentro de un @field_validator, por ejemplo:

        from pydantic import field_validator
        from core.validators import anti_scripting

        class AlgoCreate(AlgoBase):
            @field_validator("nombre", "descripcion")
            @classmethod
            def _bloquear_scripting(cls, valor):
                return anti_scripting(valor)
    """
    # Los campos Optional pueden llegar como None: no hay nada que validar.
    if valor is None:
        return valor

    if _PATRON_PELIGROSO.search(valor):
        raise ValueError(
            "VALIDACIÓN BLOQUEADA: no se permiten caracteres de scripting o HTML."
        )

    return valor.strip()

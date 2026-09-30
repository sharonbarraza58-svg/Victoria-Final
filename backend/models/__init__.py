"""
Se importa el paquete "models" completo (no un modelo suelto) para que
TODOS los modelos queden registrados en Base.metadata ANTES de llamar a
create_all(). Ver main.py.
"""
from .rol import Rol
from .sede import Sede
from .coordinacion import Coordinacion
from .proyecto import Proyecto
from .programa import Programa
from .ficha import Ficha
from .competencia import Competencia
from .materiales import Material
from .usuario import Usuario
from .tarea import Tarea
from .entrega import Entrega
from .asignacion_instructor import AsignacionInstructor
from .nota import Nota
from .notificacion import Notificacion
from models.carpeta_portafolio import CarpetaAprendiz

__all__ = [
    "Rol",
    "Sede",
    "Coordinacion",
    "Proyecto",
    "Programa",
    "Ficha",
    "Competencia",
    "Material",
    "Usuario",
    "Tarea",
    "Entrega",
    "AsignacionInstructor",
    "Nota",
    "Notificacion",
]

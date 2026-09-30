from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import List, Optional
from decimal import Decimal


# ==========================================================================
# Uploads
# ==========================================================================
class UploadResponse(BaseModel):
    url: str


# ==========================================================================
# Dashboard
# ==========================================================================
class FichaResumen(BaseModel):
    id_ficha: int
    numero_ficha: Optional[str] = None
    nombre_programa: Optional[str] = None
    nombre_competencia: Optional[str] = None
    trimestre: Optional[int] = None
    num_estudiantes: int = 0


class DashboardInstructorResponse(BaseModel):
    nombre_programa_principal: Optional[str] = None
    descripcion_programa_principal: Optional[str] = None
    numero_ficha_principal: Optional[str] = None
    trimestre_actual: Optional[int] = None
    total_fichas: int = 0
    total_aprendices: int = 0
    fichas_recientes: List[FichaResumen] = []


# ==========================================================================
# Árbol de competencias: Trimestre > Materia > Fichas
# ==========================================================================
class FichaEnMateria(BaseModel):
    id_ficha: int
    numero_ficha: Optional[str] = None
    num_estudiantes: int = 0


class MateriaConFichas(BaseModel):
    id_competencia: int
    nombre: str
    descripcion: Optional[str] = None
    fichas: List[FichaEnMateria] = []


class TrimestreConMaterias(BaseModel):
    trimestre: int
    materias: List[MateriaConFichas] = []


# ==========================================================================
# Tareas (vista del instructor)
# ==========================================================================
class TareaCreate(BaseModel):
    titulo: str
    descripcion: Optional[str] = None
    fecha_limite: Optional[date] = None
    archivo_url: Optional[str] = None


class TareaResponse(BaseModel):
    id_tarea: int
    titulo: str
    descripcion: Optional[str] = None
    fecha_limite: Optional[date] = None
    archivo_url: Optional[str] = None
    id_ficha: int
    id_competencia: int
    fecha_creacion: datetime
    total_aprendices: int = 0
    total_aprobados: int = 0
    total_en_revision: int = 0
    total_pendientes: int = 0

    class Config:
        from_attributes = True


class EntregaResponse(BaseModel):
    id_entrega: int
    id_aprendiz: int
    nombre_aprendiz: str
    estado: str
    archivo_url: Optional[str] = None
    tipo_archivo: Optional[str] = None
    fecha_entrega: Optional[datetime] = None
    nota: Optional[float] = None
    comentario: Optional[str] = None

    class Config:
        from_attributes = True


class TareaDetalleResponse(TareaResponse):
    numero_ficha: Optional[str] = None
    nombre_competencia: Optional[str] = None
    entregas: List[EntregaResponse] = []


class EntregaUpdate(BaseModel):
    estado: Optional[str] = None
    nota: Optional[Decimal] = Field(None, ge=0, le=10)
    comentario: Optional[str] = None


# ==========================================================================
# Portafolios de fichas
# ==========================================================================
class PortafolioFichaResponse(BaseModel):
    id_ficha: int
    numero_ficha: Optional[str] = None
    nombre_programa: Optional[str] = None
    nombre_competencia: Optional[str] = None
    trimestre: Optional[int] = None
    num_aprendices: int = 0


# ==========================================================================
# Aprendices de una ficha
# ==========================================================================
class AprendizResumen(BaseModel):
    id_usuario: int
    nombre_completo: str
    numero_documento: str
    estado_portafolio: str


class AprendizCreate(BaseModel):
    nombre: str
    apellido: Optional[str] = None
    fecha_nacimiento: date
    numero_documento: str
    tipo_documento: str
    correo_personal: str
    correo_sena: str
    contrasena: Optional[str] = None
    informacion_adicional: Optional[str] = None


class AprendizCreadoResponse(BaseModel):
    id_usuario: int
    nombre: str
    apellido: Optional[str] = None
    numero_documento: str
    correo_sena: str
    contrasena_temporal: Optional[str] = None


# ----- Portafolio de UN aprendiz puntual -----
class ActividadPortafolio(BaseModel):
    id_tarea: int
    titulo: str
    descripcion: Optional[str] = None
    fecha_limite: Optional[date] = None
    id_entrega: Optional[int] = None
    estado: Optional[str] = None
    archivo_url: Optional[str] = None
    tipo_archivo: Optional[str] = None
    fecha_entrega: Optional[datetime] = None
    nota: Optional[float] = None
    comentario: Optional[str] = None


class CompetenciaPortafolio(BaseModel):
    id_competencia: int
    nombre_competencia: str
    actividades: List[ActividadPortafolio] = []


class PortafolioAprendizResponse(BaseModel):
    id_usuario: int
    nombre_completo: str
    numero_documento: str
    id_ficha: int
    numero_ficha: Optional[str] = None
    competencias: List[CompetenciaPortafolio] = []


# ==========================================================================
# Asignaciones (instructor <-> ficha <-> materia <-> trimestre)
# ==========================================================================
class AsignacionCreate(BaseModel):
    id_instructor: int
    id_ficha: int
    id_competencia: int
    trimestre: int


class AsignacionResponse(BaseModel):
    id_asignacion: int
    id_instructor: int
    id_ficha: int
    id_competencia: int
    trimestre: int
    fecha_creacion: datetime

    class Config:
        from_attributes = True


# ==========================================================================
# Vista del APRENDIZ — agregado para conectar la pantalla de Competencias
# del rol aprendiz a datos reales.
# ==========================================================================
class TareaParaAprendiz(BaseModel):
    """
    Una tarea vista por el aprendiz dueño de la entrega: junta los datos
    fijos de la Tarea (título, descripción, fecha límite) con el estado
    de SU propia Entrega (estado, nota, comentario). Se arma "a mano" en
    el service en vez de heredar de un TareaBase porque mezcla dos tablas.
    """
    id_tarea: int
    titulo: str
    descripcion: Optional[str] = None
    fecha_limite: Optional[date] = None
    archivo_url: Optional[str] = None

    id_entrega: Optional[int] = None
    estado: str = "pendiente"
    nota: Optional[Decimal] = None
    comentario: Optional[str] = None
    fecha_entrega: Optional[datetime] = None

    class Config:
        from_attributes = True


class TareaProximaAprendiz(BaseModel):
    """
    Versión resumida de una tarea para el bloque "Tareas con entrega
    próxima" del dashboard: incluye el trimestre y el nombre de la
    competencia para poder armar el link directo a
    /victoria/competencias/[trimestre]/[materia] desde el frontend.
    """
    id_tarea: int
    titulo: str
    fecha_limite: Optional[date] = None
    estado: str = "pendiente"
    id_competencia: int
    nombre_competencia: str
    trimestre: str

    class Config:
        from_attributes = True

class ArchivoResponse(BaseModel):
    id_archivo: int
    nombre_archivo: str
    url: str

    class Config:
        from_attributes = True


class TareaDetalleParaAprendiz(BaseModel):
    """
    Vista completa de una tarea para el aprendiz: título, descripción,
    fecha límite, quién la creó, sus archivos de referencia, y el estado +
    archivos de la propia entrega del aprendiz. La usa la pantalla de
    detalle /victoria/tarea/[id] al hacer clic en una tarea.
    """
    id_tarea: int
    titulo: str
    descripcion: Optional[str] = None
    fecha_limite: Optional[date] = None
    fecha_creacion: datetime
    nombre_instructor: Optional[str] = None
    archivos_referencia: List[ArchivoResponse] = []

    id_entrega: Optional[int] = None
    estado: str = "pendiente"
    nota: Optional[Decimal] = None
    comentario: Optional[str] = None
    fecha_entrega: Optional[datetime] = None
    archivos_entrega: List[ArchivoResponse] = []

    class Config:
        from_attributes = True
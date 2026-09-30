from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel

TipoInstructor = Literal["planta", "tecnico", "transversal", "contratista"]


# ==========================================================================
# 1. Dashboard
# ==========================================================================
class FichaResumenResponse(BaseModel):
    id_ficha: int
    numero_ficha: Optional[str] = None
    nombre_programa: Optional[str] = None
    trimestre: Optional[int] = None
    nombre_director_ficha: Optional[str] = None
    num_estudiantes: int


class DashboardCoordinadorResponse(BaseModel):
    nombre_programa_principal: Optional[str] = None
    numero_ficha_principal: Optional[str] = None
    trimestre_actual: Optional[int] = None
    nombre_director_ficha: Optional[str] = None
    total_fichas: int
    fichas_recientes: List[FichaResumenResponse] = []


# ==========================================================================
# 2. Instructores (vista de solo lectura del coordinador)
# ==========================================================================
class InstructorResumenResponse(BaseModel):
    id_usuario: int
    nombre_completo: str
    tipo_instructor: TipoInstructor
    numero_documento: str


class InstructorDetalleResponse(InstructorResumenResponse):
    especialidad: Optional[str] = None
    tipo_contrato: Optional[str] = None
    vigencia_contrato: Optional[date] = None
    numero_ficha: Optional[str] = None
    horario_ficha: Optional[str] = None
    correo_sena: str
    telefono: Optional[str] = None
    hoja_vida_url: Optional[str] = None


# ==========================================================================
# 3. Portafolio del instructor (solo lectura para el coordinador)
# ==========================================================================
class CompetenciaPortafolioResponse(BaseModel):
    id_competencia: int
    nombre: str
    archivos: int


class TrimestrePortafolioResponse(BaseModel):
    trimestre: int
    evidencias: int
    competencias: List[CompetenciaPortafolioResponse] = []


class PortafolioInstructorResponse(BaseModel):
    id_usuario: int
    nombre_completo: str
    tipo_instructor: TipoInstructor
    trimestres: List[TrimestrePortafolioResponse] = []


class EntregaArchivoResponse(BaseModel):
    id_evidencia: int
    nombre_archivo: str
    url: str


class CompetenciaDetalleResponse(BaseModel):
    id_competencia: int
    nombre: str
    descripcion: Optional[str] = None
    trimestre: int
    fecha_creacion: datetime
    fecha_edicion: Optional[datetime] = None
    archivos: List[EntregaArchivoResponse] = []

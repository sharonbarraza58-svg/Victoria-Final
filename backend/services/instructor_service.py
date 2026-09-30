"""
Lógica de negocio del módulo de instructor.

Todas las consultas de este archivo están, a propósito, siempre filtradas
por id_instructor (el dueño real del recurso, sacado del token JWT en
routes/instructor.py -- nunca de un parámetro que mande el cliente). Así,
aunque dos instructores compartan la misma ficha, cada uno solo ve y
modifica lo que le corresponde a él. require_instructor (core/security.py)
es el primer filtro (que el rol sea "instructor"); estos métodos son el
SEGUNDO filtro (que el recurso sea, además, suyo).
"""
import secrets
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from core.security import hash_password
from models.asignacion_instructor import AsignacionInstructor
from models.competencia import Competencia
from models.entrega import Entrega
from models.ficha import Ficha
from models.programa import Programa
from models.rol import Rol
from models.tarea import Tarea
from models.usuario import Usuario
from services.notificacion_service import NotificacionService
from schemas.tarea import (
    AprendizCreate,
    AsignacionCreate,
    DashboardInstructorResponse,
    EntregaUpdate,
    FichaEnMateria,
    FichaResumen,
    MateriaConFichas,
    PortafolioFichaResponse,
    TareaCreate,
    TrimestreConMaterias,
)

NOMBRE_ROL_APRENDIZ = "aprendiz"

_EXTENSIONES_WORD = {".doc", ".docx"}
_EXTENSIONES_PDF = {".pdf"}
_EXTENSIONES_VIDEO = {".mp4", ".mov", ".avi", ".mkv", ".webm"}


def _tipo_archivo(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    extension = ("." + url.rsplit(".", 1)[-1].lower()) if "." in url else ""
    if extension in _EXTENSIONES_WORD:
        return "word"
    if extension in _EXTENSIONES_PDF:
        return "pdf"
    if extension in _EXTENSIONES_VIDEO:
        return "video"
    return "otro"


class InstructorService:
    def __init__(self, db: Session):
        self.db = db

    # ----------------------------------------------------------------
    # Helpers internos
    # ----------------------------------------------------------------
    def _asignaciones_del_instructor(self, id_instructor: int) -> List[AsignacionInstructor]:
        return (
            self.db.query(AsignacionInstructor)
            .filter(AsignacionInstructor.id_instructor == id_instructor)
            .all()
        )

    def _verificar_acceso_ficha(self, id_instructor: int, id_ficha: int) -> None:
        existe = (
            self.db.query(AsignacionInstructor)
            .filter(
                AsignacionInstructor.id_instructor == id_instructor,
                AsignacionInstructor.id_ficha == id_ficha,
            )
            .first()
        )
        if not existe:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes una asignación activa sobre esta ficha.",
            )

    def _verificar_acceso_ficha_competencia(
        self, id_instructor: int, id_ficha: int, id_competencia: int
    ) -> AsignacionInstructor:
        asignacion = (
            self.db.query(AsignacionInstructor)
            .filter(
                AsignacionInstructor.id_instructor == id_instructor,
                AsignacionInstructor.id_ficha == id_ficha,
                AsignacionInstructor.id_competencia == id_competencia,
            )
            .first()
        )
        if not asignacion:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes esta ficha y esta materia asignadas.",
            )
        return asignacion

    def _contar_aprendices_en_ficha(self, id_ficha: int) -> int:
        return (
            self.db.query(func.count(Usuario.id_usuario))
            .join(Rol, Usuario.id_rol == Rol.id_rol)
            .filter(Usuario.id_ficha == id_ficha, Rol.nombre_rol.ilike(NOMBRE_ROL_APRENDIZ))
            .scalar()
        ) or 0

    def _rol_aprendiz(self) -> Rol:
        rol = self.db.query(Rol).filter(Rol.nombre_rol.ilike(NOMBRE_ROL_APRENDIZ)).first()
        if not rol:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=(
                    "No existe el rol 'aprendiz' en la base de datos. "
                    "Un coordinador debe crearlo primero con POST /api/roles."
                ),
            )
        return rol

    # ----------------------------------------------------------------
    # 1. Dashboard
    # ----------------------------------------------------------------
    def obtener_dashboard(self, id_instructor: int) -> DashboardInstructorResponse:
        asignaciones = (
            self.db.query(AsignacionInstructor)
            .filter(AsignacionInstructor.id_instructor == id_instructor)
            .order_by(AsignacionInstructor.fecha_creacion.desc())
            .all()
        )

        if not asignaciones:
            return DashboardInstructorResponse(fichas_recientes=[])

        ids_ficha_unicos: List[int] = []
        for a in asignaciones:
            if a.id_ficha not in ids_ficha_unicos:
                ids_ficha_unicos.append(a.id_ficha)

        principal = asignaciones[0]
        ficha_principal = self.db.query(Ficha).filter(Ficha.id_ficha == principal.id_ficha).first()
        programa_principal = (
            self.db.query(Programa).filter(Programa.id_ficha == principal.id_ficha).first()
            if ficha_principal
            else None
        )

        fichas_recientes: List[FichaResumen] = []
        for id_ficha in ids_ficha_unicos[:6]:
            ficha = self.db.query(Ficha).filter(Ficha.id_ficha == id_ficha).first()
            asignacion_ficha = next(a for a in asignaciones if a.id_ficha == id_ficha)
            competencia = (
                self.db.query(Competencia)
                .filter(Competencia.id_competencia == asignacion_ficha.id_competencia)
                .first()
            )
            programa = self.db.query(Programa).filter(Programa.id_ficha == id_ficha).first()
            fichas_recientes.append(
                FichaResumen(
                    id_ficha=id_ficha,
                    numero_ficha=str(ficha.id_ficha) if ficha else None,
                    nombre_programa=programa.nombre if programa else None,
                    nombre_competencia=competencia.nombre if competencia else None,
                    trimestre=asignacion_ficha.trimestre,
                    num_estudiantes=self._contar_aprendices_en_ficha(id_ficha),
                )
            )

        total_aprendices = sum(f.num_estudiantes for f in fichas_recientes)

        return DashboardInstructorResponse(
            nombre_programa_principal=programa_principal.nombre if programa_principal else None,
            descripcion_programa_principal=programa_principal.descripcion if programa_principal else None,
            numero_ficha_principal=str(ficha_principal.id_ficha) if ficha_principal else None,
            trimestre_actual=principal.trimestre,
            total_fichas=len(ids_ficha_unicos),
            total_aprendices=total_aprendices,
            fichas_recientes=fichas_recientes,
        )

    # ----------------------------------------------------------------
    # 2. Árbol de competencias: Trimestre > Materia > Fichas
    # ----------------------------------------------------------------
    def obtener_arbol_competencias(self, id_instructor: int) -> List[TrimestreConMaterias]:
        asignaciones = self._asignaciones_del_instructor(id_instructor)

        por_trimestre: dict = {}
        for a in asignaciones:
            materias_trimestre = por_trimestre.setdefault(a.trimestre, {})
            if a.id_competencia not in materias_trimestre:
                competencia = (
                    self.db.query(Competencia)
                    .filter(Competencia.id_competencia == a.id_competencia)
                    .first()
                )
                materias_trimestre[a.id_competencia] = MateriaConFichas(
                    id_competencia=a.id_competencia,
                    nombre=competencia.nombre if competencia else "Materia",
                    descripcion=competencia.descripcion if competencia else None,
                    fichas=[],
                )
            ficha = self.db.query(Ficha).filter(Ficha.id_ficha == a.id_ficha).first()
            materias_trimestre[a.id_competencia].fichas.append(
                FichaEnMateria(
                    id_ficha=a.id_ficha,
                    numero_ficha=str(ficha.id_ficha) if ficha else None,
                    num_estudiantes=self._contar_aprendices_en_ficha(a.id_ficha),
                )
            )

        resultado = [
            TrimestreConMaterias(trimestre=trimestre, materias=list(materias.values()))
            for trimestre, materias in sorted(por_trimestre.items())
        ]
        return resultado

    # ----------------------------------------------------------------
    # 3. Tareas de una ficha + materia
    # ----------------------------------------------------------------
    def _armar_tarea_response(self, tarea: Tarea) -> dict:
        entregas = self.db.query(Entrega).filter(Entrega.id_tarea == tarea.id_tarea).all()
        return {
            "id_tarea": tarea.id_tarea,
            "titulo": tarea.titulo,
            "descripcion": tarea.descripcion,
            "fecha_limite": tarea.fecha_limite,
            "archivo_url": tarea.archivo_url,
            "id_ficha": tarea.id_ficha,
            "id_competencia": tarea.id_competencia,
            "fecha_creacion": tarea.fecha_creacion,
            "total_aprendices": len(entregas),
            "total_aprobados": sum(1 for e in entregas if e.estado == "aprobado"),
            "total_en_revision": sum(1 for e in entregas if e.estado == "en_revision"),
            "total_pendientes": sum(1 for e in entregas if e.estado == "pendiente"),
        }

    def obtener_tareas(self, id_instructor: int, id_ficha: int, id_competencia: int) -> List[dict]:
        self._verificar_acceso_ficha_competencia(id_instructor, id_ficha, id_competencia)
        tareas = (
            self.db.query(Tarea)
            .filter(Tarea.id_ficha == id_ficha, Tarea.id_competencia == id_competencia)
            .order_by(Tarea.fecha_creacion.desc())
            .all()
        )
        return [self._armar_tarea_response(t) for t in tareas]

    def crear_tarea(self, id_instructor: int, id_ficha: int, id_competencia: int, data: TareaCreate) -> dict:
        self._verificar_acceso_ficha_competencia(id_instructor, id_ficha, id_competencia)

        nueva_tarea = Tarea(
            **data.model_dump(),
            id_ficha=id_ficha,
            id_competencia=id_competencia,
            id_instructor=id_instructor,
        )
        self.db.add(nueva_tarea)
        self.db.commit()
        self.db.refresh(nueva_tarea)

        # Generamos automáticamente una entrega "pendiente" por cada
        # aprendiz que YA está en la ficha, para que los contadores de
        # Aprobados/En revisión sean correctos desde el primer momento, y
        # le avisamos a cada uno con una notificación.
        aprendices = (
            self.db.query(Usuario)
            .join(Rol, Usuario.id_rol == Rol.id_rol)
            .filter(Usuario.id_ficha == id_ficha, Rol.nombre_rol.ilike(NOMBRE_ROL_APRENDIZ))
            .all()
        )
        notificaciones = NotificacionService(self.db)
        for aprendiz in aprendices:
            self.db.add(
                Entrega(id_tarea=nueva_tarea.id_tarea, id_aprendiz=aprendiz.id_usuario, estado="pendiente")
            )
            notificaciones.crear(
                id_usuario=aprendiz.id_usuario,
                titulo_notificacion="Nueva tarea asignada",
                mensaje=f'Se asignó la tarea "{nueva_tarea.titulo}".',
                tipo="tarea_nueva",
                origen="instructor",
            )
        self.db.commit()

        return self._armar_tarea_response(nueva_tarea)

    def obtener_tarea_detalle(self, id_instructor: int, id_tarea: int) -> dict:
        tarea = self.db.query(Tarea).filter(Tarea.id_tarea == id_tarea).first()
        if not tarea:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada.")
        if tarea.id_instructor != id_instructor:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Esta tarea pertenece a otro instructor.",
            )

        ficha = self.db.query(Ficha).filter(Ficha.id_ficha == tarea.id_ficha).first()
        competencia = (
            self.db.query(Competencia).filter(Competencia.id_competencia == tarea.id_competencia).first()
        )
        entregas = self.db.query(Entrega).filter(Entrega.id_tarea == tarea.id_tarea).all()
        entregas_out = []
        for e in entregas:
            aprendiz = self.db.query(Usuario).filter(Usuario.id_usuario == e.id_aprendiz).first()
            nombre = " ".join(filter(None, [aprendiz.nombre, aprendiz.apellido])) if aprendiz else "—"
            entregas_out.append(
                {
                    "id_entrega": e.id_entrega,
                    "id_aprendiz": e.id_aprendiz,
                    "nombre_aprendiz": nombre,
                    "estado": e.estado,
                    "archivo_url": e.archivo_url,
                    "tipo_archivo": _tipo_archivo(e.archivo_url),
                    "fecha_entrega": e.fecha_entrega,
                    "nota": float(e.nota) if e.nota is not None else None,
                    "comentario": e.comentario,
                }
            )

        base = self._armar_tarea_response(tarea)
        base.update(
            {
                "numero_ficha": str(ficha.id_ficha) if ficha else None,
                "nombre_competencia": competencia.nombre if competencia else None,
                "entregas": entregas_out,
            }
        )
        return base

    def actualizar_entrega(self, id_instructor: int, id_entrega: int, data: EntregaUpdate) -> dict:
        """Cambia el estado y/o guarda la calificación (nota + comentario)
        de la entrega de UN aprendiz. `nota` y `comentario` llegan
        opcionales: si el cliente no los manda se conserva lo que ya
        había guardado, en vez de borrarlo."""
        entrega = self.db.query(Entrega).filter(Entrega.id_entrega == id_entrega).first()
        if not entrega:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entrega no encontrada.")

        tarea = self.db.query(Tarea).filter(Tarea.id_tarea == entrega.id_tarea).first()
        if not tarea or tarea.id_instructor != id_instructor:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Esta entrega pertenece a una tarea de otro instructor.",
            )

        estado_anterior = entrega.estado
        if data.estado is not None:
            entrega.estado = data.estado
        elif data.nota is not None:
            entrega.estado = "aprobado" if data.nota >= 8 else "rechazado"
        if data.nota is not None:
           entrega.nota = data.nota
        if data.comentario is not None:
            entrega.comentario = data.comentario
        self.db.commit()
        self.db.refresh(entrega)

        # Si el instructor califica (aprobado/rechazado) le avisamos al
        # aprendiz dueño de la entrega.
        if estado_anterior != entrega.estado and entrega.estado in ("aprobado", "rechazado"):
            NotificacionService(self.db).crear(
                id_usuario=entrega.id_aprendiz,
                titulo_notificacion=f'Tu entrega para "{tarea.titulo}" fue {entrega.estado.replace("_", " ")}',
                mensaje=entrega.comentario,
                tipo="entrega_calificada",
                origen="instructor",
            )

        aprendiz = self.db.query(Usuario).filter(Usuario.id_usuario == entrega.id_aprendiz).first()
        nombre = " ".join(filter(None, [aprendiz.nombre, aprendiz.apellido])) if aprendiz else "—"
        return {
            "id_entrega": entrega.id_entrega,
            "id_aprendiz": entrega.id_aprendiz,
            "nombre_aprendiz": nombre,
            "estado": entrega.estado,
            "archivo_url": entrega.archivo_url,
            "tipo_archivo": _tipo_archivo(entrega.archivo_url),
            "fecha_entrega": entrega.fecha_entrega,
            "nota": float(entrega.nota) if entrega.nota is not None else None,
            "comentario": entrega.comentario,
        }

    # ----------------------------------------------------------------
    # 4. Portafolios de fichas
    # ----------------------------------------------------------------
    def obtener_portafolios(self, id_instructor: int) -> List[PortafolioFichaResponse]:
        asignaciones = self._asignaciones_del_instructor(id_instructor)
        vistos: set = set()
        resultado: List[PortafolioFichaResponse] = []
        for a in asignaciones:
            if a.id_ficha in vistos:
                continue
            vistos.add(a.id_ficha)
            ficha = self.db.query(Ficha).filter(Ficha.id_ficha == a.id_ficha).first()
            competencia = (
                self.db.query(Competencia).filter(Competencia.id_competencia == a.id_competencia).first()
            )
            programa = self.db.query(Programa).filter(Programa.id_ficha == a.id_ficha).first()
            resultado.append(
                PortafolioFichaResponse(
                    id_ficha=a.id_ficha,
                    numero_ficha=str(ficha.id_ficha) if ficha else None,
                    nombre_programa=programa.nombre if programa else None,
                    nombre_competencia=competencia.nombre if competencia else None,
                    trimestre=a.trimestre,
                    num_aprendices=self._contar_aprendices_en_ficha(a.id_ficha),
                )
            )
        return resultado

    # ----------------------------------------------------------------
    # 5. Aprendices de una ficha
    # ----------------------------------------------------------------
    def obtener_aprendices_ficha(self, id_instructor: int, id_ficha: int) -> List[dict]:
        self._verificar_acceso_ficha(id_instructor, id_ficha)

        aprendices = (
            self.db.query(Usuario)
            .join(Rol, Usuario.id_rol == Rol.id_rol)
            .filter(Usuario.id_ficha == id_ficha, Rol.nombre_rol.ilike(NOMBRE_ROL_APRENDIZ))
            .order_by(Usuario.nombre)
            .all()
        )

        resultado = []
        for aprendiz in aprendices:
            tiene_entrega_con_archivo = (
                self.db.query(Entrega)
                .filter(Entrega.id_aprendiz == aprendiz.id_usuario, Entrega.archivo_url.isnot(None))
                .first()
                is not None
            )
            resultado.append(
                {
                    "id_usuario": aprendiz.id_usuario,
                    "nombre_completo": " ".join(filter(None, [aprendiz.nombre, aprendiz.apellido])),
                    "numero_documento": aprendiz.numero_documento,
                    "estado_portafolio": "con_portafolio" if tiene_entrega_con_archivo else "sin_portafolio",
                }
            )
        return resultado

    # ----------------------------------------------------------------
    # 5b. Portafolio de UN aprendiz puntual (Competencia > Actividades).
    # Se llega aquí al dar clic sobre un aprendiz --ya sea desde la lista
    # de entregas de una tarea o desde la lista de aprendices de una
    # ficha--: agrupa, por cada Competencia que el instructor autenticado
    # dicta en esta ficha, todas las Tareas de esa competencia y el estado
    # de la Entrega de ESE aprendiz en cada una.
    # ----------------------------------------------------------------
    def obtener_portafolio_aprendiz(self, id_instructor: int, id_ficha: int, id_aprendiz: int) -> dict:
        self._verificar_acceso_ficha(id_instructor, id_ficha)

        ficha = self.db.query(Ficha).filter(Ficha.id_ficha == id_ficha).first()
        if not ficha:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ficha no encontrada.")

        aprendiz = (
            self.db.query(Usuario)
            .join(Rol, Usuario.id_rol == Rol.id_rol)
            .filter(
                Usuario.id_usuario == id_aprendiz,
                Usuario.id_ficha == id_ficha,
                Rol.nombre_rol.ilike(NOMBRE_ROL_APRENDIZ),
            )
            .first()
        )
        if not aprendiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El aprendiz no existe o no pertenece a esta ficha.",
            )

        asignaciones = (
            self.db.query(AsignacionInstructor)
            .filter(
                AsignacionInstructor.id_instructor == id_instructor,
                AsignacionInstructor.id_ficha == id_ficha,
            )
            .all()
        )

        competencias_out: List[dict] = []
        for asignacion in asignaciones:
            competencia = (
                self.db.query(Competencia)
                .filter(Competencia.id_competencia == asignacion.id_competencia)
                .first()
            )
            tareas = (
                self.db.query(Tarea)
                .filter(
                    Tarea.id_ficha == id_ficha,
                    Tarea.id_competencia == asignacion.id_competencia,
                    Tarea.id_instructor == id_instructor,
                )
                .order_by(Tarea.fecha_creacion.desc())
                .all()
            )

            actividades = []
            for tarea in tareas:
                entrega = (
                    self.db.query(Entrega)
                    .filter(Entrega.id_tarea == tarea.id_tarea, Entrega.id_aprendiz == id_aprendiz)
                    .first()
                )
                actividades.append(
                    {
                        "id_tarea": tarea.id_tarea,
                        "titulo": tarea.titulo,
                        "descripcion": tarea.descripcion,
                        "fecha_limite": tarea.fecha_limite,
                        "id_entrega": entrega.id_entrega if entrega else None,
                        "estado": entrega.estado if entrega else None,
                        "archivo_url": entrega.archivo_url if entrega else None,
                        "tipo_archivo": _tipo_archivo(entrega.archivo_url) if entrega else None,
                        "fecha_entrega": entrega.fecha_entrega if entrega else None,
                        "nota": float(entrega.nota) if entrega and entrega.nota is not None else None,
                        "comentario": entrega.comentario if entrega else None,
                    }
                )

            competencias_out.append(
                {
                    "id_competencia": asignacion.id_competencia,
                    "nombre_competencia": competencia.nombre if competencia else "Materia",
                    "actividades": actividades,
                }
            )

        return {
            "id_usuario": aprendiz.id_usuario,
            "nombre_completo": " ".join(filter(None, [aprendiz.nombre, aprendiz.apellido])),
            "numero_documento": aprendiz.numero_documento,
            "id_ficha": id_ficha,
            "numero_ficha": str(ficha.id_ficha),
            "competencias": competencias_out,
        }

    def crear_aprendiz(self, id_instructor: int, id_ficha: int, data: AprendizCreate) -> dict:
        self._verificar_acceso_ficha(id_instructor, id_ficha)

        rol_aprendiz = self._rol_aprendiz()

        existe_doc = self.db.query(Usuario).filter(Usuario.numero_documento == data.numero_documento).first()
        if existe_doc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un usuario con ese número de documento.",
            )

        contrasena_temporal = data.contrasena or secrets.token_urlsafe(6)

        nuevo_aprendiz = Usuario(
            nombre=data.nombre,
            apellido=data.apellido,
            id_rol=rol_aprendiz.id_rol,
            fecha_nacimiento=data.fecha_nacimiento,
            numero_documento=data.numero_documento,
            tipo_documento=data.tipo_documento,
            correo_personal=data.correo_personal,
            correo_sena=data.correo_sena,
            contrasena=hash_password(contrasena_temporal),
            id_ficha=id_ficha,
            informacion_adicional=data.informacion_adicional,
        )
        self.db.add(nuevo_aprendiz)
        self.db.commit()
        self.db.refresh(nuevo_aprendiz)

        return {
            "id_usuario": nuevo_aprendiz.id_usuario,
            "nombre": nuevo_aprendiz.nombre,
            "apellido": nuevo_aprendiz.apellido,
            "numero_documento": nuevo_aprendiz.numero_documento,
            "correo_sena": nuevo_aprendiz.correo_sena,
            "contrasena_temporal": None if data.contrasena else contrasena_temporal,
        }

    # ----------------------------------------------------------------
    # 6. Asignaciones (gestión de coordinador)
    # ----------------------------------------------------------------
    def crear_asignacion(self, data: AsignacionCreate) -> AsignacionInstructor:
        instructor = self.db.query(Usuario).filter(Usuario.id_usuario == data.id_instructor).first()
        if not instructor or (instructor.rol.nombre_rol or "").strip().lower() != "instructor":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="id_instructor no corresponde a un usuario con rol instructor.",
            )
        if not self.db.query(Ficha).filter(Ficha.id_ficha == data.id_ficha).first():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La ficha indicada no existe.")
        if not self.db.query(Competencia).filter(Competencia.id_competencia == data.id_competencia).first():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La competencia indicada no existe.")

        existente = (
            self.db.query(AsignacionInstructor)
            .filter(
                AsignacionInstructor.id_instructor == data.id_instructor,
                AsignacionInstructor.id_ficha == data.id_ficha,
                AsignacionInstructor.id_competencia == data.id_competencia,
                AsignacionInstructor.trimestre == data.trimestre,
            )
            .first()
        )
        if existente:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Esa asignación ya existe.")

        nueva = AsignacionInstructor(**data.model_dump())
        self.db.add(nueva)
        self.db.commit()
        self.db.refresh(nueva)
        return nueva

    def listar_asignaciones(self) -> List[AsignacionInstructor]:
        return self.db.query(AsignacionInstructor).all()

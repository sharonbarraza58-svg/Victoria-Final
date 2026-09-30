"""
Lógica de negocio del módulo de coordinador (visión de la antigua carpeta
"coordinación", adaptada al esquema unificado).

El coordinador tiene visibilidad de SOLO LECTURA sobre TODOS los
instructores y TODAS las sedes -- por eso estos métodos no filtran por el
id del coordinador autenticado. El filtro de rol ("solo alguien con rol
coordinador entra aquí") ya lo hace require_coordinador en cada endpoint
(routes/coordinador.py). La gestión (crear/editar/borrar fichas,
programas, usuarios, sedes...) vive en los routers de cada dominio
(routes/ficha.py, routes/sede.py, etc.), también protegidos con
require_coordinador -- así no se duplica lógica de escritura aquí.

Sobre "director de ficha": a diferencia de la versión original (que lo
aproximaba como el primer instructor asignado, por no existir un campo
real), este esquema unificado SÍ tiene Ficha.id_director explícito
(heredado de victoria-admin-completo). Se usa ese campo cuando está
definido; si una ficha todavía no tiene director asignado, se cae de
vuelta a la aproximación por asignación más antigua.
"""
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.asignacion_instructor import AsignacionInstructor
from models.competencia import Competencia
from models.ficha import Ficha
from models.rol import Rol
from models.sede import Sede
from models.tarea import Tarea
from models.usuario import Usuario

NOMBRE_ROL_INSTRUCTOR = "instructor"
NOMBRE_ROL_APRENDIZ = "aprendiz"


class CoordinadorService:
    def __init__(self, db: Session):
        self.db = db

    # ------------------------------------------------------------
    # 1. Dashboard
    # ------------------------------------------------------------
    def obtener_dashboard(self) -> dict:
        total_fichas = self.db.query(Ficha).count()

        fichas = self.db.query(Ficha).order_by(Ficha.fecha_inicio.desc()).limit(5).all()
        fichas_recientes = [self._armar_ficha_resumen(f) for f in fichas]
        principal = fichas_recientes[0] if fichas_recientes else None

        ultima_asignacion = (
            self.db.query(AsignacionInstructor)
            .order_by(AsignacionInstructor.fecha_creacion.desc())
            .first()
        )

        return {
            "nombre_programa_principal": principal["nombre_programa"] if principal else None,
            "numero_ficha_principal": principal["numero_ficha"] if principal else None,
            "trimestre_actual": ultima_asignacion.trimestre if ultima_asignacion else None,
            "nombre_director_ficha": principal["nombre_director_ficha"] if principal else None,
            "total_fichas": total_fichas,
            "fichas_recientes": fichas_recientes,
        }

    def _nombre_director_de_ficha(self, ficha: Ficha) -> Optional[str]:
        if ficha.director:
            return " ".join(filter(None, [ficha.director.nombre, ficha.director.apellido]))

        # Sin director explícito: se aproxima con la asignación más antigua
        # sobre esa ficha (mismo criterio que usaba el módulo original).
        primera_asignacion = (
            self.db.query(AsignacionInstructor)
            .filter(AsignacionInstructor.id_ficha == ficha.id_ficha)
            .order_by(AsignacionInstructor.fecha_creacion.asc())
            .first()
        )
        if not primera_asignacion:
            return None
        instructor = (
            self.db.query(Usuario).filter(Usuario.id_usuario == primera_asignacion.id_instructor).first()
        )
        return " ".join(filter(None, [instructor.nombre, instructor.apellido])) if instructor else None

    def _armar_ficha_resumen(self, ficha: Ficha) -> dict:
        num_estudiantes = (
            self.db.query(Usuario)
            .join(Rol, Usuario.id_rol == Rol.id_rol)
            .filter(Usuario.id_ficha == ficha.id_ficha, Rol.nombre_rol.ilike(NOMBRE_ROL_APRENDIZ))
            .count()
        )

        return {
            "id_ficha": ficha.id_ficha,
            # El número de ficha REAL del SENA es el propio id_ficha (ver
            # models/ficha.py): se expone como texto porque así lo espera
            # el frontend, que lo trata como una etiqueta, no un número.
            "numero_ficha": str(ficha.id_ficha),
            "nombre_programa": ficha.programa.nombre if ficha.programa else None,
            "trimestre": int(ficha.trimestre.strip("T")) if (ficha.trimestre or "").strip("T").isdigit() else None,
            "nombre_director_ficha": self._nombre_director_de_ficha(ficha),
            "num_estudiantes": num_estudiantes,
        }

    # ------------------------------------------------------------
    # 2. Sedes (solo lectura aquí; el CRUD completo vive en
    #    services/sede_service.py, usado por routes/sede.py)
    # ------------------------------------------------------------
    def obtener_sedes(self) -> List[Sede]:
        return self.db.query(Sede).order_by(Sede.nombre.asc()).all()

    def obtener_sede_por_id(self, id_sede: int) -> Sede:
        sede = self.db.query(Sede).filter(Sede.id_sede == id_sede).first()
        if not sede:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sede no encontrada.")
        return sede

    # ------------------------------------------------------------
    # 3. Instructores
    # ------------------------------------------------------------
    def obtener_instructores_sede(self, id_sede: int, tipo: Optional[str] = None) -> List[dict]:
        self.obtener_sede_por_id(id_sede)  # 404 si la sede no existe

        query = (
            self.db.query(Usuario)
            .join(Rol, Usuario.id_rol == Rol.id_rol)
            .filter(Usuario.id_sede == id_sede, Rol.nombre_rol.ilike(NOMBRE_ROL_INSTRUCTOR))
        )
        if tipo:
            query = query.filter(Usuario.tipo_instructor == tipo)

        return [self._armar_instructor_resumen(i) for i in query.order_by(Usuario.nombre.asc()).all()]

    def _armar_instructor_resumen(self, instructor: Usuario) -> dict:
        return {
            "id_usuario": instructor.id_usuario,
            "nombre_completo": " ".join(filter(None, [instructor.nombre, instructor.apellido])),
            # Instructores creados antes de que existiera esta columna no
            # tienen tipo_instructor -- se muestran como "planta" por
            # defecto en vez de romper el schema con None.
            "tipo_instructor": instructor.tipo_instructor or "planta",
            "numero_documento": instructor.numero_documento,
        }

    def obtener_instructor_detalle(self, id_instructor: int) -> dict:
        instructor = self._obtener_instructor_o_404(id_instructor)
        ficha = instructor.ficha  # "ficha principal" del instructor (Usuario.id_ficha)

        return {
            **self._armar_instructor_resumen(instructor),
            "especialidad": instructor.especialidad,
            "tipo_contrato": instructor.tipo_contrato,
            "vigencia_contrato": instructor.vigencia_contrato,
            "numero_ficha": str(ficha.id_ficha) if ficha else None,
            "horario_ficha": ficha.horario if ficha else None,
            "correo_sena": instructor.correo_sena,
            "telefono": instructor.telefono,
            "hoja_vida_url": instructor.hoja_vida_url,
        }

    # ------------------------------------------------------------
    # 4. Portafolio de un instructor (solo lectura)
    # ------------------------------------------------------------
    def obtener_portafolio_instructor(self, id_instructor: int) -> dict:
        instructor = self._obtener_instructor_o_404(id_instructor)

        if instructor.tipo_instructor == "transversal":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Los instructores transversales no tienen portafolio de competencias.",
            )

        asignaciones = (
            self.db.query(AsignacionInstructor)
            .filter(AsignacionInstructor.id_instructor == id_instructor)
            .all()
        )

        por_trimestre: dict = {}
        for asignacion in asignaciones:
            por_trimestre.setdefault(asignacion.trimestre, []).append(asignacion)

        trimestres_out = []
        for trimestre in sorted(por_trimestre.keys()):
            competencias_out = []
            evidencias_trimestre = 0
            vistas = set()  # evita repetir la materia si se dicta en 2 fichas del mismo trimestre
            for asignacion in por_trimestre[trimestre]:
                if asignacion.id_competencia in vistas:
                    continue
                vistas.add(asignacion.id_competencia)

                competencia = (
                    self.db.query(Competencia)
                    .filter(Competencia.id_competencia == asignacion.id_competencia)
                    .first()
                )
                num_archivos = (
                    self.db.query(Tarea)
                    .filter(
                        Tarea.id_instructor == id_instructor,
                        Tarea.id_competencia == asignacion.id_competencia,
                        Tarea.archivo_url.isnot(None),
                    )
                    .count()
                )
                evidencias_trimestre += num_archivos
                competencias_out.append(
                    {
                        "id_competencia": asignacion.id_competencia,
                        "nombre": competencia.nombre if competencia else "Materia",
                        "archivos": num_archivos,
                    }
                )

            trimestres_out.append(
                {"trimestre": trimestre, "evidencias": evidencias_trimestre, "competencias": competencias_out}
            )

        return {
            "id_usuario": instructor.id_usuario,
            "nombre_completo": " ".join(filter(None, [instructor.nombre, instructor.apellido])),
            "tipo_instructor": instructor.tipo_instructor or "planta",
            "trimestres": trimestres_out,
        }

    def obtener_competencia_detalle(self, id_instructor: int, trimestre: int, id_competencia: int) -> dict:
        self._obtener_instructor_o_404(id_instructor)

        asignacion = (
            self.db.query(AsignacionInstructor)
            .filter(
                AsignacionInstructor.id_instructor == id_instructor,
                AsignacionInstructor.trimestre == trimestre,
                AsignacionInstructor.id_competencia == id_competencia,
            )
            .first()
        )
        if not asignacion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ese instructor no dicta esta materia en ese trimestre.",
            )

        competencia = self.db.query(Competencia).filter(Competencia.id_competencia == id_competencia).first()
        if not competencia:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Materia no encontrada.")

        tareas = (
            self.db.query(Tarea)
            .filter(
                Tarea.id_instructor == id_instructor,
                Tarea.id_competencia == id_competencia,
                Tarea.archivo_url.isnot(None),
            )
            .order_by(Tarea.fecha_creacion.desc())
            .all()
        )

        return {
            "id_competencia": id_competencia,
            "nombre": competencia.nombre,
            "descripcion": competencia.descripcion,
            "trimestre": trimestre,
            "fecha_creacion": competencia.fecha_carga,
            "fecha_edicion": None,  # el modelo Competencia no guarda fecha de edición
            "archivos": [
                {"id_evidencia": t.id_tarea, "nombre_archivo": t.titulo, "url": t.archivo_url}
                for t in tareas
            ],
        }

    def _obtener_instructor_o_404(self, id_instructor: int) -> Usuario:
        instructor = (
            self.db.query(Usuario)
            .join(Rol, Usuario.id_rol == Rol.id_rol)
            .filter(Usuario.id_usuario == id_instructor, Rol.nombre_rol.ilike(NOMBRE_ROL_INSTRUCTOR))
            .first()
        )
        if not instructor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instructor no encontrado.")
        return instructor

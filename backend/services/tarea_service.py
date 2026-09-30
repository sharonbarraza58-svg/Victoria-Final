from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.tarea import Tarea
from models.entrega import Entrega
from models.competencia import Competencia
from models.usuario import Usuario
from schemas.tarea import TareaParaAprendiz, TareaProximaAprendiz, TareaDetalleParaAprendiz


class TareaService:
    def __init__(self, db: Session):
        self.db = db

    def obtener_tareas_por_competencia_para_aprendiz(self, id_competencia: int, aprendiz: Usuario):
        if not aprendiz.id_ficha:
            return []

        tareas = (
            self.db.query(Tarea)
            .filter(
                Tarea.id_competencia == id_competencia,
                Tarea.id_ficha == aprendiz.id_ficha,
            )
            .all()
        )

        resultado = []
        for tarea in tareas:
            entrega = (
                self.db.query(Entrega)
                .filter(Entrega.id_tarea == tarea.id_tarea, Entrega.id_aprendiz == aprendiz.id_usuario)
                .first()
            )
            resultado.append(
                TareaParaAprendiz(
                    id_tarea=tarea.id_tarea,
                    titulo=tarea.titulo,
                    descripcion=tarea.descripcion,
                    fecha_limite=tarea.fecha_limite,
                    archivo_url=tarea.archivo_url,
                    id_entrega=entrega.id_entrega if entrega else None,
                    estado=entrega.estado if entrega else "pendiente",
                    nota=entrega.nota if entrega else None,
                    comentario=entrega.comentario if entrega else None,
                    fecha_entrega=entrega.fecha_entrega if entrega else None,
                )
            )
        return resultado

    def obtener_proximas_para_aprendiz(self, aprendiz: Usuario, limite: int = 5):
        if not aprendiz.id_ficha:
            return []

        tareas = (
            self.db.query(Tarea)
            .filter(Tarea.id_ficha == aprendiz.id_ficha)
            .order_by(Tarea.fecha_limite.asc().nullslast())
            .all()
        )

        resultado = []
        for tarea in tareas:
            entrega = (
                self.db.query(Entrega)
                .filter(Entrega.id_tarea == tarea.id_tarea, Entrega.id_aprendiz == aprendiz.id_usuario)
                .first()
            )
            estado = entrega.estado if entrega else "pendiente"
            if estado == "aprobado":
                continue

            competencia = (
                self.db.query(Competencia)
                .filter(Competencia.id_competencia == tarea.id_competencia)
                .first()
            )
            if not competencia:
                continue

            resultado.append(
                TareaProximaAprendiz(
                    id_tarea=tarea.id_tarea,
                    titulo=tarea.titulo,
                    fecha_limite=tarea.fecha_limite,
                    estado=estado,
                    id_competencia=competencia.id_competencia,
                    nombre_competencia=competencia.nombre,
                    trimestre=competencia.trimestre,
                )
            )
            if len(resultado) >= limite:
                break

        return resultado

    def obtener_detalle_para_aprendiz(self, id_tarea: int, aprendiz: Usuario) -> TareaDetalleParaAprendiz:
        """
        Detalle completo de una tarea puntual para el aprendiz logueado.
        Verifica que la tarea pertenezca a SU ficha (un aprendiz no puede
        ver el detalle de una tarea de otra ficha aunque adivine el id).
        """
        tarea = self.db.query(Tarea).filter(Tarea.id_tarea == id_tarea).first()
        if not tarea:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada.")
        if tarea.id_ficha != aprendiz.id_ficha:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Esta tarea no pertenece a tu ficha.",
            )

        instructor = self.db.query(Usuario).filter(Usuario.id_usuario == tarea.id_instructor).first()
        nombre_instructor = None
        if instructor:
            nombre_instructor = f"{instructor.nombre} {instructor.apellido or ''}".strip()

        entrega = (
            self.db.query(Entrega)
            .filter(Entrega.id_tarea == tarea.id_tarea, Entrega.id_aprendiz == aprendiz.id_usuario)
            .first()
        )

        return TareaDetalleParaAprendiz(
            id_tarea=tarea.id_tarea,
            titulo=tarea.titulo,
            descripcion=tarea.descripcion,
            fecha_limite=tarea.fecha_limite,
            fecha_creacion=tarea.fecha_creacion,
            nombre_instructor=nombre_instructor,
            archivos_referencia=tarea.archivos,
            id_entrega=entrega.id_entrega if entrega else None,
            estado=entrega.estado if entrega else "pendiente",
            nota=entrega.nota if entrega else None,
            comentario=entrega.comentario if entrega else None,
            fecha_entrega=entrega.fecha_entrega if entrega else None,
            archivos_entrega=entrega.archivos if entrega else [],
        )
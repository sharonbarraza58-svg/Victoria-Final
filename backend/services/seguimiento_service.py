from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from models.tarea import Tarea
from models.competencia import Competencia
from models.entrega import Entrega
from models.usuario import Usuario
from schemas.seguimiento import ResumenTrimestre, MateriaSeguimiento, NotaTarea, DetalleMateria

TRIMESTRES = ["T1", "T2", "T3", "T4"]
UMBRAL_APROBADO = 8.0  # escala 0.0 a 10.0


class SeguimientoService:
    def __init__(self, db: Session):
        self.db = db

    def _requerir_ficha(self, aprendiz: Usuario) -> int:
        if not aprendiz.id_ficha:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No estás inscrito en una ficha todavía.",
            )
        return aprendiz.id_ficha

    def _competencias_del_trimestre(self, id_ficha: int, trimestre: str) -> list[Competencia]:
        # Solo cuenta competencias que tengan al menos una tarea asignada
        # a la ficha del aprendiz.
        return (
            self.db.query(Competencia)
            .join(Tarea, Tarea.id_competencia == Competencia.id_competencia)
            .filter(Tarea.id_ficha == id_ficha, Competencia.trimestre == trimestre)
            .distinct()
            .all()
        )

    def obtener_resumen(self, aprendiz: Usuario) -> list[ResumenTrimestre]:
        id_ficha = self._requerir_ficha(aprendiz)
        resultado = []
        for trimestre in TRIMESTRES:
            competencias = self._competencias_del_trimestre(id_ficha, trimestre)
            ids_competencia = [c.id_competencia for c in competencias]
            evidencias = 0
            if ids_competencia:
                evidencias = (
                    self.db.query(Entrega)
                    .join(Tarea, Tarea.id_tarea == Entrega.id_tarea)
                    .filter(
                        Entrega.id_aprendiz == aprendiz.id_usuario,
                        Entrega.archivo_url.isnot(None),
                        Tarea.id_ficha == id_ficha,
                        Tarea.id_competencia.in_(ids_competencia),
                    )
                    .count()
                )
            resultado.append(
                ResumenTrimestre(
                    trimestre=trimestre,
                    numero=trimestre[1],
                    competencias=len(competencias),
                    evidencias=evidencias,
                )
            )
        return resultado

    def obtener_materias(self, trimestre: str, aprendiz: Usuario) -> list[MateriaSeguimiento]:
        id_ficha = self._requerir_ficha(aprendiz)
        competencias = self._competencias_del_trimestre(id_ficha, trimestre)
        resultado = []
        for competencia in competencias:
            total_archivos = (
                self.db.query(Entrega)
                .join(Tarea, Tarea.id_tarea == Entrega.id_tarea)
                .filter(
                    Entrega.id_aprendiz == aprendiz.id_usuario,
                    Entrega.archivo_url.isnot(None),
                    Tarea.id_ficha == id_ficha,
                    Tarea.id_competencia == competencia.id_competencia,
                )
                .count()
            )
            resultado.append(
                MateriaSeguimiento(
                    id_competencia=competencia.id_competencia,
                    nombre=competencia.nombre,
                    total_archivos=total_archivos,
                )
            )
        return resultado

    def obtener_notas_materia(
        self, trimestre: str, id_competencia: int, aprendiz: Usuario
    ) -> DetalleMateria:
        id_ficha = self._requerir_ficha(aprendiz)
        competencia = (
            self.db.query(Competencia)
            .filter(Competencia.id_competencia == id_competencia, Competencia.trimestre == trimestre)
            .first()
        )
        if not competencia:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Esa materia no existe.")

        tareas = (
            self.db.query(Tarea)
            .filter(Tarea.id_ficha == id_ficha, Tarea.id_competencia == id_competencia)
            .order_by(Tarea.fecha_creacion.asc())
            .all()
        )

        resultado_tareas = []
        notas_validas = []
        for tarea in tareas:
            entrega = (
                self.db.query(Entrega)
                .filter(Entrega.id_tarea == tarea.id_tarea, Entrega.id_aprendiz == aprendiz.id_usuario)
                .first()
            )
            nota_valor = float(entrega.nota) if entrega and entrega.nota is not None else None
            if nota_valor is not None:
                notas_validas.append(nota_valor)
            resultado_tareas.append(
                NotaTarea(
                    id_tarea=tarea.id_tarea,
                    titulo=tarea.titulo,
                    descripcion=tarea.descripcion,
                    estado=entrega.estado if entrega else "pendiente",
                    nota=nota_valor,
                    comentario=entrega.comentario if entrega else None,
                    tiene_archivo=bool(entrega and entrega.archivo_url),
                    fecha=(entrega.fecha_actualizacion if entrega else None),
                )
            )

        promedio = round(sum(notas_validas) / len(notas_validas), 1) if notas_validas else None
        if promedio is None:
            estado_promedio = "Sin calificar"
        elif promedio > UMBRAL_APROBADO:
            estado_promedio = "Aprobado"
        else:
            estado_promedio = "En proceso"

        return DetalleMateria(
            id_competencia=competencia.id_competencia,
            nombre=competencia.nombre,
            trimestre=trimestre,
            numero=trimestre[1],
            promedio=promedio,
            estado_promedio=estado_promedio,
            tareas=resultado_tareas,
        )
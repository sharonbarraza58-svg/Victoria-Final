"""
Lógica de negocio de las notificaciones. Cualquier otro service puede
llamar a `NotificacionService(db).crear(...)` para avisarle a un usuario
puntual (ej. cuando un instructor califica una entrega, se le notifica al
aprendiz dueño de esa entrega) sin tener que reimplementar el INSERT cada
vez -- un solo lugar concentra esta lógica.
"""
from typing import List, Optional

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from models.notificacion import Notificacion


class NotificacionService:
    def __init__(self, db: Session):
        self.db = db

    def crear(
        self,
        id_usuario: int,
        titulo_notificacion: str,
        mensaje: Optional[str] = None,
        tipo: str = "manual",
        origen: str = "sistema",
    ) -> Notificacion:
        nueva = Notificacion(
            id_usuario=id_usuario,
            titulo_notificacion=titulo_notificacion,
            mensaje=mensaje,
            tipo=tipo,
            origen=origen,
        )
        self.db.add(nueva)
        self.db.commit()
        self.db.refresh(nueva)
        return nueva

    def obtener_de_usuario(self, id_usuario: int) -> List[Notificacion]:
        return (
            self.db.query(Notificacion)
            .filter(Notificacion.id_usuario == id_usuario)
            .order_by(Notificacion.fecha_creacion.desc())
            .all()
        )

    def marcar_leida(self, id_notificacion: int, id_usuario: int) -> Notificacion:
        notificacion = (
            self.db.query(Notificacion)
            .filter(Notificacion.id_notificacion == id_notificacion, Notificacion.id_usuario == id_usuario)
            .first()
        )
        if not notificacion:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notificación no encontrada.")
        notificacion.estado = "leida"
        self.db.commit()
        self.db.refresh(notificacion)
        return notificacion

    def eliminar(self, id_notificacion: int, id_usuario: int) -> dict:
        notificacion = (
            self.db.query(Notificacion)
            .filter(Notificacion.id_notificacion == id_notificacion, Notificacion.id_usuario == id_usuario)
            .first()
        )
        if not notificacion:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notificación no encontrada.")
        self.db.delete(notificacion)
        self.db.commit()
        return {"mensaje": "Notificación eliminada."}

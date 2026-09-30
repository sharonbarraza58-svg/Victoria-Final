from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class NotificacionResponse(BaseModel):
    id_notificacion: int
    titulo_notificacion: str
    tipo: str
    mensaje: Optional[str] = None
    origen: str
    estado: str
    fecha_creacion: datetime

    class Config:
        from_attributes = True

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from models.nota import Nota
from schemas.nota import NotaCreate


class NotaService:
    def __init__(self, db: Session):
        self.db = db

    def crear_nota(self, data_in: NotaCreate, id_usuario: int):
        nueva_nota = Nota(**data_in.model_dump(), id_usuario=id_usuario)
        self.db.add(nueva_nota)
        self.db.commit()
        self.db.refresh(nueva_nota)
        return nueva_nota

    def obtener_notas_de_usuario(self, id_usuario: int):
        return (
            self.db.query(Nota)
            .filter(Nota.id_usuario == id_usuario)
            .order_by(Nota.fecha_creacion.desc())
            .all()
        )

    def obtener_nota_por_id(self, id_nota: int, id_usuario: int):
        nota = (
            self.db.query(Nota)
            .filter(Nota.id_nota == id_nota, Nota.id_usuario == id_usuario)
            .first()
        )
        if not nota:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nota no encontrada.")
        return nota

    def eliminar_nota(self, id_nota: int, id_usuario: int):
        nota = self.obtener_nota_por_id(id_nota, id_usuario)
        self.db.delete(nota)
        self.db.commit()
        return {"mensaje": "Nota eliminada exitosamente."}

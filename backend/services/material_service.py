from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.materiales import Material
from schemas.materiales import MaterialCreate


class MaterialService:
    def __init__(self, db: Session):
        self.db = db

    def crear_material(self, data_in: MaterialCreate):
        nuevo_material = Material(**data_in.model_dump())
        self.db.add(nuevo_material)
        self.db.commit()
        self.db.refresh(nuevo_material)
        return nuevo_material

    def obtener_materiales(self):
        return self.db.query(Material).all()

    def obtener_material_por_id(self, id_material: int):
        material = self.db.query(Material).filter(Material.id_material == id_material).first()
        if not material:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material no encontrado.")
        return material

    def actualizar_material(self, id_material: int, data_in: MaterialCreate):
        material_actual = self.obtener_material_por_id(id_material)
        material_actual.nombre_material = data_in.nombre_material
        material_actual.tipo_material = data_in.tipo_material
        material_actual.formato_material = data_in.formato_material
        material_actual.url_material = data_in.url_material
        material_actual.cantidad = data_in.cantidad
        material_actual.estado = data_in.estado
        self.db.commit()
        self.db.refresh(material_actual)
        return material_actual

    def eliminar_material(self, id_material: int):
        material = self.obtener_material_por_id(id_material)
        self.db.delete(material)
        self.db.commit()
        return {"mensaje": "Material eliminado exitosamente."}

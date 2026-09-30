from sqlalchemy import text

from db.database import engine

# Muestra a qué base de datos se está conectando, para confirmar que es la correcta
print(f"Conectando a: {engine.url.host} / base de datos: {engine.url.database}")

with engine.begin() as conexion:
    conexion.execute(
        text("ALTER TABLE archivo_portafolio ADD COLUMN IF NOT EXISTS subcarpeta VARCHAR(20)")
    )
    total = conexion.execute(text("SELECT COUNT(*) FROM archivo_portafolio")).scalar()

print(f"Listo: columna 'subcarpeta' agregada. Filas existentes en archivo_portafolio: {total}")
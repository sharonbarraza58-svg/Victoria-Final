from sqlalchemy import text

from db.database import engine

print(f"Conectando a: {engine.url.host} / base de datos: {engine.url.database}")

with engine.begin() as conexion:
    conexion.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS carpeta_portafolio (
                id_carpeta SERIAL PRIMARY KEY,
                categoria VARCHAR(50) NOT NULL,
                subcarpeta VARCHAR(20) NOT NULL,
                nombre VARCHAR(100) NOT NULL,
                id_aprendiz INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
                fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
                CONSTRAINT uq_carpeta_portafolio_nombre
                    UNIQUE (id_aprendiz, categoria, subcarpeta, nombre)
            )
            """
        )
    )
    conexion.execute(
        text(
            """
            ALTER TABLE archivo_portafolio
            ADD COLUMN IF NOT EXISTS id_carpeta INTEGER
            REFERENCES carpeta_portafolio(id_carpeta) ON DELETE CASCADE
            """
        )
    )
    total = conexion.execute(text("SELECT COUNT(*) FROM archivo_portafolio")).scalar()

print(f"Listo: tabla 'carpeta_portafolio' creada y columna 'id_carpeta' agregada. Filas en archivo_portafolio: {total}")
-- ============================================================================
--  VICTORIA-FINAL -- Script único de base de datos (PostgreSQL)
-- ============================================================================
--  Este es el ÚNICO script de base de datos del proyecto. Reemplaza a los
--  tres que traía cada carpeta por separado (victoria-admin-completo,
--  coordinación e instructor) y refleja EXACTAMENTE los modelos de
--  SQLAlchemy en backend/models/ -- ambos deben mantenerse sincronizados
--  a mano si el esquema cambia en el futuro.
--
--  Los mismos modelos ya son capaces de crear este esquema solos, al
--  arrancar la API, con Base.metadata.create_all(bind=engine) (ver
--  backend/main.py). Este archivo existe para:
--    1) Crear la base de datos de un vistazo, sin tener que levantar la
--       API primero (útil para revisarla en pgAdmin/DBeaver o para un
--       entorno donde otra persona solo necesita la base de datos).
--    2) Documentar el modelo de datos completo en un solo lugar legible.
--    3) Sembrar los 3 roles base, sin los que la API no deja iniciar
--       sesión ni registrar usuarios.
--
--  Solo hay 3 roles en todo el sistema: coordinador (fusiona lo que antes
--  eran los roles separados "administrador" y "coordinador"), instructor
--  y aprendiz.
--
--  Cómo usarlo:
--      createdb victoria
--      psql -d victoria -f victoria_final_schema.sql
--
--  Después, para crear el primer coordinador (no lo hace este script, a
--  propósito: la contraseña debe quedar hasheada con el mismo algoritmo
--  que usa la API, no en texto plano), corre desde backend/:
--      python seed_roles.py
-- ============================================================================


-- ============================================================================
-- 1. TABLAS SIN DEPENDENCIAS (se crean primero)
-- ============================================================================

-- Roles del sistema. Solo existen 3 filas válidas en producción: ver el
-- INSERT al final de este archivo.
CREATE TABLE Rol (
    id_rol      SERIAL PRIMARY KEY,
    nombre_rol  VARCHAR(50) NOT NULL UNIQUE
);

-- Sede física del SENA donde trabajan los instructores.
CREATE TABLE Sede (
    id_sede               SERIAL PRIMARY KEY,
    nombre                VARCHAR(120) NOT NULL,
    descripcion           VARCHAR(300),
    direccion_principal   VARCHAR(200),
    telefono_atencion     VARCHAR(20),
    horario_atencion      VARCHAR(100)
);

-- Coordinación académica (ej. "Coordinación de TIC").
CREATE TABLE Coordinacion (
    id_coordinacion         SERIAL PRIMARY KEY,
    nombre_coordinacion     VARCHAR(120) NOT NULL,
    descripcion_coordinacion VARCHAR(300) NOT NULL,
    area_enfoque            VARCHAR(20) NOT NULL
);

-- Proyecto formativo transversal a uno o varios programas.
CREATE TABLE Proyecto (
    id_proyecto      SERIAL PRIMARY KEY,
    nombre_proyecto  VARCHAR(120) NOT NULL,
    descripcion      VARCHAR(300) NOT NULL,
    fecha_inicio     DATE NOT NULL,
    fecha_fin        DATE NOT NULL,
    url_proyecto     VARCHAR(200) NOT NULL
);

-- Competencia / "materia" que dicta un instructor (ej. "Programación Web").
CREATE TABLE Competencia (
    id_competencia   SERIAL PRIMARY KEY,
    nombre           VARCHAR(120) NOT NULL,
    descripcion      VARCHAR(300),
    trimestre        VARCHAR(2) NOT NULL,   -- 'T1' | 'T2' | 'T3' | 'T4'
    fecha_carga      TIMESTAMP NOT NULL
);

-- Material educativo (documentos, videos, guías...).
CREATE TABLE Material (
    id_material       SERIAL PRIMARY KEY,
    nombre_material   VARCHAR(120) NOT NULL,
    tipo_material     VARCHAR(20) NOT NULL,
    formato_material  VARCHAR(10) NOT NULL,
    url_material      VARCHAR(200) NOT NULL,
    cantidad          INTEGER NOT NULL,
    estado            VARCHAR(20) NOT NULL
);


-- ============================================================================
-- 2. FICHA
-- ============================================================================
-- El número de ficha es el número REAL del SENA (ej. 3000045), escrito por
-- el coordinador -- NO es un id autoincremental interno, es la llave
-- primaria en sí misma. id_programa e id_director se agregan más abajo con
-- ALTER TABLE porque tienen una dependencia circular real con 'programa' y
-- 'usuario' respectivamente (cada una de esas tablas también referencia a
-- 'ficha'): Postgres no puede crear las tres al mismo tiempo con FKs
-- resueltas de una, así que primero se crean las columnas sin la
-- restricción y la restricción se añade después, cuando las tres tablas ya
-- existen. Es exactamente lo mismo que hace SQLAlchemy con use_alter=True
-- en backend/models/ficha.py.
CREATE TABLE Ficha (
    id_ficha       INTEGER PRIMARY KEY,          -- Número de ficha del SENA, sin autoincrementar
    estado         VARCHAR(10) NOT NULL,
    fecha_inicio   TIMESTAMP NOT NULL,
    fecha_fin      TIMESTAMP NOT NULL,
    trimestre      VARCHAR(2),                   -- 'T1' | 'T2' | 'T3' | 'T4'
    horario        VARCHAR(100),                 -- ej. "Diurna, Lun-Vie 7am-1pm"
    id_programa    INTEGER,                      -- FK añadida más abajo
    id_director    INTEGER                       -- FK añadida más abajo (instructor "director de ficha")
);


-- ============================================================================
-- 3. PROGRAMA (depende de Coordinacion, Ficha, Proyecto, Competencia)
-- ============================================================================
CREATE TABLE Programa (
    id_programa       SERIAL PRIMARY KEY,
    nombre            VARCHAR(120) NOT NULL,
    nivel_formacion   VARCHAR(20),
    descripcion       VARCHAR(300),
    url_programa      VARCHAR(200) NOT NULL,
    id_coordinacion   INTEGER NOT NULL REFERENCES Coordinacion(id_coordinacion),
    id_ficha          INTEGER REFERENCES Ficha(id_ficha),
    id_proyecto       INTEGER REFERENCES Proyecto(id_proyecto),
    id_competencia    INTEGER REFERENCES Competencia(id_competencia)
);


-- ============================================================================
-- 4. USUARIO (depende de Rol, Ficha, Coordinacion, Sede)
-- ============================================================================
-- Una sola tabla para los 3 roles: coordinador, instructor y aprendiz --
-- el rol lo determina id_rol (FK a Rol), no una tabla distinta por rol.
-- Reúne los campos base + seguridad de login (bloqueo por intentos
-- fallidos, recuperación por código) + los campos de perfil que solo
-- aplican si el usuario es instructor (id_sede, tipo_instructor,
-- especialidad, tipo_contrato, vigencia_contrato, hoja_vida_url); todos
-- esos quedan NULL para coordinadores y aprendices.
CREATE TABLE Usuario (
    id_usuario           SERIAL PRIMARY KEY,
    nombre               VARCHAR(100) NOT NULL,
    apellido             VARCHAR(100),
    id_rol               INTEGER NOT NULL REFERENCES Rol(id_rol),

    fecha_creacion       TIMESTAMP DEFAULT NOW(),
    estado               VARCHAR(50) DEFAULT 'activo',
    fecha_nacimiento     DATE NOT NULL,
    numero_documento     VARCHAR(20) NOT NULL UNIQUE,
    tipo_documento       VARCHAR(20) NOT NULL,
    telefono             VARCHAR(20),
    correo_personal      VARCHAR(100) NOT NULL UNIQUE,
    correo_sena          VARCHAR(100) NOT NULL UNIQUE,
    contrasena           VARCHAR(255) NOT NULL,   -- Hash PBKDF2, nunca la clave plana

    -- Seguridad de login
    intentos_fallidos    INTEGER NOT NULL DEFAULT 0,
    bloqueado_hasta      TIMESTAMPTZ,
    reset_code           VARCHAR(6),
    reset_code_expira    TIMESTAMPTZ,

    -- Relación académica / de coordinación
    id_ficha             INTEGER REFERENCES Ficha(id_ficha) ON DELETE SET NULL,
    id_coordinacion      INTEGER REFERENCES Coordinacion(id_coordinacion) ON DELETE SET NULL,

    -- Perfil exclusivo de INSTRUCTOR (NULL para coordinador/aprendiz)
    id_sede              INTEGER REFERENCES Sede(id_sede) ON DELETE SET NULL,
    tipo_instructor      VARCHAR(20),             -- 'planta' | 'tecnico' | 'transversal' | 'contratista'
    especialidad         VARCHAR(150),
    tipo_contrato        VARCHAR(50),
    vigencia_contrato    DATE,
    hoja_vida_url        VARCHAR(300),

    -- Nota libre que deja un instructor al registrar un aprendiz
    informacion_adicional VARCHAR(500)
);


-- ============================================================================
-- 5. Se cierran las dos referencias circulares de Ficha, ahora que
--    Programa y Usuario ya existen.
-- ============================================================================
ALTER TABLE Ficha
    ADD CONSTRAINT fk_ficha_programa
    FOREIGN KEY (id_programa) REFERENCES Programa(id_programa) ON DELETE SET NULL;

ALTER TABLE Ficha
    ADD CONSTRAINT fk_ficha_director
    FOREIGN KEY (id_director) REFERENCES Usuario(id_usuario) ON DELETE SET NULL;


-- ============================================================================
-- 6. TAREA / ENTREGA -- ciclo de trabajo instructor <-> aprendiz
-- ============================================================================
-- Reemplaza y unifica lo que antes eran conceptos separados y
-- superpuestos entre las 3 carpetas originales (Evidencia +
-- ActividadCompetencia del admin; Entregable + Evidencia + Seguimiento del
-- fork de instructor). Una Tarea la crea un instructor para una
-- ficha+competencia puntual; cada aprendiz de esa ficha recibe
-- automáticamente una Entrega en estado 'pendiente' (la crea la API, ver
-- backend/services/instructor_service.py), donde luego sube su archivo y
-- el instructor la califica.
CREATE TABLE Tarea (
    id_tarea        SERIAL PRIMARY KEY,
    titulo          VARCHAR(150) NOT NULL,
    descripcion     TEXT,
    fecha_limite    DATE,
    archivo_url     VARCHAR(300),                 -- Adjunto de referencia (guía/plantilla)

    id_ficha        INTEGER NOT NULL REFERENCES Ficha(id_ficha) ON DELETE CASCADE,
    id_competencia  INTEGER NOT NULL REFERENCES Competencia(id_competencia) ON DELETE CASCADE,
    id_instructor   INTEGER NOT NULL REFERENCES Usuario(id_usuario) ON DELETE CASCADE,

    fecha_creacion  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE Entrega (
    id_entrega            SERIAL PRIMARY KEY,
    id_tarea              INTEGER NOT NULL REFERENCES Tarea(id_tarea) ON DELETE CASCADE,
    id_aprendiz           INTEGER NOT NULL REFERENCES Usuario(id_usuario) ON DELETE CASCADE,

    estado                VARCHAR(20) NOT NULL DEFAULT 'pendiente',  -- pendiente | en_revision | aprobado | rechazado
    archivo_url           VARCHAR(300),
    fecha_entrega         TIMESTAMPTZ,
    fecha_actualizacion   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Calificación del instructor (escala SENA 0.0 a 5.0)
    nota                  NUMERIC(3, 1),
    comentario            TEXT,

    -- Un aprendiz solo puede tener UNA entrega por tarea.
    CONSTRAINT uq_entrega_tarea_aprendiz UNIQUE (id_tarea, id_aprendiz)
);


-- ============================================================================
-- 7. ASIGNACION_INSTRUCTOR -- quién dicta qué, a quién, cuándo
-- ============================================================================
-- Qué instructor dicta qué competencia a qué ficha en qué trimestre. La
-- gestiona exclusivamente el coordinador (ver backend/routes/instructor.py,
-- endpoints POST/GET /asignaciones).
CREATE TABLE Asignacion_Instructor (
    id_asignacion   SERIAL PRIMARY KEY,
    id_instructor   INTEGER NOT NULL REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    id_ficha        INTEGER NOT NULL REFERENCES Ficha(id_ficha) ON DELETE CASCADE,
    id_competencia  INTEGER NOT NULL REFERENCES Competencia(id_competencia) ON DELETE CASCADE,
    trimestre       INTEGER NOT NULL,             -- 1 a 4
    fecha_creacion  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_asignacion_instructor_ficha_competencia_trimestre
        UNIQUE (id_instructor, id_ficha, id_competencia, trimestre)
);


-- ============================================================================
-- 8. NOTA -- notas personales de cualquier usuario (privadas)
-- ============================================================================
CREATE TABLE Nota (
    id_nota          SERIAL PRIMARY KEY,
    titulo           VARCHAR(120) NOT NULL,
    materia          VARCHAR(80),
    contenido        TEXT NOT NULL,
    fecha_creacion   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    id_usuario       INTEGER NOT NULL REFERENCES Usuario(id_usuario)
);


-- ============================================================================
-- 9. NOTIFICACION -- avisos dirigidos a un usuario puntual
-- ============================================================================
CREATE TABLE Notificacion (
    id_notificacion       SERIAL PRIMARY KEY,
    titulo_notificacion   VARCHAR(160) NOT NULL,
    tipo                  VARCHAR(60) NOT NULL DEFAULT 'manual',
    mensaje               TEXT,
    origen                VARCHAR(60) NOT NULL DEFAULT 'sistema',
    estado                VARCHAR(30) NOT NULL DEFAULT 'no_leida',
    fecha_creacion        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    id_usuario            INTEGER NOT NULL REFERENCES Usuario(id_usuario) ON DELETE CASCADE
);

CREATE INDEX idx_notificacion_usuario ON Notificacion(id_usuario);


-- ============================================================================
-- 10. SEED -- los 3 roles base. Sin esto la API no deja ni registrar ni
--     iniciar sesión (ver backend/services/auth_service.py, que exige que
--     el rol 'aprendiz' ya exista para el registro público).
-- ============================================================================
INSERT INTO Rol (nombre_rol) VALUES
    ('coordinador'),
    ('instructor'),
    ('aprendiz')
ON CONFLICT (nombre_rol) DO NOTHING;

-- El primer usuario coordinador NO se crea aquí a propósito: su
-- contraseña debe quedar hasheada con PBKDF2 (el mismo algoritmo que usa
-- la API en backend/core/security.py), no en texto plano dentro de un
-- script SQL. Para crearlo, corre desde backend/:
--
--     python seed_roles.py

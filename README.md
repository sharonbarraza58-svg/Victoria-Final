# VICTORIA-FINAL

Proyecto unificado a partir de 3 carpetas: `victoria-admin-completo`,
`coordinación` (coordinador_fix) e `instructor`
(VICTORIA_INSTRUCTOR_BOTONES_CORREGIDOS).

## Estado de esta entrega

✅ **Backend (FastAPI) -- completo y probado de punta a punta.**
✅ **Script único de base de datos (PostgreSQL) -- completo y probado contra Postgres real.**
✅ **Frontend (app Expo/React Native "appm" + templates web del login) -- completo, sin errores de TypeScript.**

`backend/` arranca y funciona por sí sola: login, los 3 roles, todo el
CRUD administrativo y el flujo completo de tareas/entregas/calificación
quedaron probados con peticiones HTTP reales (incluyendo contra una base
de datos PostgreSQL real, no solo SQLite).

`appm/` (la app Expo/React Native) compila sin errores: se corrió
`npx tsc --noEmit` sobre las ~100 pantallas y módulos después de la
fusión y no arrojó ningún error de tipos.

---

## 1. Los 3 roles

Solo existen **coordinador**, **instructor** y **aprendiz**.

El antiguo rol **administrador** desapareció: todas sus vistas y permisos
(gestión de usuarios, fichas, programas, proyectos, competencias,
materiales, roles) ahora las tiene el **coordinador**. Esto se aplicó en
todo el backend reemplazando los antiguos chequeos `if usuario.id_rol !=
1` (dispersos por cada archivo de rutas) por un único mecanismo central:
`require_coordinador` / `require_instructor` / `require_roles(...)` en
`core/security.py`, que compara por **nombre** de rol, no por un número
mágico que dependía del orden en que se hubieran sembrado los roles.

## 2. Qué se tomó de cada carpeta

| De dónde | Qué se conservó |
|---|---|
| `victoria-admin-completo` | Arquitectura de carpetas, estética visual, login completo (JWT + bloqueo por intentos fallidos + recuperación por correo), todo el CRUD administrativo (usuarios, fichas, programas, proyectos, competencias, materiales, coordinaciones, roles), carga masiva de aprendices por CSV. |
| `coordinación` (coordinador_fix) | El sistema de permisos por nombre de rol (`require_roles`), el módulo completo de Tarea/Entrega (con calificación integrada), `Sede`, `AsignacionInstructor`, el dashboard y las vistas de coordinador e instructor. |
| `instructor` | El sistema de **Notificaciones** (único en esa carpeta, no competía con nada de las otras dos -- se conserva y ahora se dispara automáticamente al crear una tarea o calificar una entrega). |

### Decisiones de fusión importantes

- **Tarea/Entrega reemplaza 3 sistemas paralelos que hacían lo mismo**:
  `Evidencia` + `ActividadCompetencia` (admin) y `Entregable` +
  `Evidencia` + `Seguimiento` (instructor) quedaban fuera si se
  conservaban las 3 a la vez -- se unificó en el diseño más completo y
  reciente de los tres (`Tarea` + `Entrega`, con la calificación
  integrada en la propia entrega), para no acumular código duplicado.
- **La tabla `Rol`** usaba `nombre_rol` en dos de las carpetas y `nombre`
  en la tercera -- se unificó a `nombre_rol`.
- **El número de ficha** es el propio `id_ficha` (así lo definía
  `victoria-admin-completo`, la base elegida), no una columna
  `numero_ficha` aparte como en `coordinación`.
- **"Director de ficha"**: se usa el campo real `Ficha.id_director`
  (ya existía en `victoria-admin-completo`); si una ficha aún no tiene
  director asignado, se aproxima con el instructor con la asignación más
  antigua sobre esa ficha (mismo criterio de respaldo que ya traía
  `coordinación`).

## 3. Cómo correrlo

```bash
cd backend
python -m venv venv
source venv/bin/activate      # En Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edita .env: DATABASE_URL, SECRET_KEY, y las credenciales SMTP si vas a
# probar "olvidé mi contraseña".

# Opción A: dejar que la propia API cree las tablas (recomendado para
# desarrollo) -- created automáticamente al arrancar:
uvicorn main:app --reload

# Opción B: crear el esquema de una vez con el script SQL (ver sección 4)
# y luego arrancar la API igual.

# En cualquiera de las dos opciones, para crear los 3 roles + el primer
# coordinador (una sola vez):
python seed_roles.py
```

La API queda en `http://localhost:8000`, con Swagger en
`http://localhost:8000/docs` (ya configurado para pegar el token JWT concd
el botón "Authorize").

## 4. Script de base de datos

`database/victoria_final_schema.sql` es el **único** script SQL del
proyecto -- reemplaza a los 3 que traía cada carpeta por separado. Crea
las 14 tablas y siembra los 3 roles base. Probado contra PostgreSQL real
(no solo simulado):

```bash
createdb victoria
psql -d victoria -f database/victoria_final_schema.sql
```

Los modelos de SQLAlchemy (`backend/models/`) generan exactamente el
mismo esquema si prefieres dejar que la API cree las tablas sola
(`Base.metadata.create_all`, ya lo hace `main.py` al arrancar) -- ambos
caminos se probaron y producen tablas idénticas.

## 5. Seguridad (se conservó tal cual la traía `victoria-admin-completo`)

- Contraseñas con hash PBKDF2-SHA256 + salt (nunca texto plano).
- Token JWT con expiración configurable, guardando el número de
  documento del usuario.
- Bloqueo de cuenta por 30 minutos tras 3 intentos fallidos de login.
- Recuperación de contraseña por código de 6 dígitos enviado al correo,
  válido 15 minutos.
- Todos los campos de texto libre pasan por un escudo anti-XSS
  (`core/validators.py`) antes de guardarse.
- Autorización por rol centralizada (`core/security.py`), nunca
  dispersa en cada archivo de rutas.

## 6. Frontend (`appm/`) -- cómo se fusionó

Base = la app de `coordinación` (ya traía la estructura por carpetas de
rol: `app/victoria/coordinador/*`, `app/victoria/instructor/*`). Sobre
esa base:

- **`login.tsx` + `lib/auth.ts`**: diseño y modal de recuperación de
  contraseña de `victoria-admin-completo`, con la política de contraseña
  segura en tiempo real (checklist ✓/✗). El redirect después de iniciar
  sesión es siempre a `/victoria/dashboard`.
- **`app/_layout.tsx`**: se restauró la "trampa" de historial del
  navegador que traía `victoria-admin-completo` (si no hay sesión activa
  y alguien usa Atrás/Adelante, lo regresa a `/login` en vez de dejarlo
  ver una pantalla protegida) -- se había perdido en la fusión de
  `coordinación`.
- **`app/victoria/dashboard.tsx`**: se convirtió en un "guardia de
  tráfico" consciente del rol -- coordinador e instructor se redirigen de
  una a su propio dashboard; el aprendiz se queda aquí mismo (antes este
  archivo había quedado exclusivo de coordinador en la fusión de
  `coordinación`, dejando al aprendiz sin una pantalla de inicio real).
- **`app/victoria/coordinador/gestion/*`** (nuevo): todo lo que antes
  vivía en `app/admin/*` de `victoria-admin-completo` -- fichas,
  programas, competencias, instructores, sedes físicas y coordinaciones
  académicas. Accesible desde la pestaña "Gestión" del coordinador.
- Ojo con la palabra "sede": `victoria-admin-completo` la usaba para lo
  que en realidad es el modelo `Coordinacion` (`lib/coordinaciones.ts`,
  ej. "Coordinación de TIC"); el modelo `Sede` real (`lib/sedes.ts`) es la
  sede física del SENA que trae `coordinación`. Se separaron para no
  mezclar los dos conceptos.
- Se **eliminaron**: `lib/admin-guard.tsx` (reemplazado por
  `useRoleGuard`, ya usado en toda la app), y todo el sistema de
  Evidencia/ActividadCompetencia del lado del cliente (reemplazado por
  Tarea/Entrega, ya cubierto por las pantallas de instructor).
- Los templates web (`backend/templates/login.html`, `base.html`,
  `dashboard.html`) son los de `victoria-admin-completo`, sin modificar.

## 7. Pendiente / próximos pasos sugeridos

- Pantallas de **edición** de fichas/programas/competencias/sedes ya
  existentes (hoy `gestion/*` cubre alta y listado; editar un registro ya
  creado se puede hacer por Swagger mientras tanto).
- Pantalla para que el instructor edite su propio perfil (sede,
  especialidad, tipo de contrato, hoja de vida) -- los campos ya existen
  en el backend, falta la pantalla.
- El buscador global que traía `victoria-admin-completo`
  (`admin-buscador`, `admin-global-search`) no se migró en esta entrega;
  se puede adaptar reutilizando `lib/coordinaciones.ts`, `lib/fichas.ts`,
  etc. como fuente de datos si se necesita.

from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.usuario import Usuario
from models.rol import Rol
from schemas.usuario import UsuarioRegistroPublico
from core.security import hash_password, verify_password

# Nombre del rol que se le asigna a TODO el que se registra por la ruta
# pública (POST /api/v1/auth/register). No es negociable por el cliente:
# ver la explicación completa en schemas/usuario.py, junto a
# UsuarioRegistroPublico.
ROL_PUBLICO_POR_DEFECTO = "aprendiz"

MAX_INTENTOS_FALLIDOS = 3
MINUTOS_BLOQUEO = 30

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def registrar_usuario(self, user_in: UsuarioRegistroPublico):
        """Registra un nuevo usuario por la vía PÚBLICA (sin sesión), encriptando
        su contraseña y asignándole SIEMPRE el rol seguro por defecto
        (ROL_PUBLICO_POR_DEFECTO). El cliente no puede elegir su propio rol acá;
        para crear administradores/instructores existe POST /api/usuarios,
        que sí exige estar autenticado como administrador."""
        # 1. Verificamos que el documento no esté ya registrado
        existe_doc = self.db.query(Usuario).filter(Usuario.numero_documento == user_in.numero_documento).first()
        if existe_doc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El número de documento ya se encuentra registrado."
            )

        # 2. Buscamos el rol seguro por defecto. Si todavía no existe (por
        #    ejemplo, en una base de datos recién creada donde nadie ha
        #    llamado a POST /api/roles), no dejamos pasar el registro con un
        #    id_rol inventado: es mejor un error claro que un usuario mal
        #    formado en la base de datos.
        rol_por_defecto = (
            self.db.query(Rol)
            .filter(Rol.nombre_rol.ilike(ROL_PUBLICO_POR_DEFECTO))
            .first()
        )
        if not rol_por_defecto:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=(
                    f"No existe el rol '{ROL_PUBLICO_POR_DEFECTO}' en la base de datos. "
                    "Un coordinador debe crearlo primero con POST /api/roles."
                ),
            )

        # 3. Encriptamos la contraseña
        password_segura = hash_password(user_in.contrasena)

        # 4. Preparamos el usuario para guardarlo. id_rol SIEMPRE sale de
        #    rol_por_defecto.id_rol, nunca de algo que mandó el cliente.
        nuevo_usuario = Usuario(
            nombre=user_in.nombre,
            apellido=user_in.apellido,
            tipo_documento=user_in.tipo_documento,
            numero_documento=user_in.numero_documento,
            fecha_nacimiento=user_in.fecha_nacimiento,
            telefono=user_in.telefono,
            correo_personal=user_in.correo_personal,
            correo_sena=user_in.correo_sena,
            contrasena=password_segura,  # Guardamos el hash, NUNCA la clave plana
            id_ficha=user_in.id_ficha,
            id_coordinacion=user_in.id_coordinacion,
            id_rol=rol_por_defecto.id_rol,
        )

        # 5. Guardamos en la Base de Datos
        self.db.add(nuevo_usuario)
        self.db.commit()
        self.db.refresh(nuevo_usuario)

        return nuevo_usuario

    def autenticar_usuario(self, numero_documento: str, password_plana: str):
        """Busca al usuario por documento, revisa si está bloqueado por
        intentos fallidos y, si no, verifica la contraseña. Si falla,
        incrementa el contador y bloquea la cuenta 30 minutos al llegar
        a MAX_INTENTOS_FALLIDOS."""
        usuario = self.db.query(Usuario).filter(Usuario.numero_documento == numero_documento).first()

        if not usuario:
            # No revelamos si el documento existe o no (mismo criterio que
            # ya usan en /olvide-contrasena).
            return False

        ahora = datetime.now(timezone.utc)

        # 1. ¿Sigue bloqueado?
        if usuario.bloqueado_hasta and usuario.bloqueado_hasta > ahora:
            minutos_restantes = int((usuario.bloqueado_hasta - ahora).total_seconds() // 60) + 1
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Cuenta bloqueada por múltiples intentos fallidos. "
                    f"Vuelve a intentarlo en {minutos_restantes} minuto(s)."
                ),
            )

        # 2. Si ya pasó el tiempo de bloqueo, lo limpiamos antes de seguir.
        if usuario.bloqueado_hasta and usuario.bloqueado_hasta <= ahora:
            usuario.bloqueado_hasta = None
            usuario.intentos_fallidos = 0

        # 3. Verificamos la contraseña.
        if not verify_password(password_plana, usuario.contrasena):
            usuario.intentos_fallidos = (usuario.intentos_fallidos or 0) + 1

            if usuario.intentos_fallidos >= MAX_INTENTOS_FALLIDOS:
                usuario.bloqueado_hasta = ahora + timedelta(minutes=MINUTOS_BLOQUEO)
                self.db.commit()
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        f"Has superado el número de intentos permitidos. "
                        f"Tu cuenta quedó bloqueada por {MINUTOS_BLOQUEO} minutos."
                    ),
                )

            self.db.commit()
            return False

        # 4. Contraseña correcta: reiniciamos el contador.
        if usuario.intentos_fallidos or usuario.bloqueado_hasta:
            usuario.intentos_fallidos = 0
            usuario.bloqueado_hasta = None
            self.db.commit()

        return usuario
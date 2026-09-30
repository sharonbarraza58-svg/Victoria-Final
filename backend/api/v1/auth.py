from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from db.database import get_db
from models.usuario import Usuario
from schemas.usuario import UsuarioRegistroPublico, UsuarioResponse, Token
from services.auth_service import AuthService
from core.security import create_access_token, get_current_active_user
from schemas.recuperacion import SolicitudRecuperacion, ConfirmarRecuperacion
from services.recuperacion_service import RecuperacionService
from schemas.usuario import UsuarioRegistroPublico, UsuarioResponse, Token, FichaInfo

router = APIRouter()

@router.post("/register", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def registrar(usuario: UsuarioRegistroPublico, db: Session = Depends(get_db)):
    """Ruta pública para registrar un usuario en VICTORIA.

    Nota de seguridad: esta ruta NUNCA acepta un "id_rol" del cliente (ver
    schemas.usuario.UsuarioRegistroPublico). Todo el que se registra aquí
    entra con el rol seguro por defecto (AuthService.ROL_PUBLICO_POR_DEFECTO).
    Para crear administradores o instructores existe POST /api/usuarios,
    que exige estar autenticado como administrador.
    """
    auth_service = AuthService(db)
    try:
        return auth_service.registrar_usuario(usuario)
    except IntegrityError:
        # ANTES: registrar_usuario solo validaba a mano el numero_documento
        # duplicado. correo_personal y correo_sena también son unique=True
        # en el modelo, así que registrarse con un correo repetido rompía
        # con un 500 sin controlar en vez de un error claro. Mismo patrón
        # que ya usa routes/usuario.py para el alta hecha por un admin.
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El número de documento o alguno de los correos ya está registrado.",
        )


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Ruta pública para iniciar sesión.
    NOTA: Aunque Swagger diga 'username', el usuario debe digitar su NÚMERO DE DOCUMENTO.
    """
    auth_service = AuthService(db)

    # form_data.username contiene el número de documento que ingresó el usuario
    usuario = auth_service.autenticar_usuario(
        numero_documento=form_data.username,
        password_plana=form_data.password
    )

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Documento o contraseña incorrectos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fabricamos el token guardando el número de documento en el "sub" (subject)
    access_token = create_access_token(data={"sub": usuario.numero_documento})

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UsuarioResponse)
def perfil_actual(usuario_actual: Usuario = Depends(get_current_active_user)):
    """
    Ruta protegida: devuelve los datos del usuario dueño del token, más los
    datos de su ficha (programa, trimestre, director) ya armados, leídos
    directamente de la base de datos.
    """
    if usuario_actual.ficha:
        ficha = usuario_actual.ficha
        director_nombre = None
        if ficha.director:
            director_nombre = f"{ficha.director.nombre} {ficha.director.apellido or ''}".strip()

        usuario_actual.ficha_info = FichaInfo(
            id_ficha=ficha.id_ficha,
            trimestre=ficha.trimestre,
            programa=ficha.programa.nombre if ficha.programa else None,
            director=director_nombre,
        )

    return usuario_actual

@router.post("/olvide-contrasena")
def olvide_contrasena(data: SolicitudRecuperacion, db: Session = Depends(get_db)):
    """
    Genera un código de 6 dígitos y lo envía al correo (personal o SENA)
    del usuario. Siempre responde igual, exista o no el correo — así no se
    puede usar esta ruta para averiguar qué correos están registrados.
    """
    servicio = RecuperacionService(db)
    return servicio.solicitar_codigo(data.correo)


@router.post("/restablecer-contrasena")
def restablecer_contrasena(data: ConfirmarRecuperacion, db: Session = Depends(get_db)):
    """
    Verifica el código de 6 dígitos contra el que se guardó en /olvide-contrasena
    y, si es válido y no venció, actualiza la contraseña del usuario.
    """
    servicio = RecuperacionService(db)
    return servicio.confirmar_codigo(data.correo, data.codigo, data.nueva_contrasena)
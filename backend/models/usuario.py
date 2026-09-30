from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base


class Usuario(Base):
    __tablename__ = "usuario"

    id_usuario = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=True)
    id_rol = Column(Integer, ForeignKey("rol.id_rol"), nullable=False)

    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    estado = Column(String(50), default="activo")
    fecha_nacimiento = Column(Date, nullable=False)
    numero_documento = Column(String(20), unique=True, nullable=False)
    tipo_documento = Column(String(20), nullable=False)
    telefono = Column(String(20), nullable=True)
    correo_personal = Column(String(100), unique=True, nullable=False)
    correo_sena = Column(String(100), unique=True, nullable=False)
    contrasena = Column(String(255), nullable=False)  # Hash PBKDF2, nunca la clave plana

    # --- Seguridad de login (de victoria-admin-completo): bloqueo por
    # intentos fallidos + recuperación de contraseña por código de 6 dígitos.
    intentos_fallidos = Column(Integer, nullable=False, default=0)
    bloqueado_hasta = Column(DateTime(timezone=True), nullable=True)
    reset_code = Column(String(6), nullable=True)
    reset_code_expira = Column(DateTime(timezone=True), nullable=True)

    # Llaves foráneas opcionales: no todo usuario pertenece a una ficha o
    # coordinación (un instructor puede no estar ligado a una ficha fija).
    id_ficha = Column(Integer, ForeignKey("ficha.id_ficha", ondelete="SET NULL"), nullable=True)
    id_coordinacion = Column(Integer, ForeignKey("coordinacion.id_coordinacion", ondelete="SET NULL"), nullable=True)

    # --- Datos exclusivos de un usuario con rol instructor (de la carpeta
    # de coordinación): perfil "Perfil del Instructor" que consulta el
    # coordinador, y filtro de instructores por sede/tipo. Todos nullable:
    # un aprendiz o coordinador nunca los llena.
    id_sede = Column(Integer, ForeignKey("sede.id_sede", ondelete="SET NULL"), nullable=True)
    tipo_instructor = Column(String(20), nullable=True)  # 'planta' | 'tecnico' | 'transversal'
    especialidad = Column(String(150), nullable=True)
    tipo_contrato = Column(String(50), nullable=True)
    vigencia_contrato = Column(Date, nullable=True)
    hoja_vida_url = Column(String(300), nullable=True)

    # Campo libre usado por el instructor al registrar un aprendiz nuevo
    # ("Información Principal del Aprendiz").
    informacion_adicional = Column(String(500), nullable=True)

    # Relaciones
    rol = relationship("Rol", back_populates="usuarios")
    ficha = relationship("Ficha", back_populates="usuarios", foreign_keys=[id_ficha])
    sede = relationship("Sede", back_populates="usuarios", foreign_keys=[id_sede])

    @property
    def nombre_rol(self) -> str | None:
        """Atajo para leer el nombre del rol sin tener que hacer
        `usuario.rol.nombre_rol` en cada lugar del código."""
        return self.rol.nombre_rol if self.rol else None

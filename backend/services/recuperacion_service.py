import random
import smtplib
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from core.config import settings
from core.security import hash_password
from models.usuario import Usuario

MINUTOS_DE_VALIDEZ = 15


class RecuperacionService:
    def __init__(self, db: Session):
        self.db = db

    def _enviar_correo(self, destinatario: str, codigo: str):
        mensaje = MIMEMultipart("alternative")
        mensaje["Subject"] = "Recuperación de contraseña - VICTORIA"
        mensaje["From"] = f'{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>'
        mensaje["To"] = destinatario

        cuerpo = f"""
        <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
          <h2 style="color: #1a3322;">Recuperación de contraseña</h2>
          <p>Usa este código en la app VICTORIA para restablecer tu contraseña:</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1a3322;">
            {codigo}
          </p>
          <p>Este código vence en {MINUTOS_DE_VALIDEZ} minutos.</p>
          <p style="color: #888; font-size: 12px;">
            Si tú no pediste este cambio, ignora este correo.
          </p>
        </div>
        """
        mensaje.attach(MIMEText(cuerpo, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as servidor:
            servidor.starttls()
            servidor.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            servidor.sendmail(settings.SMTP_USER, destinatario, mensaje.as_string())

    def solicitar_codigo(self, correo: str):
        usuario = (
            self.db.query(Usuario)
            .filter((Usuario.correo_personal == correo) | (Usuario.correo_sena == correo))
            .first()
        )

        # No revelamos si el correo existe o no: siempre la misma respuesta.
        if not usuario:
            return {"mensaje": "Si el correo existe, te llegará un código."}

        codigo = f"{random.randint(0, 999999):06d}"
        usuario.reset_code = codigo
        usuario.reset_code_expira = datetime.now(timezone.utc) + timedelta(minutes=MINUTOS_DE_VALIDEZ)
        self.db.commit()

        try:
            self._enviar_correo(correo, codigo)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="No se pudo enviar el correo. Intenta de nuevo en unos minutos.",
            )

        return {"mensaje": "Si el correo existe, te llegará un código."}

    def confirmar_codigo(self, correo: str, codigo: str, nueva_contrasena: str):
        usuario = (
            self.db.query(Usuario)
            .filter((Usuario.correo_personal == correo) | (Usuario.correo_sena == correo))
            .first()
        )

        error_generico = HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código incorrecto o vencido.",
        )

        if not usuario or not usuario.reset_code or not usuario.reset_code_expira:
            raise error_generico

        ahora = datetime.now(timezone.utc)
        if usuario.reset_code != codigo or ahora > usuario.reset_code_expira:
            raise error_generico

        usuario.contrasena = hash_password(nueva_contrasena)
        usuario.reset_code = None
        usuario.reset_code_expira = None
        self.db.commit()

        return {"mensaje": "Contraseña actualizada correctamente."}

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuración central de VICTORIA-FINAL, leída desde variables de
    entorno (archivo .env). Un único punto de verdad: nada de constantes
    de conexión o llaves regadas por otros módulos.
    """

    PROJECT_NAME: str = "VICTORIA"
    PROJECT_VERSION: str = "1.0.0"
    DATABASE_URL: str

    # --- Seguridad / JWT ---
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    ALLOWED_ORIGINS: str = ""

    # --- Correo (recuperación de contraseña) ---
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str
    SMTP_PASSWORD: str
    SMTP_FROM_NAME: str = "VICTORIA - SENA"

    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignora cualquier variable extra en el .env sin romper el arranque


settings = Settings()

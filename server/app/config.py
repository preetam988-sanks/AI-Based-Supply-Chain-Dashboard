import sys
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import ValidationError
from fastapi_mail import ConnectionConfig


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    # Groq AI
    GROQ_API_KEY: str
    GROQ_MODEL_NAME: str = "llama-3.1-8b-instant"

    # Security
    SECRET_KEY: str

    # Email Config
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    USE_CREDENTIALS: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )


try:
    settings = Settings()
    print("✅ Configuration (.env) loaded successfully!")
except ValidationError as e:
    print("❌ FATAL ERROR: Missing or invalid environment variables in .env file.")
    print(e)
    sys.exit(1)


# Mail configuration using environment variables
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=settings.USE_CREDENTIALS
)
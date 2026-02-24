from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost/mlbb"
    SECRET_KEY: str = "changeme-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    BOT_TOKEN: str = "your-bot-token"
    ADMIN_SECRET: str = "admin-secret"
    WEBHOOK_URL: str = "https://your-app.onrender.com"
    FRONTEND_URL: str = "*"

    class Config:
        env_file = ".env"


settings = Settings()

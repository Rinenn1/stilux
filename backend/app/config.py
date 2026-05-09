from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    allowed_email: str

    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str = "http://localhost:8000/auth/callback"

    anthropic_api_key: str
    gemini_api_key: str
    deepseek_api_key: str = ""

    pinterest_client_id: str = ""
    pinterest_client_secret: str = ""
    pinterest_redirect_uri: str = "http://localhost:8000/pinterest/callback"

    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 10

    frontend_url: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


settings = Settings()

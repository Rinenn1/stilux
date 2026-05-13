from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    allowed_email: str

    # Supabase
    supabase_url: str
    supabase_service_role_key: str

    # AI APIs
    anthropic_api_key: str
    gemini_api_key: str = ""
    deepseek_api_key: str = ""

    # Pinterest (optional)
    pinterest_client_id: str = ""
    pinterest_client_secret: str = ""
    pinterest_redirect_uri: str = "http://localhost:8000/pinterest/callback"

    max_upload_size_mb: int = 10
    frontend_url: str = "https://ai-adviser-frontend.fly.dev"

    class Config:
        env_file = ".env"


settings = Settings()

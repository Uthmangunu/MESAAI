from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_env: str = "development"
    app_secret_key: str  # Required — no default. Set APP_SECRET_KEY in .env
    frontend_url: str = "http://localhost:5173"

    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: str

    # OpenRouter (OpenAI-compatible — supports Claude, GPT, Gemini, Mistral, etc.)
    openrouter_api_key: str
    # Default model — any model ID from openrouter.ai/models
    # e.g. anthropic/claude-haiku-4-5, openai/gpt-4o, google/gemini-flash-1.5
    openrouter_model: str = "anthropic/claude-haiku-4-5"

    # Stripe
    stripe_secret_key: str
    stripe_webhook_secret: str = ""
    stripe_publishable_key: str = ""

    # Twilio
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""
    twilio_whatsapp_number: str = ""

    # OpenAI
    openai_api_key: str = ""

    # Google
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/integrations/google/callback"

    # Calendly
    calendly_api_key: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()

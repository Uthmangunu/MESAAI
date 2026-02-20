from typing import Optional
from supabase import create_client, Client
from app.config import get_settings

_client: Optional[Client] = None
_admin_client: Optional[Client] = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        settings = get_settings()
        _client = create_client(settings.supabase_url, settings.supabase_anon_key)
    return _client


def get_supabase_admin() -> Client:
    """Service role client — bypasses RLS. Use only server-side."""
    global _admin_client
    if _admin_client is None:
        settings = get_settings()
        _admin_client = create_client(settings.supabase_url, settings.supabase_service_key)
    return _admin_client

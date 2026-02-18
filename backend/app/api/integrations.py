"""
Integration management — connect Google Calendar, Calendly, etc.
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from app.integrations.supabase import get_supabase_admin
from app.dependencies import get_current_user_org
from app.config import get_settings
import secrets

router = APIRouter(prefix="/integrations", tags=["integrations"])


@router.get("")
async def list_integrations(user_data=Depends(get_current_user_org)):
    """List all integrations and their connection status."""
    admin = get_supabase_admin()
    result = (
        admin.table("integrations")
        .select("type, is_connected, created_at")
        .eq("organization_id", user_data["organization_id"])
        .execute()
    )
    return result.data


# ─── Google Calendar ──────────────────────────────────────────────────────────

@router.get("/google/connect")
async def google_connect(user_data=Depends(get_current_user_org)):
    """Generate Google OAuth URL for the org to connect their calendar."""
    from app.integrations.google_calendar import get_auth_url

    state = f"{user_data['organization_id']}:{secrets.token_urlsafe(16)}"
    auth_url = get_auth_url(state=state)
    return {"auth_url": auth_url}


@router.get("/google/callback")
async def google_callback(code: str, state: str):
    """
    Google OAuth callback — exchange code for tokens and save.
    """
    from app.integrations.google_calendar import exchange_code_for_tokens

    # Validate state format
    parts = state.split(":")
    if len(parts) < 2:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    org_id = parts[0]

    # Verify this org actually exists before saving credentials
    admin = get_supabase_admin()
    org_check = (
        admin.table("organizations")
        .select("id")
        .eq("id", org_id)
        .single()
        .execute()
    )
    if not org_check.data:
        raise HTTPException(status_code=400, detail="Invalid OAuth state — organization not found")

    try:
        credentials = exchange_code_for_tokens(code=code)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to exchange OAuth code: {e}")

    admin.table("integrations").upsert({
        "organization_id": org_id,
        "type": "google_calendar",
        "credentials": credentials,
        "is_connected": True,
    }, on_conflict="organization_id,type").execute()

    settings = get_settings()
    return RedirectResponse(url=f"{settings.frontend_url}/integrations?google=connected")


@router.delete("/google/disconnect")
async def google_disconnect(user_data=Depends(get_current_user_org)):
    admin = get_supabase_admin()
    admin.table("integrations").update(
        {"is_connected": False, "credentials": {}}
    ).eq("organization_id", user_data["organization_id"]).eq("type", "google_calendar").execute()
    return {"message": "Google Calendar disconnected"}


# ─── Calendly ────────────────────────────────────────────────────────────────

class CalendlyConnectRequest:
    api_key: str


@router.post("/calendly/connect")
async def calendly_connect(
    request: Request,
    user_data=Depends(get_current_user_org),
):
    """Connect Calendly using an API key (personal access token)."""
    from app.integrations.calendly import verify_token

    body = await request.json()
    api_key = body.get("api_key", "")

    if not api_key:
        raise HTTPException(status_code=400, detail="API key required")

    is_valid = await verify_token(api_key)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid Calendly API key")

    admin = get_supabase_admin()
    admin.table("integrations").upsert({
        "organization_id": user_data["organization_id"],
        "type": "calendly",
        "credentials": {"api_key": api_key},
        "is_connected": True,
    }, on_conflict="organization_id,type").execute()

    return {"message": "Calendly connected"}


@router.delete("/calendly/disconnect")
async def calendly_disconnect(user_data=Depends(get_current_user_org)):
    admin = get_supabase_admin()
    admin.table("integrations").update(
        {"is_connected": False, "credentials": {}}
    ).eq("organization_id", user_data["organization_id"]).eq("type", "calendly").execute()
    return {"message": "Calendly disconnected"}


@router.get("/calendly/event-types")
async def calendly_event_types(user_data=Depends(get_current_user_org)):
    from app.integrations.calendly import list_event_types
    try:
        return await list_event_types(org_id=user_data["organization_id"])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

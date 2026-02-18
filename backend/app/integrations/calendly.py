"""
Calendly API integration.
Uses Calendly's v2 API with a personal access token.
"""

import httpx
from app.config import get_settings
from app.integrations.supabase import get_supabase_admin


CALENDLY_BASE = "https://api.calendly.com"


def _get_org_calendly_token(org_id: str) -> str:
    admin = get_supabase_admin()
    result = (
        admin.table("integrations")
        .select("credentials")
        .eq("organization_id", org_id)
        .eq("type", "calendly")
        .eq("is_connected", True)
        .single()
        .execute()
    )
    if not result.data:
        raise ValueError(f"Calendly not connected for org {org_id}")
    return result.data["credentials"]["api_key"]


async def get_user_info(token: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{CALENDLY_BASE}/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        response.raise_for_status()
        return response.json()["resource"]


async def list_event_types(org_id: str) -> list:
    """List available Calendly event types for the org."""
    token = _get_org_calendly_token(org_id)
    user = await get_user_info(token)
    user_uri = user["uri"]

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{CALENDLY_BASE}/event_types",
            headers={"Authorization": f"Bearer {token}"},
            params={"user": user_uri, "active": "true"},
        )
        response.raise_for_status()
        return response.json()["collection"]


async def create_one_off_event_link(
    org_id: str,
    event_type_uri: str,
    name: str,
    email: str,
    max_event_count: int = 1,
) -> str:
    """Create a single-use scheduling link for a specific invitee."""
    token = _get_org_calendly_token(org_id)

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{CALENDLY_BASE}/one_off_event_types",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json={
                "name": name,
                "host": event_type_uri,
                "duration": 60,
                "co_hosts": [],
                "max_event_count": max_event_count,
            },
        )
        if response.status_code == 201:
            data = response.json()["resource"]
            return data.get("scheduling_url", "")

    return ""


async def get_scheduled_events(org_id: str, count: int = 20) -> list:
    """List upcoming scheduled events."""
    token = _get_org_calendly_token(org_id)
    user = await get_user_info(token)

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{CALENDLY_BASE}/scheduled_events",
            headers={"Authorization": f"Bearer {token}"},
            params={"user": user["uri"], "count": count, "status": "active"},
        )
        response.raise_for_status()
        return response.json()["collection"]


async def verify_token(api_key: str) -> bool:
    """Check if a Calendly API key is valid."""
    try:
        await get_user_info(api_key)
        return True
    except Exception:
        return False

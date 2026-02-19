"""
Instagram DM integration via Meta Graph API.

Setup required on Meta Developer Portal:
1. Create a Meta App at developers.facebook.com
2. Add Instagram product → Instagram Messaging
3. Connect Instagram Professional Account (via linked Facebook Page)
4. Set webhook URL: https://your-backend/api/webhooks/instagram
5. Subscribe to 'messages' webhook field
6. Generate Page Access Token (store per-org in integrations table)
"""
import hmac
import hashlib
import httpx
from app.config import get_settings
from app.integrations.supabase import get_supabase_admin
import logging

logger = logging.getLogger(__name__)

GRAPH_API_VERSION = "v21.0"
GRAPH_API_BASE = f"https://graph.facebook.com/{GRAPH_API_VERSION}"


def validate_webhook_signature(payload: bytes, signature: str) -> bool:
    """Validate X-Hub-Signature-256 header from Meta."""
    settings = get_settings()
    if not settings.instagram_app_secret:
        logger.warning("Instagram app secret not configured — skipping signature validation")
        return True

    expected = hmac.new(
        settings.instagram_app_secret.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()

    # Signature format: "sha256=<hash>"
    if signature.startswith("sha256="):
        signature = signature[7:]

    return hmac.compare_digest(expected, signature)


def get_page_access_token(org_id: str) -> str | None:
    """Get the stored Instagram/Facebook Page Access Token for an org."""
    admin = get_supabase_admin()
    result = (
        admin.table("integrations")
        .select("credentials")
        .eq("organization_id", org_id)
        .eq("type", "instagram")
        .eq("is_connected", True)
        .single()
        .execute()
    )
    if result.data:
        return result.data.get("credentials", {}).get("page_access_token")
    return None


async def send_instagram_message(
    recipient_id: str,
    message_text: str,
    page_access_token: str,
) -> dict:
    """Send a DM via Instagram Messaging API."""
    url = f"{GRAPH_API_BASE}/me/messages"
    payload = {
        "recipient": {"id": recipient_id},
        "message": {"text": message_text},
    }
    params = {"access_token": page_access_token}

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, params=params, timeout=30)
        response.raise_for_status()
        return response.json()


async def get_instagram_user_profile(
    user_id: str,
    page_access_token: str,
) -> dict:
    """Get basic profile info for an Instagram user."""
    url = f"{GRAPH_API_BASE}/{user_id}"
    params = {
        "fields": "name,username",
        "access_token": page_access_token,
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, timeout=30)
        if response.status_code == 200:
            return response.json()
        return {}


def find_agent_for_instagram(instagram_page_id: str):
    """Find the agent configured for a specific Instagram Page ID."""
    admin = get_supabase_admin()

    # Look for agent_channels with instagram channel configured with this page_id
    result = (
        admin.table("agent_channels")
        .select("agent_id, config, agents(id, name, organization_id, status)")
        .eq("channel", "instagram")
        .eq("is_enabled", True)
        .execute()
    )

    for row in result.data or []:
        config = row.get("config", {})
        if config.get("instagram_page_id") == instagram_page_id:
            return row["agents"]

    # Fallback: return first active Instagram-enabled agent
    if result.data:
        for row in result.data:
            agent = row.get("agents")
            if agent and agent.get("status") == "active":
                return agent

    return None

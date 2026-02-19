"""
Webhook handlers for:
- WhatsApp (Twilio)
- Instagram (Meta Graph API)
- Stripe (billing events)
"""

from fastapi import APIRouter, Request, Response, HTTPException, Form, Query
from app.integrations.supabase import get_supabase_admin
from app.integrations.whatsapp import send_whatsapp_message, validate_twilio_signature
from app.integrations import stripe as stripe_integration
from app.integrations.instagram import (
    validate_webhook_signature as validate_instagram_signature,
    send_instagram_message,
    get_page_access_token,
    find_agent_for_instagram,
    get_instagram_user_profile,
)
from app.core.agent_engine import process_message
from app.config import get_settings
import logging

router = APIRouter(prefix="/webhooks", tags=["webhooks"])
logger = logging.getLogger(__name__)


# ─── WhatsApp Webhook ──────────────────────────────────────────────────────────

def _find_agent_for_whatsapp_number(whatsapp_to: str):
    """Find the agent assigned to a specific WhatsApp number."""
    admin = get_supabase_admin()
    result = (
        admin.table("agent_channels")
        .select("agent_id, config, agents(id, name, organization_id, status)")
        .eq("channel", "whatsapp")
        .eq("is_enabled", True)
        .execute()
    )

    clean_to = whatsapp_to.replace("whatsapp:", "")

    for row in result.data or []:
        config = row.get("config", {})
        if config.get("whatsapp_number", "").replace("whatsapp:", "") == clean_to:
            return row["agents"]

    if result.data:
        return result.data[0]["agents"]
    return None


@router.post("/whatsapp")
async def whatsapp_webhook(
    request: Request,
    From: str = Form(default=""),
    To: str = Form(default=""),
    Body: str = Form(default=""),
    MessageSid: str = Form(default=""),
    ProfileName: str = Form(default=""),
):
    """
    Twilio WhatsApp webhook — handles inbound messages.
    """
    settings = get_settings()

    # Validate Twilio signature in production
    if settings.app_env == "production":
        sig = request.headers.get("X-Twilio-Signature", "")
        form_data = dict(await request.form())
        url = str(request.url)
        if not validate_twilio_signature(url=url, params=form_data, signature=sig):
            raise HTTPException(status_code=403, detail="Invalid Twilio signature")

    if not Body.strip():
        return Response(status_code=204)

    agent = _find_agent_for_whatsapp_number(To)
    if not agent or agent["status"] != "active":
        logger.warning(f"No active agent found for WhatsApp number {To}")
        return Response(status_code=204)

    caller_phone = From.replace("whatsapp:", "")
    contact_name = ProfileName or None

    try:
        result = await process_message(
            agent_id=agent["id"],
            organization_id=agent["organization_id"],
            channel="whatsapp",
            contact_phone=caller_phone,
            contact_email=None,
            contact_name=contact_name,
            message_text=Body.strip(),
        )

        reply = result.get("reply")
        if reply:
            send_whatsapp_message(to=From, body=reply)

        return Response(status_code=204)

    except Exception as e:
        logger.error(f"WhatsApp webhook error: {e}", exc_info=True)
        # Return 500 so Twilio retries — don't silently swallow failures
        raise HTTPException(status_code=500, detail="Failed to process message")


# ─── Instagram Webhooks ────────────────────────────────────────────────────────

@router.get("/instagram")
async def instagram_webhook_verify(
    request: Request,
):
    """
    Meta webhook verification — responds to the challenge.
    Meta sends: hub.mode, hub.verify_token, hub.challenge
    """
    settings = get_settings()
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")

    if mode == "subscribe" and token == settings.instagram_verify_token:
        logger.info("Instagram webhook verified successfully")
        return Response(content=challenge, media_type="text/plain")

    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/instagram")
async def instagram_webhook(request: Request):
    """
    Handle incoming Instagram DM messages.
    """
    settings = get_settings()
    payload = await request.body()

    # Validate signature in production
    if settings.app_env == "production":
        signature = request.headers.get("X-Hub-Signature-256", "")
        if not validate_instagram_signature(payload, signature):
            raise HTTPException(status_code=403, detail="Invalid signature")

    try:
        data = await request.json()
    except Exception:
        return Response(status_code=200)  # Acknowledge but ignore bad JSON

    # Meta sends { "object": "instagram", "entry": [...] }
    if data.get("object") != "instagram":
        return Response(status_code=200)

    for entry in data.get("entry", []):
        page_id = entry.get("id")

        for messaging_event in entry.get("messaging", []):
            sender_id = messaging_event.get("sender", {}).get("id")
            message_data = messaging_event.get("message", {})
            message_text = message_data.get("text", "")

            # Skip non-text messages (images, stickers, etc.) for now
            if not message_text:
                continue

            # Find agent for this Instagram page
            agent = find_agent_for_instagram(page_id)
            if not agent or agent.get("status") != "active":
                logger.warning(f"No active agent for Instagram page {page_id}")
                continue

            org_id = agent["organization_id"]
            page_token = get_page_access_token(org_id)
            if not page_token:
                logger.warning(f"No Instagram page token for org {org_id}")
                continue

            # Get sender profile for contact name
            profile = await get_instagram_user_profile(sender_id, page_token)
            contact_name = profile.get("name") or profile.get("username")

            try:
                result = await process_message(
                    agent_id=agent["id"],
                    organization_id=org_id,
                    channel="instagram",
                    contact_phone=None,
                    contact_email=None,
                    contact_name=contact_name,
                    message_text=message_text,
                )

                reply = result.get("reply")
                if reply:
                    await send_instagram_message(
                        recipient_id=sender_id,
                        message_text=reply,
                        page_access_token=page_token,
                    )

            except Exception as e:
                logger.error(f"Instagram webhook error: {e}", exc_info=True)
                # Don't raise — Meta expects 200 to acknowledge receipt

    return Response(status_code=200)


# ─── Facebook Messenger Webhooks ───────────────────────────────────────────────

@router.get("/facebook")
async def facebook_webhook_verify(
    request: Request,
):
    """
    Meta webhook verification for Facebook Messenger.
    Same pattern as Instagram - Meta sends: hub.mode, hub.verify_token, hub.challenge
    """
    settings = get_settings()
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")

    # Use same verify token for both Facebook and Instagram
    if mode == "subscribe" and token == settings.instagram_verify_token:
        logger.info("Facebook Messenger webhook verified successfully")
        return Response(content=challenge, media_type="text/plain")

    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/facebook")
async def facebook_webhook(request: Request):
    """
    Handle incoming Facebook Messenger messages.
    Uses Meta Graph API v21.0 (same as Instagram).
    """
    settings = get_settings()
    payload = await request.body()

    # Validate signature in production
    if settings.app_env == "production":
        signature = request.headers.get("X-Hub-Signature-256", "")
        if not validate_instagram_signature(payload, signature):
            raise HTTPException(status_code=403, detail="Invalid signature")

    try:
        data = await request.json()
    except Exception:
        return Response(status_code=200)  # Acknowledge but ignore bad JSON

    # Meta sends { "object": "page", "entry": [...] }
    if data.get("object") != "page":
        return Response(status_code=200)

    for entry in data.get("entry", []):
        page_id = entry.get("id")

        for messaging_event in entry.get("messaging", []):
            sender_id = messaging_event.get("sender", {}).get("id")
            message_data = messaging_event.get("message", {})
            message_text = message_data.get("text", "")

            # Skip non-text messages (images, stickers, etc.) for now
            if not message_text:
                continue

            # Find agent for this Facebook page
            agent = find_agent_for_instagram(page_id)  # Same function works for FB pages
            if not agent or agent.get("status") != "active":
                logger.warning(f"No active agent for Facebook page {page_id}")
                continue

            org_id = agent["organization_id"]
            page_token = get_page_access_token(org_id)
            if not page_token:
                logger.warning(f"No Facebook page token for org {org_id}")
                continue

            # Get sender profile for contact name
            profile = await get_instagram_user_profile(sender_id, page_token)
            contact_name = profile.get("name") or profile.get("first_name")

            try:
                result = await process_message(
                    agent_id=agent["id"],
                    organization_id=org_id,
                    channel="facebook_messenger",
                    contact_phone=None,
                    contact_email=None,
                    contact_name=contact_name,
                    message_text=message_text,
                )

                reply = result.get("reply")
                if reply:
                    await send_instagram_message(  # Same API for FB Messenger
                        recipient_id=sender_id,
                        message_text=reply,
                        page_access_token=page_token,
                    )

            except Exception as e:
                logger.error(f"Facebook Messenger webhook error: {e}", exc_info=True)
                # Don't raise — Meta expects 200 to acknowledge receipt

    return Response(status_code=200)


# ─── Stripe Webhook ────────────────────────────────────────────────────────────

@router.post("/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe subscription lifecycle events."""
    settings = get_settings()
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe_integration.construct_webhook_event(
            payload=payload,
            sig_header=sig_header,
            secret=settings.stripe_webhook_secret,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {e}")

    admin = get_supabase_admin()
    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        # Subscription created after checkout — create the agent
        metadata = data.get("metadata", {})
        org_id = metadata.get("organization_id")
        employee_type_id = metadata.get("employee_type_id")
        agent_name = metadata.get("agent_name", "AI Receptionist")
        subscription_id = data.get("subscription")

        if org_id and employee_type_id:
            # Get employee type capabilities for default channels
            et = (
                admin.table("employee_types")
                .select("capabilities")
                .eq("id", employee_type_id)
                .single()
                .execute()
            )

            agent_result = admin.table("agents").insert({
                "organization_id": org_id,
                "employee_type_id": employee_type_id,
                "name": agent_name,
                "stripe_subscription_id": subscription_id,
                "status": "active",
            }).execute()

            agent_id = agent_result.data[0]["id"]

            # Create default channel entries
            capabilities = et.data.get("capabilities", []) if et.data else []
            if capabilities:
                admin.table("agent_channels").insert([
                    {"agent_id": agent_id, "channel": cap, "is_enabled": False}
                    for cap in capabilities
                ]).execute()

    elif event_type == "customer.subscription.deleted":
        subscription_id = data.get("id")
        admin.table("agents").update(
            {"status": "cancelled"}
        ).eq("stripe_subscription_id", subscription_id).execute()

    elif event_type == "customer.subscription.updated":
        subscription_id = data.get("id")
        sub_status = data.get("status")
        agent_status = "active" if sub_status == "active" else "paused"
        admin.table("agents").update(
            {"status": agent_status}
        ).eq("stripe_subscription_id", subscription_id).execute()

    elif event_type == "invoice.payment_failed":
        subscription_id = data.get("subscription")
        if subscription_id:
            admin.table("agents").update(
                {"status": "paused"}
            ).eq("stripe_subscription_id", subscription_id).execute()

    return {"status": "ok"}

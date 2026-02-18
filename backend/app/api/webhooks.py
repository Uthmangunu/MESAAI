"""
Webhook handlers for:
- WhatsApp (Twilio)
- Stripe (billing events)
"""

from fastapi import APIRouter, Request, Response, HTTPException, Form
from app.integrations.supabase import get_supabase_admin
from app.integrations.whatsapp import send_whatsapp_message, validate_twilio_signature
from app.integrations import stripe as stripe_integration
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

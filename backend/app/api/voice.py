"""
Voice call handler — Twilio webhooks for inbound calls.

Flow:
1. Twilio calls /api/voice/incoming → we return TwiML to greet + gather speech
2. Caller speaks → Twilio POSTs transcript to /api/voice/respond
3. We run through agent engine → get reply text
4. Return TwiML that speaks the reply and listens again
5. Loop until caller hangs up
"""

from fastapi import APIRouter, Request, Response, Form, HTTPException
from fastapi.responses import PlainTextResponse
from app.integrations.twilio_voice import build_gather_twiml, build_say_twiml, build_hangup_twiml
from app.integrations.supabase import get_supabase_admin
from app.core.agent_engine import process_message
from app.core.rate_limiter import check_voice_turn_limit, RateLimitExceeded, LIMITS
from app.config import get_settings
from datetime import datetime, timezone
import logging

router = APIRouter(prefix="/voice", tags=["voice"])
logger = logging.getLogger(__name__)


def _find_agent_for_number(called_number: str):
    """Find the agent configured to handle this phone number."""
    admin = get_supabase_admin()
    result = (
        admin.table("agent_channels")
        .select("agent_id, config, agents(id, name, organization_id, status)")
        .eq("channel", "voice")
        .eq("is_enabled", True)
        .execute()
    )

    for row in result.data or []:
        config = row.get("config", {})
        if config.get("phone_number") == called_number:
            return row["agents"]

    # Fallback: return first active voice-enabled agent
    if result.data:
        return result.data[0]["agents"]
    return None


@router.post("/incoming")
async def incoming_call(
    request: Request,
    Called: str = Form(default=""),
    From: str = Form(default=""),
    CallSid: str = Form(default=""),
):
    """
    Twilio hits this when a call comes in.
    Returns TwiML to greet the caller and gather their speech.
    """
    settings = get_settings()
    base_url = str(request.base_url).rstrip("/")

    agent = _find_agent_for_number(Called)
    agent_name = agent["name"] if agent else "your assistant"
    agent_id = agent["id"] if agent else None

    # The action URL where Twilio sends the speech result
    action_url = f"{base_url}/api/voice/respond?agent_id={agent_id}&caller={From}"

    # Hard cap: Twilio will hang up the call after this many seconds (cost protection)
    twiml = build_gather_twiml(
        action_url=action_url,
        agent_name=agent_name,
        call_timeout_seconds=LIMITS["voice_max_seconds"],
    )
    return Response(content=twiml, media_type="application/xml")


@router.post("/respond")
async def voice_respond(
    request: Request,
    agent_id: str,
    caller: str,
    SpeechResult: str = Form(default=""),
    CallSid: str = Form(default=""),
    Confidence: str = Form(default=""),
):
    """
    Twilio sends the caller's speech here.
    We process it through the agent engine and return TwiML with the reply.
    """
    base_url = str(request.base_url).rstrip("/")

    if not SpeechResult.strip():
        twiml = build_say_twiml(
            text="Sorry, I didn't catch that. Could you repeat that?",
            redirect_url=f"{base_url}/api/voice/respond?agent_id={agent_id}&caller={caller}",
        )
        return Response(content=twiml, media_type="application/xml")

    try:
        admin = get_supabase_admin()
        agent = (
            admin.table("agents")
            .select("id, organization_id, status")
            .eq("id", agent_id)
            .single()
            .execute()
        )

        if not agent.data or agent.data["status"] != "active":
            twiml = build_hangup_twiml("This line is currently unavailable. Please try again later.")
            return Response(content=twiml, media_type="application/xml")

        # Check voice turn + duration limits before processing (cost protection)
        try:
            conv_result = (
                admin.table("conversations")
                .select("id, created_at")
                .eq("agent_id", agent_id)
                .eq("channel", "voice")
                .eq("contact_phone", caller.replace("whatsapp:", ""))
                .eq("status", "open")
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            if conv_result.data:
                conv = conv_result.data[0]

                # Turn limit
                await check_voice_turn_limit(conversation_id=conv["id"])

                # Duration limit — use conversation age as call age proxy
                from dateutil import parser as dateparser
                call_start = dateparser.parse(conv["created_at"])
                if call_start.tzinfo is None:
                    call_start = call_start.replace(tzinfo=timezone.utc)
                elapsed = (datetime.now(timezone.utc) - call_start).total_seconds()
                if elapsed > LIMITS["voice_max_seconds"]:
                    raise RateLimitExceeded(
                        reason=f"Voice call exceeded {LIMITS['voice_max_seconds']}s",
                        friendly_message=(
                            "We've reached the maximum call duration. "
                            "Please call back if you need further assistance. Goodbye!"
                        ),
                    )

        except RateLimitExceeded as e:
            twiml = build_hangup_twiml(e.friendly_message)
            return Response(content=twiml, media_type="application/xml")

        result = await process_message(
            agent_id=agent_id,
            organization_id=agent.data["organization_id"],
            channel="voice",
            contact_phone=caller,
            contact_email=None,
            contact_name=None,
            message_text=SpeechResult,
        )

        reply_text = result.get("reply", "I'll get someone to follow up with you.")

        # Check if conversation was escalated
        tools_used = result.get("tools_used", [])
        if "escalate_to_human" in tools_used:
            twiml = build_hangup_twiml(
                f"{reply_text} Someone from our team will be in touch shortly. Goodbye!"
            )
        else:
            action_url = f"{base_url}/api/voice/respond?agent_id={agent_id}&caller={caller}"
            twiml = build_say_twiml(text=reply_text, redirect_url=action_url)

        return Response(content=twiml, media_type="application/xml")

    except Exception as e:
        logger.error(f"Voice respond error: {e}")
        twiml = build_hangup_twiml("I'm experiencing a technical issue. Please call back shortly.")
        return Response(content=twiml, media_type="application/xml")


@router.post("/tts")
async def text_to_speech_endpoint(text: str, voice: str = "nova"):
    """Generate speech audio from text. Returns MP3."""
    from app.integrations.openai_tts import text_to_speech
    from fastapi.responses import Response as FastAPIResponse

    audio_bytes = await text_to_speech(text=text, voice=voice)
    return FastAPIResponse(content=audio_bytes, media_type="audio/mpeg")

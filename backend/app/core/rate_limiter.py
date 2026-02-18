"""
Rate limiting to prevent runaway costs.

Limits enforced:
- Per contact: max 30 messages per hour, 100 per day
- Per agent: max 500 messages per day (org-level protection)
- Per voice call: max 20 turns per call (hard stop)
- Voice call duration: max 10 minutes (enforced via TwiML timeout)

All limits are checked against the messages table — no Redis needed.
"""

from datetime import datetime, timedelta, timezone
from app.integrations.supabase import get_supabase_admin


# ─── Configurable limits ──────────────────────────────────────────────────────

LIMITS = {
    "contact_messages_per_hour": 30,
    "contact_messages_per_day": 100,
    "agent_messages_per_day": 500,
    "voice_turns_per_call": 20,
    "voice_max_seconds": 600,  # 10 minutes — enforced in TwiML
}


class RateLimitExceeded(Exception):
    def __init__(self, reason: str, friendly_message: str):
        self.reason = reason
        self.friendly_message = friendly_message
        super().__init__(reason)


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


async def check_contact_rate_limit(conversation_id: str, contact_identifier: str):
    """
    Check how many messages this contact has sent in the last hour and day.
    Raises RateLimitExceeded if over limit.
    """
    admin = get_supabase_admin()
    now = _now_utc()
    one_hour_ago = (now - timedelta(hours=1)).isoformat()
    one_day_ago = (now - timedelta(hours=24)).isoformat()

    # Count messages from this contact (role=user) in their conversation
    hour_result = (
        admin.table("messages")
        .select("id", count="exact")
        .eq("conversation_id", conversation_id)
        .eq("role", "user")
        .gte("created_at", one_hour_ago)
        .execute()
    )

    day_result = (
        admin.table("messages")
        .select("id", count="exact")
        .eq("conversation_id", conversation_id)
        .eq("role", "user")
        .gte("created_at", one_day_ago)
        .execute()
    )

    hour_count = hour_result.count or 0
    day_count = day_result.count or 0

    if hour_count >= LIMITS["contact_messages_per_hour"]:
        raise RateLimitExceeded(
            reason=f"Contact exceeded {LIMITS['contact_messages_per_hour']} messages/hour",
            friendly_message=(
                "You've sent a lot of messages in the last hour. "
                "Please wait a while before sending more, or call us directly."
            ),
        )

    if day_count >= LIMITS["contact_messages_per_day"]:
        raise RateLimitExceeded(
            reason=f"Contact exceeded {LIMITS['contact_messages_per_day']} messages/day",
            friendly_message=(
                "You've reached the daily message limit. "
                "Please call us directly or try again tomorrow."
            ),
        )


async def check_agent_rate_limit(agent_id: str):
    """
    Check how many messages the agent has sent today (protects against API cost blowout).
    Raises RateLimitExceeded if over limit.
    """
    admin = get_supabase_admin()
    one_day_ago = (_now_utc() - timedelta(hours=24)).isoformat()

    result = (
        admin.table("agent_logs")
        .select("id", count="exact")
        .eq("agent_id", agent_id)
        .eq("action", "replied")
        .gte("created_at", one_day_ago)
        .execute()
    )

    count = result.count or 0
    if count >= LIMITS["agent_messages_per_day"]:
        raise RateLimitExceeded(
            reason=f"Agent exceeded {LIMITS['agent_messages_per_day']} replies/day",
            friendly_message=(
                "This assistant has reached its daily message capacity. "
                "Please contact us directly — our team will be happy to help."
            ),
        )


async def check_voice_turn_limit(conversation_id: str) -> int:
    """
    Count how many turns have happened in this voice call.
    Returns current turn count. Raises RateLimitExceeded if over limit.
    """
    admin = get_supabase_admin()

    result = (
        admin.table("messages")
        .select("id", count="exact")
        .eq("conversation_id", conversation_id)
        .eq("role", "assistant")
        .execute()
    )

    turn_count = result.count or 0

    if turn_count >= LIMITS["voice_turns_per_call"]:
        raise RateLimitExceeded(
            reason=f"Voice call exceeded {LIMITS['voice_turns_per_call']} turns",
            friendly_message=(
                "We've been chatting for a while! For further assistance, "
                "please call back or send us a message. Goodbye!"
            ),
        )

    return turn_count

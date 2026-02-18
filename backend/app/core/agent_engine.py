"""
The core agent engine — processes incoming messages and drives agent actions.
"""
import json
from datetime import datetime
from app.core.llm import chat_with_tools, chat_completion
from app.core.tools import AGENT_TOOLS
from app.core.prompts import RECEPTIONIST_BASE_PROMPT
from app.core.rate_limiter import (
    check_contact_rate_limit,
    check_agent_rate_limit,
    RateLimitExceeded,
)
from app.integrations.supabase import get_supabase_admin


async def process_message(
    agent_id: str,
    organization_id: str,
    channel: str,
    contact_phone: str | None,
    contact_email: str | None,
    contact_name: str | None,
    message_text: str,
    conversation_id: str | None = None,
) -> dict:
    """
    Main agent loop:
    1. Load or create conversation
    2. Fetch message history
    3. Build system prompt from agent config
    4. Run LLM with tools
    5. Handle tool calls (book, collect_lead, escalate)
    6. Save messages to DB
    7. Return reply
    """
    admin = get_supabase_admin()

    # ── 1. Load agent config ─────────────────────────────────────────────────
    agent_result = (
        admin.table("agents")
        .select("*, organizations(name), employee_types(base_system_prompt, name)")
        .eq("id", agent_id)
        .single()
        .execute()
    )
    if not agent_result.data:
        raise ValueError(f"Agent {agent_id} not found")

    agent = agent_result.data
    org_name = agent["organizations"]["name"]
    custom_prompt = agent.get("custom_system_prompt") or ""

    system_prompt = RECEPTIONIST_BASE_PROMPT.format(
        agent_name=agent["name"],
        org_name=org_name,
        business_context=custom_prompt or "No additional business context provided.",
        current_datetime=datetime.now().strftime("%A, %d %B %Y at %H:%M"),
    )

    # ── 2. Get or create conversation ────────────────────────────────────────
    if conversation_id:
        conv_result = (
            admin.table("conversations")
            .select("*")
            .eq("id", conversation_id)
            .single()
            .execute()
        )
        conversation = conv_result.data
    else:
        # Try to find existing open conversation for this contact + channel
        query = (
            admin.table("conversations")
            .select("*")
            .eq("agent_id", agent_id)
            .eq("channel", channel)
            .eq("status", "open")
        )
        if contact_phone:
            query = query.eq("contact_phone", contact_phone)
        elif contact_email:
            query = query.eq("contact_email", contact_email)

        existing = query.limit(1).execute()

        if existing.data:
            conversation = existing.data[0]
        else:
            new_conv = admin.table("conversations").insert({
                "agent_id": agent_id,
                "contact_phone": contact_phone,
                "contact_email": contact_email,
                "contact_name": contact_name,
                "channel": channel,
                "status": "open",
            }).execute()
            conversation = new_conv.data[0]

    conversation_id = conversation["id"]
    contact_identifier = contact_phone or contact_email or "unknown"

    # ── 3. Rate limit checks ─────────────────────────────────────────────────
    try:
        await check_contact_rate_limit(
            conversation_id=conversation_id,
            contact_identifier=contact_identifier,
        )
        await check_agent_rate_limit(agent_id=agent_id)
    except RateLimitExceeded as e:
        admin.table("agent_logs").insert({
            "agent_id": agent_id,
            "action": "rate_limited",
            "details": {"reason": e.reason, "contact": contact_identifier},
        }).execute()
        return {
            "conversation_id": conversation_id,
            "reply": e.friendly_message,
            "tools_used": [],
            "rate_limited": True,
        }

    # ── 4. Load message history (last 20 messages) ───────────────────────────
    history_result = (
        admin.table("messages")
        .select("role, content")
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=False)
        .limit(20)
        .execute()
    )
    history = history_result.data or []

    # Save inbound message
    admin.table("messages").insert({
        "conversation_id": conversation_id,
        "role": "user",
        "content": message_text,
        "channel": channel,
    }).execute()

    # Build messages list (system prompt handled inside llm.py)
    messages = [{"role": m["role"], "content": m["content"]} for m in history]
    messages.append({"role": "user", "content": message_text})

    # ── 5. Run LLM with tool support ─────────────────────────────────────────
    response = chat_with_tools(
        system_prompt=system_prompt,
        messages=messages,
        tools=AGENT_TOOLS,
    )

    message = response.choices[0].message
    finish_reason = response.choices[0].finish_reason

    reply_text = message.content or ""
    tool_results = []

    # ── 6. Handle tool calls ──────────────────────────────────────────────────
    if finish_reason == "tool_calls" and message.tool_calls:
        for tool_call in message.tool_calls:
            tool_name = tool_call.function.name
            try:
                tool_input = json.loads(tool_call.function.arguments)
            except json.JSONDecodeError:
                tool_input = {}

            result = await _execute_tool(
                tool_name=tool_name,
                tool_input=tool_input,
                agent_id=agent_id,
                organization_id=organization_id,
                conversation_id=conversation_id,
            )
            tool_results.append({"tool": tool_name, "tool_call_id": tool_call.id, "result": result})

            admin.table("agent_logs").insert({
                "agent_id": agent_id,
                "action": tool_name,
                "details": {"input": tool_input, "result": result},
            }).execute()

        # Build follow-up messages with tool results and get a text reply
        assistant_msg = {
            "role": "assistant",
            "content": message.content,  # may be None — that's fine
            "tool_calls": [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments,
                    },
                }
                for tc in message.tool_calls
            ],
        }

        tool_msgs = [
            {
                "role": "tool",
                "tool_call_id": tr["tool_call_id"],
                "content": json.dumps(tr["result"]),
            }
            for tr in tool_results
        ]

        follow_up_messages = messages + [assistant_msg] + tool_msgs
        reply_text = chat_completion(
            system_prompt=system_prompt,
            messages=follow_up_messages,
        )

    # ── 7. Save assistant reply ───────────────────────────────────────────────
    if reply_text:
        admin.table("messages").insert({
            "conversation_id": conversation_id,
            "role": "assistant",
            "content": reply_text,
            "channel": channel,
            "metadata": {"tool_results": tool_results} if tool_results else None,
        }).execute()

        admin.table("conversations").update(
            {"updated_at": datetime.now().isoformat()}
        ).eq("id", conversation_id).execute()

        admin.table("agent_logs").insert({
            "agent_id": agent_id,
            "action": "replied",
            "details": {"channel": channel, "conversation_id": conversation_id},
        }).execute()

    return {
        "conversation_id": conversation_id,
        "reply": reply_text,
        "tools_used": [t["tool"] for t in tool_results],
    }


async def _execute_tool(
    tool_name: str,
    tool_input: dict,
    agent_id: str,
    organization_id: str,
    conversation_id: str,
) -> dict:
    """Execute an agent tool and return the result."""
    admin = get_supabase_admin()

    if tool_name == "collect_lead":
        result = admin.table("leads").insert({
            "organization_id": organization_id,
            "agent_id": agent_id,
            "name": tool_input.get("name"),
            "phone": tool_input.get("phone"),
            "email": tool_input.get("email"),
            "notes": tool_input.get("notes"),
            "status": "new",
        }).execute()
        return {"lead_id": result.data[0]["id"], "status": "saved"}

    elif tool_name == "book_appointment":
        result = admin.table("bookings").insert({
            "organization_id": organization_id,
            "agent_id": agent_id,
            "conversation_id": conversation_id,
            "attendee_name": tool_input.get("attendee_name"),
            "attendee_email": tool_input.get("attendee_email"),
            "attendee_phone": tool_input.get("attendee_phone"),
            "status": "pending",
        }).execute()
        return {"booking_id": result.data[0]["id"], "status": "pending_confirmation"}

    elif tool_name == "escalate_to_human":
        admin.table("conversations").update(
            {"status": "escalated"}
        ).eq("id", conversation_id).execute()
        return {"status": "escalated", "reason": tool_input.get("reason")}

    return {"status": "unknown_tool"}

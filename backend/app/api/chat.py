from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import ChatMessage
from app.core.agent_engine import process_message
from app.integrations.supabase import get_supabase_admin
from app.dependencies import get_current_user_org

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("")
async def send_message(payload: ChatMessage, user_data=Depends(get_current_user_org)):
    """
    Unified text message handler — web chat, internal testing.
    WhatsApp/Telegram/Email come through their own webhook endpoints.
    """
    admin = get_supabase_admin()

    # Verify agent belongs to this org
    agent = (
        admin.table("agents")
        .select("id, status, organization_id")
        .eq("id", payload.agent_id)
        .eq("organization_id", user_data["organization_id"])
        .single()
        .execute()
    )
    if not agent.data:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent.data["status"] != "active":
        raise HTTPException(status_code=400, detail="Agent is not active")

    result = await process_message(
        agent_id=payload.agent_id,
        organization_id=user_data["organization_id"],
        channel=payload.channel,
        contact_phone=payload.contact_phone,
        contact_email=payload.contact_email,
        contact_name=payload.contact_name,
        message_text=payload.message,
        conversation_id=payload.conversation_id,
    )

    return result


@router.get("/conversations")
async def list_conversations(
    agent_id: str | None = None,
    channel: str | None = None,
    status: str | None = None,
    limit: int = 50,
    user_data=Depends(get_current_user_org),
):
    admin = get_supabase_admin()

    # Get all agent IDs for this org
    agents_result = (
        admin.table("agents")
        .select("id")
        .eq("organization_id", user_data["organization_id"])
        .execute()
    )
    org_agent_ids = [a["id"] for a in agents_result.data]

    if not org_agent_ids:
        return []

    query = (
        admin.table("conversations")
        .select("*, agents(name)")
        .in_("agent_id", org_agent_ids)
        .order("updated_at", desc=True)
        .limit(limit)
    )

    if agent_id:
        query = query.eq("agent_id", agent_id)
    if channel:
        query = query.eq("channel", channel)
    if status:
        query = query.eq("status", status)

    result = query.execute()
    return result.data


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    user_data=Depends(get_current_user_org),
):
    admin = get_supabase_admin()

    # Verify conversation belongs to org
    conv = (
        admin.table("conversations")
        .select("id, agent_id, agents(organization_id)")
        .eq("id", conversation_id)
        .single()
        .execute()
    )
    if not conv.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv.data["agents"]["organization_id"] != user_data["organization_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    messages = (
        admin.table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=False)
        .execute()
    )
    return messages.data

from fastapi import APIRouter, Depends
from app.integrations.supabase import get_supabase_admin
from app.dependencies import get_current_user_org

router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("")
async def get_logs(
    agent_id: str | None = None,
    action: str | None = None,
    limit: int = 100,
    user_data=Depends(get_current_user_org),
):
    """Activity feed — what agents have done, in reverse chronological order."""
    admin = get_supabase_admin()

    agents_result = (
        admin.table("agents")
        .select("id")
        .eq("organization_id", user_data["organization_id"])
        .execute()
    )
    agent_ids = [a["id"] for a in agents_result.data]

    if not agent_ids:
        return []

    query = (
        admin.table("agent_logs")
        .select("*, agents(name)")
        .in_("agent_id", agent_ids)
        .order("created_at", desc=True)
        .limit(limit)
    )
    if agent_id:
        query = query.eq("agent_id", agent_id)
    if action:
        query = query.eq("action", action)

    result = query.execute()
    return result.data


@router.get("/stats")
async def get_stats(user_data=Depends(get_current_user_org)):
    """Summary statistics for the dashboard."""
    admin = get_supabase_admin()
    org_id = user_data["organization_id"]

    agents_result = (
        admin.table("agents")
        .select("id")
        .eq("organization_id", org_id)
        .execute()
    )
    agent_ids = [a["id"] for a in agents_result.data]

    if not agent_ids:
        return {"messages_total": 0, "leads_total": 0, "bookings_total": 0, "agents_active": 0}

    # Step 1: get conversation IDs for this org's agents
    conv_result = (
        admin.table("conversations")
        .select("id")
        .in_("agent_id", agent_ids)
        .execute()
    )
    conv_ids = [c["id"] for c in (conv_result.data or [])]

    # Step 2: count messages (only possible if conversations exist)
    messages_count = 0
    if conv_ids:
        messages_result = (
            admin.table("messages")
            .select("id", count="exact")
            .in_("conversation_id", conv_ids)
            .execute()
        )
        messages_count = messages_result.count or 0

    # Count leads
    leads_result = (
        admin.table("leads")
        .select("id", count="exact")
        .eq("organization_id", org_id)
        .execute()
    )

    # Count bookings
    bookings_result = (
        admin.table("bookings")
        .select("id", count="exact")
        .eq("organization_id", org_id)
        .execute()
    )

    # Count active agents
    active_agents_result = (
        admin.table("agents")
        .select("id", count="exact")
        .eq("organization_id", org_id)
        .eq("status", "active")
        .execute()
    )

    return {
        "messages_total": messages_count,
        "leads_total": leads_result.count or 0,
        "bookings_total": bookings_result.count or 0,
        "agents_active": active_agents_result.count or 0,
    }

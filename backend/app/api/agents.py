from fastapi import APIRouter, HTTPException, Depends
from app.integrations.supabase import get_supabase_admin
from app.models.schemas import AgentCreate, AgentUpdate, AgentChannelUpdate
from app.dependencies import get_current_user_org

router = APIRouter(prefix="/agents", tags=["agents"])


@router.post("")
async def create_agent(payload: AgentCreate, user_data=Depends(get_current_user_org)):
    """Create an AI employee (subscription handled via billing endpoint)."""
    admin = get_supabase_admin()
    org_id = user_data["organization_id"]

    # Verify employee type exists
    et = admin.table("employee_types").select("*").eq("id", payload.employee_type_id).single().execute()
    if not et.data:
        raise HTTPException(status_code=404, detail="Employee type not found")

    result = admin.table("agents").insert({
        "organization_id": org_id,
        "employee_type_id": payload.employee_type_id,
        "name": payload.name,
        "custom_system_prompt": payload.custom_system_prompt,
        "voice_config": payload.voice_config or {},
        "status": "active",
    }).execute()

    agent = result.data[0]

    # Set up default channels from employee type capabilities
    capabilities = et.data.get("capabilities", [])
    channels_to_create = []
    for cap in capabilities:
        channels_to_create.append({
            "agent_id": agent["id"],
            "channel": cap,
            "is_enabled": False,
            "config": {},
        })

    if channels_to_create:
        admin.table("agent_channels").insert(channels_to_create).execute()

    return agent


@router.get("")
async def list_agents(user_data=Depends(get_current_user_org)):
    admin = get_supabase_admin()
    result = (
        admin.table("agents")
        .select("*, employee_types(*), agent_channels(*)")
        .eq("organization_id", user_data["organization_id"])
        .execute()
    )
    return result.data


@router.get("/{agent_id}")
async def get_agent(agent_id: str, user_data=Depends(get_current_user_org)):
    admin = get_supabase_admin()
    result = (
        admin.table("agents")
        .select("*, employee_types(*), agent_channels(*)")
        .eq("id", agent_id)
        .eq("organization_id", user_data["organization_id"])
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Agent not found")
    return result.data


@router.put("/{agent_id}")
async def update_agent(
    agent_id: str,
    payload: AgentUpdate,
    user_data=Depends(get_current_user_org),
):
    admin = get_supabase_admin()
    # Verify ownership
    existing = (
        admin.table("agents")
        .select("id")
        .eq("id", agent_id)
        .eq("organization_id", user_data["organization_id"])
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Agent not found")

    update_data = payload.model_dump(exclude_none=True)
    result = admin.table("agents").update(update_data).eq("id", agent_id).execute()
    return result.data[0]


@router.delete("/{agent_id}")
async def delete_agent(agent_id: str, user_data=Depends(get_current_user_org)):
    """Pause an agent (set to cancelled). Stripe subscription handled separately."""
    admin = get_supabase_admin()
    existing = (
        admin.table("agents")
        .select("id, stripe_subscription_id")
        .eq("id", agent_id)
        .eq("organization_id", user_data["organization_id"])
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Agent not found")

    admin.table("agents").update({"status": "cancelled"}).eq("id", agent_id).execute()
    return {"message": "Agent cancelled"}


@router.put("/{agent_id}/channels")
async def update_agent_channel(
    agent_id: str,
    payload: AgentChannelUpdate,
    user_data=Depends(get_current_user_org),
):
    admin = get_supabase_admin()
    # Verify ownership
    existing = (
        admin.table("agents")
        .select("id")
        .eq("id", agent_id)
        .eq("organization_id", user_data["organization_id"])
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Upsert channel config
    result = (
        admin.table("agent_channels")
        .upsert({
            "agent_id": agent_id,
            "channel": payload.channel,
            "is_enabled": payload.is_enabled,
            "config": payload.config or {},
        }, on_conflict="agent_id,channel")
        .execute()
    )
    return result.data[0]

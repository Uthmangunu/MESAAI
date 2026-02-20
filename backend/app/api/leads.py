from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from app.integrations.supabase import get_supabase_admin
from app.models.schemas import LeadCreate, LeadUpdate
from app.dependencies import get_current_user_org

router = APIRouter(prefix="/leads", tags=["leads"])


@router.get("")
async def list_leads(
    status: Optional[str] = None,
    agent_id: Optional[str] = None,
    is_hot: Optional[bool] = None,
    service_type: Optional[str] = None,
    limit: int = 100,
    user_data=Depends(get_current_user_org),
):
    admin = get_supabase_admin()
    query = (
        admin.table("leads")
        .select("*, agents(name)")
        .eq("organization_id", user_data["organization_id"])
        .order("created_at", desc=True)
        .limit(limit)
    )
    if status:
        query = query.eq("status", status)
    if agent_id:
        query = query.eq("agent_id", agent_id)
    if is_hot is not None:
        query = query.eq("is_hot", is_hot)
    if service_type:
        query = query.eq("service_type", service_type)

    result = query.execute()
    return result.data


@router.get("/{lead_id}")
async def get_lead(
    lead_id: str,
    user_data=Depends(get_current_user_org),
):
    """Get a single lead with full details including conversation transcript."""
    admin = get_supabase_admin()

    # Get lead
    lead_result = (
        admin.table("leads")
        .select("*, agents(name)")
        .eq("id", lead_id)
        .eq("organization_id", user_data["organization_id"])
        .single()
        .execute()
    )

    if not lead_result.data:
        raise HTTPException(status_code=404, detail="Lead not found")

    return lead_result.data


@router.post("")
async def create_lead(payload: LeadCreate, user_data=Depends(get_current_user_org)):
    admin = get_supabase_admin()
    result = admin.table("leads").insert({
        "organization_id": user_data["organization_id"],
        "agent_id": payload.agent_id,
        "name": payload.name,
        "phone": payload.phone,
        "email": payload.email,
        "notes": payload.notes,
        "status": "new",
    }).execute()
    return result.data[0]


@router.put("/{lead_id}")
async def update_lead(
    lead_id: str,
    payload: LeadUpdate,
    user_data=Depends(get_current_user_org),
):
    admin = get_supabase_admin()
    existing = (
        admin.table("leads")
        .select("id")
        .eq("id", lead_id)
        .eq("organization_id", user_data["organization_id"])
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Lead not found")

    update_data = payload.model_dump(exclude_none=True)
    result = admin.table("leads").update(update_data).eq("id", lead_id).execute()
    return result.data[0]


@router.delete("/{lead_id}")
async def delete_lead(lead_id: str, user_data=Depends(get_current_user_org)):
    admin = get_supabase_admin()
    existing = (
        admin.table("leads")
        .select("id")
        .eq("id", lead_id)
        .eq("organization_id", user_data["organization_id"])
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Lead not found")

    admin.table("leads").delete().eq("id", lead_id).execute()
    return {"message": "Lead deleted"}

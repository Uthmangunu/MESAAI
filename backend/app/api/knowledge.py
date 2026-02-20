"""
Knowledge Base API — CRUD for org-wide and agent-specific knowledge.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from app.integrations.supabase import get_supabase_admin
from app.models.schemas import KnowledgeCreate, KnowledgeUpdate
from app.dependencies import get_current_user_org

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.get("")
async def list_knowledge(
    agent_id: Optional[str] = None,
    category: Optional[str] = None,
    include_org_wide: bool = True,
    user_data=Depends(get_current_user_org),
):
    """
    List knowledge entries.
    - If agent_id is provided, returns agent-specific knowledge
    - If include_org_wide=True (default), also includes org-wide knowledge
    """
    admin = get_supabase_admin()
    org_id = user_data["organization_id"]

    if agent_id:
        # Verify agent belongs to org
        agent_check = (
            admin.table("agents")
            .select("id")
            .eq("id", agent_id)
            .eq("organization_id", org_id)
            .single()
            .execute()
        )
        if not agent_check.data:
            raise HTTPException(status_code=404, detail="Agent not found")

        if include_org_wide:
            # Get both org-wide (agent_id IS NULL) and agent-specific
            query = (
                admin.table("knowledge_base")
                .select("*")
                .eq("organization_id", org_id)
                .eq("is_active", True)
                .or_(f"agent_id.is.null,agent_id.eq.{agent_id}")
            )
        else:
            query = (
                admin.table("knowledge_base")
                .select("*")
                .eq("organization_id", org_id)
                .eq("agent_id", agent_id)
                .eq("is_active", True)
            )
    else:
        # Org-wide only
        query = (
            admin.table("knowledge_base")
            .select("*")
            .eq("organization_id", org_id)
            .is_("agent_id", "null")
            .eq("is_active", True)
        )

    if category:
        query = query.eq("category", category)

    result = query.order("created_at", desc=True).execute()
    return result.data


@router.get("/{knowledge_id}")
async def get_knowledge(
    knowledge_id: str,
    user_data=Depends(get_current_user_org),
):
    admin = get_supabase_admin()
    result = (
        admin.table("knowledge_base")
        .select("*")
        .eq("id", knowledge_id)
        .eq("organization_id", user_data["organization_id"])
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Knowledge entry not found")
    return result.data


@router.post("")
async def create_knowledge(
    payload: KnowledgeCreate,
    user_data=Depends(get_current_user_org),
):
    """
    Create a knowledge entry.
    - Set agent_id to make it agent-specific
    - Leave agent_id null/empty for org-wide knowledge
    """
    admin = get_supabase_admin()
    org_id = user_data["organization_id"]

    # If agent_id provided, verify it belongs to org
    if payload.agent_id:
        agent_check = (
            admin.table("agents")
            .select("id")
            .eq("id", payload.agent_id)
            .eq("organization_id", org_id)
            .single()
            .execute()
        )
        if not agent_check.data:
            raise HTTPException(status_code=404, detail="Agent not found")

    data = {
        "organization_id": org_id,
        "agent_id": payload.agent_id,
        "title": payload.title,
        "content": payload.content,
        "category": payload.category or "other",
        "is_active": True,
    }

    result = admin.table("knowledge_base").insert(data).execute()
    return result.data[0]


@router.put("/{knowledge_id}")
async def update_knowledge(
    knowledge_id: str,
    payload: KnowledgeUpdate,
    user_data=Depends(get_current_user_org),
):
    admin = get_supabase_admin()
    org_id = user_data["organization_id"]

    # Verify ownership
    existing = (
        admin.table("knowledge_base")
        .select("id")
        .eq("id", knowledge_id)
        .eq("organization_id", org_id)
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Knowledge entry not found")

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")

    result = (
        admin.table("knowledge_base")
        .update(updates)
        .eq("id", knowledge_id)
        .execute()
    )
    return result.data[0]


@router.delete("/{knowledge_id}")
async def delete_knowledge(
    knowledge_id: str,
    user_data=Depends(get_current_user_org),
):
    admin = get_supabase_admin()
    org_id = user_data["organization_id"]

    # Verify ownership
    existing = (
        admin.table("knowledge_base")
        .select("id")
        .eq("id", knowledge_id)
        .eq("organization_id", org_id)
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Knowledge entry not found")

    admin.table("knowledge_base").delete().eq("id", knowledge_id).execute()
    return {"message": "Knowledge entry deleted"}

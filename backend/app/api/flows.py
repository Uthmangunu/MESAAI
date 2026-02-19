"""
API endpoints for conversation flows and lead scoring rules.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.integrations.supabase import get_supabase_admin
from app.dependencies import get_current_user_org

router = APIRouter(prefix="/flows", tags=["flows"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class FlowCreate(BaseModel):
    employee_type_id: str
    flow_name: str
    flow_definition: dict


class FlowUpdate(BaseModel):
    flow_name: Optional[str] = None
    flow_definition: Optional[dict] = None
    is_active: Optional[bool] = None


class ScoringRuleCreate(BaseModel):
    employee_type_id: str
    rule_name: str
    conditions: dict
    score_adjustment: int


class ScoringRuleUpdate(BaseModel):
    rule_name: Optional[str] = None
    conditions: Optional[dict] = None
    score_adjustment: Optional[int] = None


# ─── Conversation Flows ───────────────────────────────────────────────────────

@router.get("")
async def list_flows(
    employee_type_id: Optional[str] = None,
    user_data=Depends(get_current_user_org)
):
    """
    List all conversation flows.
    Optionally filter by employee_type_id.
    """
    admin = get_supabase_admin()

    # Get all employee types for this org to filter flows
    org_agents = (
        admin.table("agents")
        .select("employee_type_id")
        .eq("organization_id", user_data["organization_id"])
        .execute()
    )

    org_employee_types = list(set(a["employee_type_id"] for a in org_agents.data))

    query = admin.table("conversation_flows").select("*")

    if employee_type_id:
        query = query.eq("employee_type_id", employee_type_id)
    else:
        # Show all flows for this org's employee types
        if org_employee_types:
            query = query.in_("employee_type_id", org_employee_types)

    result = query.execute()
    return result.data


@router.get("/{flow_id}")
async def get_flow(
    flow_id: str,
    user_data=Depends(get_current_user_org)
):
    """Get a specific conversation flow by ID."""
    admin = get_supabase_admin()

    result = (
        admin.table("conversation_flows")
        .select("*")
        .eq("id", flow_id)
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Flow not found")

    return result.data


@router.post("")
async def create_flow(
    flow: FlowCreate,
    user_data=Depends(get_current_user_org)
):
    """Create a new conversation flow."""
    admin = get_supabase_admin()

    result = (
        admin.table("conversation_flows")
        .insert({
            "employee_type_id": flow.employee_type_id,
            "flow_name": flow.flow_name,
            "flow_definition": flow.flow_definition,
            "is_active": True,
        })
        .execute()
    )

    return result.data[0]


@router.put("/{flow_id}")
async def update_flow(
    flow_id: str,
    flow: FlowUpdate,
    user_data=Depends(get_current_user_org)
):
    """Update a conversation flow."""
    admin = get_supabase_admin()

    update_data = {k: v for k, v in flow.dict().items() if v is not None}

    result = (
        admin.table("conversation_flows")
        .update(update_data)
        .eq("id", flow_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Flow not found")

    return result.data[0]


@router.delete("/{flow_id}")
async def delete_flow(
    flow_id: str,
    user_data=Depends(get_current_user_org)
):
    """Delete a conversation flow."""
    admin = get_supabase_admin()

    result = (
        admin.table("conversation_flows")
        .delete()
        .eq("id", flow_id)
        .execute()
    )

    return {"status": "deleted"}


# ─── Lead Scoring Rules ───────────────────────────────────────────────────────

@router.get("/scoring-rules")
async def list_scoring_rules(
    employee_type_id: Optional[str] = None,
    user_data=Depends(get_current_user_org)
):
    """List all lead scoring rules."""
    admin = get_supabase_admin()

    query = admin.table("lead_scoring_rules").select("*")

    if employee_type_id:
        query = query.eq("employee_type_id", employee_type_id)

    result = query.execute()
    return result.data


@router.post("/scoring-rules")
async def create_scoring_rule(
    rule: ScoringRuleCreate,
    user_data=Depends(get_current_user_org)
):
    """Create a new lead scoring rule."""
    admin = get_supabase_admin()

    result = (
        admin.table("lead_scoring_rules")
        .insert({
            "employee_type_id": rule.employee_type_id,
            "rule_name": rule.rule_name,
            "conditions": rule.conditions,
            "score_adjustment": rule.score_adjustment,
        })
        .execute()
    )

    return result.data[0]


@router.put("/scoring-rules/{rule_id}")
async def update_scoring_rule(
    rule_id: str,
    rule: ScoringRuleUpdate,
    user_data=Depends(get_current_user_org)
):
    """Update a lead scoring rule."""
    admin = get_supabase_admin()

    update_data = {k: v for k, v in rule.dict().items() if v is not None}

    result = (
        admin.table("lead_scoring_rules")
        .update(update_data)
        .eq("id", rule_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Rule not found")

    return result.data[0]


@router.delete("/scoring-rules/{rule_id}")
async def delete_scoring_rule(
    rule_id: str,
    user_data=Depends(get_current_user_org)
):
    """Delete a lead scoring rule."""
    admin = get_supabase_admin()

    result = (
        admin.table("lead_scoring_rules")
        .delete()
        .eq("id", rule_id)
        .execute()
    )

    return {"status": "deleted"}

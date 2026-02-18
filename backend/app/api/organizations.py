from fastapi import APIRouter, HTTPException, Depends
from app.integrations.supabase import get_supabase_admin
from app.models.schemas import OrganizationUpdate
from app.dependencies import get_current_user_org

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.get("/{org_id}")
async def get_organization(org_id: str, user_data=Depends(get_current_user_org)):
    if user_data["organization_id"] != org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    admin = get_supabase_admin()
    result = admin.table("organizations").select("*").eq("id", org_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Organization not found")
    return result.data


@router.put("/{org_id}")
async def update_organization(
    org_id: str,
    payload: OrganizationUpdate,
    user_data=Depends(get_current_user_org),
):
    if user_data["organization_id"] != org_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if user_data["role"] not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    admin = get_supabase_admin()
    update_data = payload.model_dump(exclude_none=True)
    result = admin.table("organizations").update(update_data).eq("id", org_id).execute()
    return result.data[0]

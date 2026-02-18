from fastapi import APIRouter, HTTPException, Depends
from app.integrations.supabase import get_supabase_admin
from app.dependencies import get_current_user

router = APIRouter(prefix="/employee-types", tags=["employee-types"])


@router.get("")
async def list_employee_types(current_user=Depends(get_current_user)):
    """List all available AI employee products."""
    admin = get_supabase_admin()
    result = admin.table("employee_types").select("*").eq("is_active", True).execute()
    return result.data


@router.get("/{type_id}")
async def get_employee_type(type_id: str, current_user=Depends(get_current_user)):
    admin = get_supabase_admin()
    result = (
        admin.table("employee_types")
        .select("*")
        .eq("id", type_id)
        .eq("is_active", True)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Employee type not found")
    return result.data

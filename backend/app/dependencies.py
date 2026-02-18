from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.integrations.supabase import get_supabase_admin

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Validate Supabase JWT and return the user."""
    token = credentials.credentials
    admin = get_supabase_admin()

    try:
        response = admin.auth.get_user(token)
        if response is None or response.user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
        return response.user
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


async def get_current_user_org(
    current_user=Depends(get_current_user),
):
    """Returns user + their organization_id from our users table."""
    admin = get_supabase_admin()
    result = (
        admin.table("users")
        .select("*, organizations(*)")
        .eq("id", current_user.id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found. Complete onboarding.",
        )
    return result.data

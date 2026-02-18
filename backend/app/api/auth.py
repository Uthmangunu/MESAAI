from fastapi import APIRouter, HTTPException, status, Depends
from app.integrations.supabase import get_supabase, get_supabase_admin
from app.models.schemas import SignupRequest, LoginRequest
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup")
async def signup(payload: SignupRequest):
    """Register a new user and create their organization."""
    sb = get_supabase()
    admin = get_supabase_admin()

    # 1. Create Supabase auth user
    try:
        auth_response = sb.auth.sign_up({
            "email": payload.email,
            "password": payload.password,
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not auth_response.user:
        raise HTTPException(status_code=400, detail="Signup failed")

    user_id = auth_response.user.id

    # 2. Create organization
    org_result = admin.table("organizations").insert({
        "name": payload.organization_name,
    }).execute()

    if not org_result.data:
        raise HTTPException(status_code=500, detail="Failed to create organization")

    org_id = org_result.data[0]["id"]

    # 3. Create user profile linking to org
    admin.table("users").insert({
        "id": user_id,
        "email": payload.email,
        "organization_id": org_id,
        "role": "owner",
    }).execute()

    return {
        "user_id": user_id,
        "organization_id": org_id,
        "message": "Account created. Check your email to confirm.",
    }


@router.post("/login")
async def login(payload: LoginRequest):
    """Sign in and return access token."""
    sb = get_supabase()
    try:
        response = sb.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password,
        })
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not response.session:
        raise HTTPException(status_code=401, detail="Login failed")

    return {
        "access_token": response.session.access_token,
        "refresh_token": response.session.refresh_token,
        "user": {
            "id": response.user.id,
            "email": response.user.email,
        },
    }


@router.get("/me")
async def me(current_user=Depends(get_current_user)):
    """Return current user info."""
    admin = get_supabase_admin()
    result = (
        admin.table("users")
        .select("*, organizations(*)")
        .eq("id", current_user.id)
        .single()
        .execute()
    )
    return result.data

from fastapi import APIRouter, HTTPException, Depends
from app.integrations.supabase import get_supabase_admin
from app.integrations import stripe as stripe_integration
from app.models.schemas import CheckoutRequest, PortalRequest
from app.dependencies import get_current_user_org

router = APIRouter(prefix="/billing", tags=["billing"])


@router.post("/create-checkout")
async def create_checkout(
    payload: CheckoutRequest,
    user_data=Depends(get_current_user_org),
):
    """Create a Stripe checkout session to subscribe to an AI employee."""
    admin = get_supabase_admin()
    org = user_data["organizations"]

    # Ensure org has a Stripe customer ID
    if not org.get("stripe_customer_id"):
        customer_id = stripe_integration.create_customer(
            email=user_data["email"],
            org_name=org["name"],
        )
        admin.table("organizations").update(
            {"stripe_customer_id": customer_id}
        ).eq("id", org["id"]).execute()
    else:
        customer_id = org["stripe_customer_id"]

    # Get employee type + stripe price
    et = (
        admin.table("employee_types")
        .select("stripe_price_id, name")
        .eq("id", payload.employee_type_id)
        .single()
        .execute()
    )
    if not et.data or not et.data.get("stripe_price_id"):
        raise HTTPException(
            status_code=404,
            detail="Employee type not found or no Stripe price configured",
        )

    checkout_url = stripe_integration.create_checkout_session(
        customer_id=customer_id,
        stripe_price_id=et.data["stripe_price_id"],
        metadata={
            "organization_id": org["id"],
            "employee_type_id": payload.employee_type_id,
            "agent_name": payload.agent_name,
        },
        success_url=payload.success_url,
        cancel_url=payload.cancel_url,
    )

    return {"checkout_url": checkout_url}


@router.post("/portal")
async def billing_portal(
    payload: PortalRequest,
    user_data=Depends(get_current_user_org),
):
    """Open Stripe customer portal for managing subscriptions."""
    org = user_data["organizations"]
    if not org.get("stripe_customer_id"):
        raise HTTPException(status_code=400, detail="No billing account found")

    portal_url = stripe_integration.create_billing_portal(
        customer_id=org["stripe_customer_id"],
        return_url=payload.return_url,
    )
    return {"portal_url": portal_url}


@router.get("/subscriptions")
async def list_subscriptions(user_data=Depends(get_current_user_org)):
    """List active agent subscriptions for this org."""
    admin = get_supabase_admin()
    result = (
        admin.table("agents")
        .select("id, name, status, stripe_subscription_id, employee_types(name, price_monthly)")
        .eq("organization_id", user_data["organization_id"])
        .neq("status", "cancelled")
        .execute()
    )
    return result.data

from fastapi import APIRouter, HTTPException, Depends
from app.integrations.supabase import get_supabase_admin
from app.models.schemas import BookingCreate
from app.dependencies import get_current_user_org
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.get("")
async def list_bookings(
    agent_id: str | None = None,
    status: str | None = None,
    user_data=Depends(get_current_user_org),
):
    admin = get_supabase_admin()
    query = (
        admin.table("bookings")
        .select("*, agents(name)")
        .eq("organization_id", user_data["organization_id"])
        .order("scheduled_at", desc=False)
    )
    if agent_id:
        query = query.eq("agent_id", agent_id)
    if status:
        query = query.eq("status", status)

    result = query.execute()
    return result.data


@router.post("")
async def create_booking(
    payload: BookingCreate,
    user_data=Depends(get_current_user_org),
):
    """
    Manually create a booking and optionally push to Google Calendar / Calendly.
    """
    admin = get_supabase_admin()
    org_id = user_data["organization_id"]

    # Verify agent belongs to org
    agent = (
        admin.table("agents")
        .select("id")
        .eq("id", payload.agent_id)
        .eq("organization_id", org_id)
        .single()
        .execute()
    )
    if not agent.data:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Check if Google Calendar is connected and push event
    calendar_event_id = None
    try:
        from app.integrations.google_calendar import create_event
        event = create_event(
            org_id=org_id,
            summary=f"Appointment: {payload.attendee_name}",
            start_time=payload.scheduled_at,
            attendee_email=payload.attendee_email,
        )
        calendar_event_id = event.get("id")
    except ValueError:
        pass  # Google Calendar not connected — skip silently
    except Exception as e:
        # Log the error but don't block the booking from being created
        logger.warning(f"Google Calendar sync failed for org {org_id}: {e}")

    result = admin.table("bookings").insert({
        "organization_id": org_id,
        "agent_id": payload.agent_id,
        "conversation_id": payload.conversation_id,
        "calendar_event_id": calendar_event_id,
        "scheduled_at": payload.scheduled_at.isoformat(),
        "attendee_name": payload.attendee_name,
        "attendee_email": payload.attendee_email,
        "attendee_phone": payload.attendee_phone,
        "status": "confirmed",
    }).execute()

    return result.data[0]


@router.put("/{booking_id}/cancel")
async def cancel_booking(booking_id: str, user_data=Depends(get_current_user_org)):
    admin = get_supabase_admin()
    org_id = user_data["organization_id"]

    booking = (
        admin.table("bookings")
        .select("*")
        .eq("id", booking_id)
        .eq("organization_id", org_id)
        .single()
        .execute()
    )
    if not booking.data:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Remove from Google Calendar if linked
    if booking.data.get("calendar_event_id"):
        try:
            from app.integrations.google_calendar import delete_event
            delete_event(org_id=org_id, event_id=booking.data["calendar_event_id"])
        except Exception:
            pass

    admin.table("bookings").update({"status": "cancelled"}).eq("id", booking_id).execute()
    return {"message": "Booking cancelled"}

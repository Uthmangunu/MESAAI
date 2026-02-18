"""
Google Calendar integration.
Uses OAuth2 flow — org connects their Google account via /api/integrations/google/connect.
"""

import json
import httpx
from datetime import datetime, timedelta
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from app.config import get_settings
from app.integrations.supabase import get_supabase_admin


SCOPES = ["https://www.googleapis.com/auth/calendar"]


def get_oauth_flow() -> Flow:
    settings = get_settings()
    client_config = {
        "web": {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uris": [settings.google_redirect_uri],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }
    flow = Flow.from_client_config(client_config, scopes=SCOPES)
    flow.redirect_uri = settings.google_redirect_uri
    return flow


def get_auth_url(state: str) -> str:
    flow = get_oauth_flow()
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        state=state,
        prompt="consent",
    )
    return auth_url


def exchange_code_for_tokens(code: str) -> dict:
    flow = get_oauth_flow()
    flow.fetch_token(code=code)
    creds = flow.credentials
    return {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": list(creds.scopes or []),
    }


def _get_credentials(org_id: str) -> Credentials:
    admin = get_supabase_admin()
    result = (
        admin.table("integrations")
        .select("credentials")
        .eq("organization_id", org_id)
        .eq("type", "google_calendar")
        .eq("is_connected", True)
        .single()
        .execute()
    )
    if not result.data:
        raise ValueError(f"Google Calendar not connected for org {org_id}")

    creds_data = result.data["credentials"]
    return Credentials(**creds_data)


def create_event(
    org_id: str,
    summary: str,
    start_time: datetime,
    duration_minutes: int = 60,
    attendee_email: str | None = None,
    description: str | None = None,
) -> dict:
    """Create a Google Calendar event and return the event dict."""
    creds = _get_credentials(org_id)
    service = build("calendar", "v3", credentials=creds)

    end_time = start_time + timedelta(minutes=duration_minutes)

    event_body = {
        "summary": summary,
        "description": description or "",
        "start": {
            "dateTime": start_time.isoformat(),
            "timeZone": "Europe/London",
        },
        "end": {
            "dateTime": end_time.isoformat(),
            "timeZone": "Europe/London",
        },
    }

    if attendee_email:
        event_body["attendees"] = [{"email": attendee_email}]

    event = service.events().insert(calendarId="primary", body=event_body).execute()
    return event


def delete_event(org_id: str, event_id: str):
    creds = _get_credentials(org_id)
    service = build("calendar", "v3", credentials=creds)
    service.events().delete(calendarId="primary", eventId=event_id).execute()

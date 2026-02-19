"""
Google Sheets Integration
Exports leads to Google Sheets automatically.
"""
import json
from typing import Optional
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


async def append_lead_to_sheet(
    credentials_dict: dict,
    spreadsheet_id: str,
    lead_data: dict
) -> dict:
    """
    Append a lead to a Google Sheet.

    Args:
        credentials_dict: OAuth credentials as dict
        spreadsheet_id: The Google Sheets ID
        lead_data: Lead data to append

    Returns:
        Result dict with status and updated range
    """
    try:
        # Build credentials
        creds = Credentials.from_authorized_user_info(credentials_dict)

        # Build the Sheets API service
        service = build('sheets', 'v4', credentials=creds)

        # Prepare row data
        row = [
            lead_data.get("created_at", ""),
            lead_data.get("name", ""),
            lead_data.get("phone", ""),
            lead_data.get("email", ""),
            lead_data.get("service_type", ""),
            lead_data.get("urgency", ""),
            str(lead_data.get("lead_score", 0)),
            "HOT" if lead_data.get("is_hot") else "",
            lead_data.get("source_channel", ""),
            lead_data.get("notes", ""),
            json.dumps(lead_data.get("service_data", {})),
        ]

        # Append to sheet
        body = {
            "values": [row]
        }

        result = service.spreadsheets().values().append(
            spreadsheetId=spreadsheet_id,
            range="Sheet1!A:K",  # Columns A-K
            valueInputOption="RAW",
            body=body
        ).execute()

        return {
            "status": "success",
            "updated_range": result.get("updates", {}).get("updatedRange"),
            "updated_rows": result.get("updates", {}).get("updatedRows", 0)
        }

    except HttpError as error:
        return {
            "status": "error",
            "error": str(error)
        }


async def create_lead_sheet(
    credentials_dict: dict,
    spreadsheet_name: str = "Mesa AI - Leads"
) -> Optional[str]:
    """
    Create a new Google Sheet for leads with headers.

    Returns:
        Spreadsheet ID if successful, None otherwise
    """
    try:
        creds = Credentials.from_authorized_user_info(credentials_dict)
        service = build('sheets', 'v4', credentials=creds)

        # Create spreadsheet
        spreadsheet = {
            "properties": {
                "title": spreadsheet_name
            },
            "sheets": [{
                "properties": {
                    "title": "Sheet1"
                }
            }]
        }

        result = service.spreadsheets().create(body=spreadsheet).execute()
        spreadsheet_id = result.get("spreadsheetId")

        # Add headers
        headers = [[
            "Date",
            "Name",
            "Phone",
            "Email",
            "Service Type",
            "Urgency",
            "Lead Score",
            "HOT",
            "Source Channel",
            "Notes",
            "Service Data (JSON)"
        ]]

        service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id,
            range="Sheet1!A1:K1",
            valueInputOption="RAW",
            body={"values": headers}
        ).execute()

        # Format header row (bold)
        requests = [{
            "repeatCell": {
                "range": {
                    "sheetId": 0,
                    "startRowIndex": 0,
                    "endRowIndex": 1
                },
                "cell": {
                    "userEnteredFormat": {
                        "textFormat": {
                            "bold": True
                        }
                    }
                },
                "fields": "userEnteredFormat.textFormat.bold"
            }
        }]

        service.spreadsheets().batchUpdate(
            spreadsheetId=spreadsheet_id,
            body={"requests": requests}
        ).execute()

        return spreadsheet_id

    except HttpError as error:
        print(f"Error creating sheet: {error}")
        return None


async def get_sheets_list(credentials_dict: dict) -> list:
    """
    Get list of available spreadsheets for the user.
    """
    try:
        creds = Credentials.from_authorized_user_info(credentials_dict)
        service = build('drive', 'v3', credentials=creds)

        # List spreadsheets
        results = service.files().list(
            q="mimeType='application/vnd.google-apps.spreadsheet'",
            pageSize=50,
            fields="files(id, name, createdTime)"
        ).execute()

        files = results.get('files', [])
        return files

    except HttpError as error:
        print(f"Error listing sheets: {error}")
        return []


def validate_credentials(credentials_dict: dict) -> bool:
    """
    Validate Google OAuth credentials.
    """
    try:
        creds = Credentials.from_authorized_user_info(credentials_dict)
        return creds.valid or creds.expired
    except Exception:
        return False

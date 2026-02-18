from twilio.rest import Client
from app.config import get_settings


def get_twilio_client() -> Client:
    settings = get_settings()
    return Client(settings.twilio_account_sid, settings.twilio_auth_token)


def send_whatsapp_message(to: str, body: str) -> str:
    """Send a WhatsApp message via Twilio. Returns message SID."""
    settings = get_settings()
    client = get_twilio_client()

    # Ensure 'whatsapp:' prefix
    to_number = to if to.startswith("whatsapp:") else f"whatsapp:{to}"
    from_number = settings.twilio_whatsapp_number

    message = client.messages.create(
        body=body,
        from_=from_number,
        to=to_number,
    )
    return message.sid


def validate_twilio_signature(
    url: str,
    params: dict,
    signature: str,
) -> bool:
    from twilio.request_validator import RequestValidator
    settings = get_settings()
    validator = RequestValidator(settings.twilio_auth_token)
    return validator.validate(url, params, signature)

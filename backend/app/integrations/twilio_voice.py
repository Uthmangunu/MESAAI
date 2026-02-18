from twilio.twiml.voice_response import VoiceResponse, Gather
from app.config import get_settings


def build_gather_twiml(
    action_url: str,
    agent_name: str = "your assistant",
    call_timeout_seconds: int = 600,
) -> str:
    """
    Returns TwiML that greets the caller and records their speech input.
    Twilio will POST the transcription to action_url.
    call_timeout_seconds is stored in the action URL so the handler can
    enforce a hard duration cap per turn.
    """
    response = VoiceResponse()
    gather = Gather(
        input="speech",
        action=action_url,
        method="POST",
        language="en-GB",
        speech_timeout="auto",
        timeout=5,
    )
    gather.say(
        f"Hello, you're through to {agent_name}. How can I help you today?",
        voice="Polly.Amy",  # British English voice
        language="en-GB",
    )
    response.append(gather)

    # Fallback if no input detected
    response.say("I didn't catch that. Please call back and try again.", language="en-GB")
    return str(response)


def build_say_twiml(text: str, redirect_url: str | None = None) -> str:
    """
    Returns TwiML that speaks the given text then optionally redirects
    back to listen for more input.
    """
    response = VoiceResponse()
    response.say(text, voice="Polly.Amy", language="en-GB")

    if redirect_url:
        gather = Gather(
            input="speech",
            action=redirect_url,
            method="POST",
            language="en-GB",
            speech_timeout="auto",
            timeout=5,
        )
        response.append(gather)

    return str(response)


def build_hangup_twiml(farewell_text: str = "Thank you for calling. Goodbye!") -> str:
    response = VoiceResponse()
    response.say(farewell_text, voice="Polly.Amy", language="en-GB")
    response.hangup()
    return str(response)

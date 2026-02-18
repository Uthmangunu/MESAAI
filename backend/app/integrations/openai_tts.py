from openai import AsyncOpenAI
from app.config import get_settings

_client: AsyncOpenAI | None = None


def get_openai_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        settings = get_settings()
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


async def text_to_speech(
    text: str,
    voice: str = "nova",   # nova, alloy, echo, fable, onyx, shimmer
    speed: float = 1.0,
) -> bytes:
    """Convert text to speech using OpenAI TTS. Returns MP3 bytes."""
    client = get_openai_client()

    response = await client.audio.speech.create(
        model="tts-1",
        voice=voice,
        input=text,
        speed=speed,
        response_format="mp3",
    )

    return response.content

"""
LLM wrapper using OpenRouter (OpenAI-compatible API).
Supports any model available on OpenRouter — set OPENROUTER_MODEL in config.
Default: anthropic/claude-haiku-4-5 for cost-efficient dev; swap to any model via env var.
"""
from openai import OpenAI
from app.config import get_settings

_client: OpenAI | None = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        settings = get_settings()
        _client = OpenAI(
            api_key=settings.openrouter_api_key,
            base_url="https://openrouter.ai/api/v1",
        )
    return _client


def _get_model() -> str:
    return get_settings().openrouter_model


def chat_completion(
    system_prompt: str,
    messages: list,
    model: str | None = None,
    max_tokens: int = 1024,
) -> str:
    """Simple text completion — no tool use. Returns the reply string."""
    client = get_client()
    full_messages = [{"role": "system", "content": system_prompt}] + messages
    response = client.chat.completions.create(
        model=model or _get_model(),
        max_tokens=max_tokens,
        messages=full_messages,
    )
    return response.choices[0].message.content or ""


def chat_with_tools(
    system_prompt: str,
    messages: list,
    tools: list[dict],
    model: str | None = None,
    max_tokens: int = 1024,
):
    """Completion with tool support. Returns the raw OpenAI response object."""
    client = get_client()
    full_messages = [{"role": "system", "content": system_prompt}] + messages
    return client.chat.completions.create(
        model=model or _get_model(),
        max_tokens=max_tokens,
        messages=full_messages,
        tools=tools,
        tool_choice="auto",
    )

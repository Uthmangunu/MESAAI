from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.utils.middleware import RateLimitMiddleware
from app.api import (
    auth,
    organizations,
    agents,
    employee_types,
    chat,
    voice,
    bookings,
    leads,
    billing,
    webhooks,
    logs,
    integrations,
    knowledge,
    flows,
)

settings = get_settings()

app = FastAPI(
    title="Mesa AI API",
    description="Backend API for Mesa AI — the AI employee SaaS platform",
    version="0.1.0",
)

# ─── Rate Limiting ────────────────────────────────────────────────────────────
app.add_middleware(RateLimitMiddleware)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
PREFIX = "/api"

app.include_router(auth.router, prefix=PREFIX)
app.include_router(organizations.router, prefix=PREFIX)
app.include_router(employee_types.router, prefix=PREFIX)
app.include_router(agents.router, prefix=PREFIX)
app.include_router(chat.router, prefix=PREFIX)
app.include_router(voice.router, prefix=PREFIX)
app.include_router(bookings.router, prefix=PREFIX)
app.include_router(leads.router, prefix=PREFIX)
app.include_router(billing.router, prefix=PREFIX)
app.include_router(logs.router, prefix=PREFIX)
app.include_router(integrations.router, prefix=PREFIX)
app.include_router(knowledge.router, prefix=PREFIX)
app.include_router(flows.router, prefix=PREFIX)
app.include_router(webhooks.router, prefix=PREFIX)  # No auth — Twilio/Stripe/Meta verify themselves


@app.get("/health")
async def health():
    return {"status": "ok", "service": "Mesa AI API"}


@app.get("/")
async def root():
    return {"message": "Mesa AI API — visit /docs for API reference"}

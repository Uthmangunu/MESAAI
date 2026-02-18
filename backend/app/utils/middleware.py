"""
API-level rate limiting middleware.
Limits requests per IP to protect against DoS and runaway clients.
Uses an in-memory store — sufficient for single-instance Railway deployment.
For multi-instance, swap the store for Redis.
"""

import time
from collections import defaultdict
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

# Exempt webhook paths from IP rate limiting (Twilio/Stripe have fixed IPs)
EXEMPT_PATHS = {"/api/webhooks/whatsapp", "/api/webhooks/stripe", "/api/voice/incoming", "/api/voice/respond", "/health"}

# Limits
REQUESTS_PER_MINUTE = 60
REQUESTS_PER_MINUTE_AUTH = 10  # Stricter for auth endpoints (prevent brute force)


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self._store: dict[str, list[float]] = defaultdict(list)

    def _get_limit(self, path: str) -> int:
        if path.startswith("/api/auth"):
            return REQUESTS_PER_MINUTE_AUTH
        return REQUESTS_PER_MINUTE

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Skip rate limiting for exempt paths
        if path in EXEMPT_PATHS:
            return await call_next(request)

        # Get client IP (handle proxies)
        forwarded_for = request.headers.get("X-Forwarded-For")
        client_ip = forwarded_for.split(",")[0].strip() if forwarded_for else (
            request.client.host if request.client else "unknown"
        )

        key = f"{client_ip}:{path.split('/')[2] if path.count('/') >= 2 else path}"
        now = time.time()
        window_start = now - 60  # 1-minute sliding window
        limit = self._get_limit(path)

        # Clean old entries
        self._store[key] = [t for t in self._store[key] if t > window_start]

        if len(self._store[key]) >= limit:
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please slow down.",
                headers={"Retry-After": "60"},
            )

        self._store[key].append(now)
        return await call_next(request)

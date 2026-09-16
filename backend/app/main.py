"""FastAPI entry point for the Renewi Contractor and Visitor Site Access platform."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router
from app.core.config import get_settings

settings = get_settings()
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

app = FastAPI(
    title="Renewi Contractor & Visitor Site Access API",
    description=(
        "Versioned, server-authoritative API for deterministic local contractor, "
        "visitor, compliance, QR authorization, and gate-access workflows. "
        "External services run through credential-free mock adapters by default."
    ),
    version="0.1.0",
    openapi_tags=[
        {"name": "Platform API", "description": "Operational, compliance, access, and gate endpoints."},
    ],
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
app.include_router(router)


@app.get(
    "/docs/usage",
    tags=["Platform API"],
    summary="Get local API and gate usage guidance",
    description="Explains the deterministic local authentication and opaque gate-token workflow.",
)
async def api_usage() -> dict[str, str]:
    """Describe local API usage, role header requirements, and QR privacy behavior.

    Returns:
        A concise usage map for the demo login, opaque session, and gate APIs.
    """
    return {
        "authentication": "POST /api/v1/auth/login with a seeded email and role, then send the returned opaque Bearer token on protected calls.",
        "gate": "POST /api/v1/gate/evaluate with an opaque authorization token, then POST /api/v1/gate/events after a grant.",
        "privacy": "QR tokens are opaque server-side references and do not contain personal information.",
        "providers": "OCR, identity, storage, notifications, and enterprise integrations use deterministic local adapters by default.",
    }

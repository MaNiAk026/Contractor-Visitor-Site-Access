"""Mock-first external integration adapters.

Production vendors are intentionally not inferred. Each adapter reports a
deterministic local result until an approved, credentialed implementation is
configured through environment-based provider selection.
"""

from dataclasses import dataclass

from app.core.config import get_settings


@dataclass(frozen=True)
class ProviderHealth:
    """Non-secret health and configuration state for an integration adapter."""

    name: str
    provider: str
    status: str
    detail: str


class MockIdentityVerifier:
    """Deterministic identity verifier used for local gate demonstrations."""

    def verify(self, identifier: str) -> str:
        """Return a repeatable verification result without biometric processing."""
        return "Mismatch" if "mismatch" in identifier.lower() else "Mock verification matched"


class MockOcrProvider:
    """Deterministic metadata extractor that never verifies evidence."""

    def extract(self, filename: str) -> dict[str, str | float]:
        """Return illustrative fields that require a separate human review."""
        return {
            "document_type": "sample_evidence",
            "source_filename": filename,
            "confidence": 0.82,
            "verification_state": "pending_review",
        }


class MockNotificationProvider:
    """Deterministic local notification sink."""

    def send(self, recipient: str, subject: str) -> str:
        """Return an auditable local delivery reference without sending email."""
        return f"mock-notification:{recipient}:{subject}".lower().replace(" ", "-")


# PUBLIC_INTERFACE
def integration_health() -> list[ProviderHealth]:
    """Return safe integration status metadata without exposing configuration values."""
    settings = get_settings()
    providers = {
        "OCR": settings.ocr_provider,
        "Identity verification": settings.identity_verifier_provider,
        "Notifications": settings.notification_provider,
        "Storage": settings.storage_provider,
        "HR": "mock",
        "Agency": "mock",
        "Freight exchange": "mock",
        "LMS / SHEQ": "mock",
        "Access control": "mock",
    }
    return [
        ProviderHealth(
            name=name,
            provider=provider,
            status="Connected" if provider in {"mock", "local", "demo"} else "Attention",
            detail="Deterministic local adapter active" if provider in {"mock", "local", "demo"}
            else "Production adapter is not configured.",
        )
        for name, provider in providers.items()
    ]

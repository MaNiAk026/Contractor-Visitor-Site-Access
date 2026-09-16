"""Tests for credential-free integration adapter behavior."""

from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import patch

from app.modules.integrations.adapters import (
    MockIdentityVerifier,
    MockNotificationProvider,
    MockOcrProvider,
    integration_health,
)


class MockAdapterTests(TestCase):
    """Verify local provider adapters remain deterministic and non-production."""

    def test_identity_verifier_only_uses_identifier_marker_for_mismatch(self) -> None:
        """Keep the local identity result deterministic without biometric processing."""
        verifier = MockIdentityVerifier()

        self.assertEqual(
            verifier.verify("qr_demo_7f4a91"),
            "Mock verification matched",
        )
        self.assertEqual(verifier.verify("qr_demo_mismatch_8a20"), "Mismatch")

    def test_ocr_extraction_requires_human_review(self) -> None:
        """Ensure document extraction never promotes evidence to verified."""
        extracted = MockOcrProvider().extract("licence.pdf")

        self.assertEqual(extracted["source_filename"], "licence.pdf")
        self.assertEqual(extracted["verification_state"], "pending_review")
        self.assertEqual(extracted["confidence"], 0.82)

    def test_notification_reference_is_auditable_and_credential_free(self) -> None:
        """Return a stable local delivery reference without sending a message."""
        reference = MockNotificationProvider().send(
            "Nora Jansen",
            "Expiry reminder",
        )

        self.assertEqual(
            reference,
            "mock-notification:nora-jansen:expiry-reminder",
        )

    @patch("app.modules.integrations.adapters.get_settings")
    def test_provider_health_marks_unconfigured_production_adapter_for_attention(
        self,
        get_settings_mock,
    ) -> None:
        """Expose safe non-secret readiness status for unsupported providers."""
        get_settings_mock.return_value = SimpleNamespace(
            ocr_provider="mock",
            identity_verifier_provider="demo",
            notification_provider="smtp",
            storage_provider="local",
        )

        providers = {provider.name: provider for provider in integration_health()}

        self.assertEqual(providers["OCR"].status, "Connected")
        self.assertEqual(providers["Storage"].status, "Connected")
        self.assertEqual(providers["Notifications"].status, "Attention")
        self.assertEqual(
            providers["Notifications"].detail,
            "Production adapter is not configured.",
        )

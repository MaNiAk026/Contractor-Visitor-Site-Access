"""Deterministic tests for the server-authoritative compliance service."""

from unittest import TestCase
from unittest.mock import patch

from app.modules.compliance.service import (
    ComplianceDecision,
    _status_from_reasons,
    evaluate_visit,
    run_expiry_revalidation,
)


class ComplianceStatusPrecedenceTests(TestCase):
    """Verify safety findings are converted to the correct compliance state."""

    def test_status_precedence_is_explainable_for_each_seeded_outcome(self) -> None:
        """Map deterministic findings to the safety-first status hierarchy."""
        cases = (
            (
                ["An active blacklist entry blocks access."],
                "Blocked",
            ),
            (
                ["Mandatory evidence is expired and requires renewal."],
                "Expired",
            ),
            (
                ["A required training attempt failed the configured threshold."],
                "Fail",
            ),
            (
                ["Evidence is pending human verification."],
                "Pending",
            ),
            (
                ["A controlled exception has been approved."],
                "Exception",
            ),
            (
                [
                    "Identity verification is eligible for mock confirmation.",
                    "No blacklist entry applies.",
                ],
                "Pass",
            ),
            (
                [
                    "An active blacklist entry blocks access.",
                    "Mandatory evidence is expired and requires renewal.",
                ],
                "Blocked",
            ),
        )

        for reasons, expected_status in cases:
            with self.subTest(reasons=reasons):
                self.assertEqual(_status_from_reasons(reasons), expected_status)

    @patch("app.modules.compliance.service.execute")
    @patch("app.modules.compliance.service.fetch_one")
    def test_evaluate_visit_persists_expired_evidence_reason(
        self,
        fetch_one_mock,
        execute_mock,
    ) -> None:
        """Persist an explainable expiry result instead of a status-only decision."""
        fetch_one_mock.side_effect = [
            {
                "id": "VIS-0256",
                "person_id": "PER-1016",
                "compliance_status": "Expired",
                "short_notice": False,
                "full_name": "Ravi Patel",
                "population": "maintenance_contractor",
                "company_name": "Metro Maintenance",
            },
            {
                "is_blacklisted": False,
                "has_expired_evidence": True,
                "has_pending_evidence": False,
                "has_failed_training": False,
            },
        ]

        decision = evaluate_visit("VIS-0256", "gate")

        self.assertEqual(decision.status, "Expired")
        self.assertEqual(
            decision.reasons,
            ["Mandatory evidence is expired and requires renewal."],
        )
        persisted_parameters = execute_mock.call_args.args[1]
        self.assertEqual(persisted_parameters[0], "VIS-0256")
        self.assertEqual(persisted_parameters[1], "Expired")
        self.assertEqual(persisted_parameters[3], "gate")
        self.assertIn("Mandatory evidence is expired", persisted_parameters[2])

    @patch("app.modules.compliance.service.execute")
    @patch("app.modules.compliance.service.evaluate_visit")
    @patch("app.db.fetch_all")
    def test_expiry_revalidation_notifies_only_expired_or_blocked_visits(
        self,
        fetch_all_mock,
        evaluate_visit_mock,
        execute_mock,
    ) -> None:
        """Send deterministic mock notifications only for safety-blocking outcomes."""
        fetch_all_mock.return_value = [{"id": "VIS-0248"}, {"id": "VIS-0256"}]
        evaluate_visit_mock.side_effect = [
            ComplianceDecision("Pass", ["Configured training and site rules are passed."]),
            ComplianceDecision("Expired", ["Mandatory evidence is expired and requires renewal."]),
        ]

        evaluated_count = run_expiry_revalidation()

        self.assertEqual(evaluated_count, 2)
        self.assertEqual(evaluate_visit_mock.call_count, 2)
        execute_mock.assert_called_once()
        notification_query = execute_mock.call_args.args[0]
        notification_parameters = execute_mock.call_args.args[1]
        self.assertIn("ON CONFLICT (visit_id, message)", notification_query)
        self.assertIn(
            "WHERE message LIKE 'Mock re-validation notice:%%'",
            notification_query,
        )
        self.assertEqual(notification_parameters[0], "VIS-0256")
        self.assertEqual(notification_parameters[1], "Mock re-validation notice: Expired")


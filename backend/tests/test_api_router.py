"""Handler-level integration tests for the deterministic versioned API."""

import asyncio
from datetime import datetime, timedelta, timezone
from unittest import TestCase
from unittest.mock import patch

from fastapi import HTTPException

from app.api.v1 import router
from app.models.schemas import GateDecision, GateEventRequest
from app.modules.compliance.service import ComplianceDecision


def make_granted_decision() -> GateDecision:
    """Build the server-shaped decision required by a gate event request."""
    return GateDecision(
        decision="grant",
        person={
            "name": "Nora Jansen",
            "initials": "NJ",
            "company": "Dutch Freight BV",
            "population": "External Driver",
        },
        visit={"purpose": "Waste delivery — bay 4", "site": "Vlaardingen"},
        tokenStatus="Active",
        identityStatus="Mock verification matched",
        reasons=["Configured training and site rules are passed."],
        authorizationId="PASS-8391",
    )


class AuthorizationTests(TestCase):
    """Verify role authentication fails closed before protected API work."""

    @patch.object(router, "fetch_one")
    def test_current_role_rejects_missing_or_unknown_sessions(self, fetch_one_mock) -> None:
        """Require a server-validated opaque session instead of a client role header."""
        fetch_one_mock.return_value = None
        for authorization in (None, "Bearer unknown-session"):
            with self.subTest(authorization=authorization):
                with self.assertRaises(HTTPException) as error:
                    router.current_role(authorization)

                self.assertEqual(error.exception.status_code, 401)
                self.assertIn("session", error.exception.detail)


class GateDecisionTests(TestCase):
    """Verify opaque passes are re-evaluated before every gate decision."""

    def setUp(self) -> None:
        """Set up a deterministic active authorization shared by decision tests."""
        self.authorization = {
            "authorization_id": "PASS-8391",
            "token": "qr_demo_7f4a91",
            "authorization_status": "active",
            "expires_at": datetime.now(timezone.utc) + timedelta(days=1),
            "visit_id": "VIS-0248",
            "purpose": "Waste delivery — bay 4",
            "site_name": "Vlaardingen",
            "full_name": "Nora Jansen",
            "population": "external_driver",
            "company_name": "Dutch Freight BV",
        }

    @patch.object(router, "evaluate_visit")
    @patch.object(router, "fetch_one")
    def test_active_compliant_token_grants_access_with_opaque_authorization_id(
        self,
        fetch_one_mock,
        evaluate_visit_mock,
    ) -> None:
        """Return an explainable grant only after a fresh authoritative evaluation."""
        fetch_one_mock.return_value = self.authorization
        evaluate_visit_mock.return_value = ComplianceDecision(
            "Pass",
            [
                "Required evidence is verified and in date.",
                "No blacklist entry applies.",
            ],
        )

        decision = router._gate_decision("qr_demo_7f4a91")

        self.assertEqual(decision.decision, "grant")
        self.assertEqual(decision.authorizationId, "PASS-8391")
        self.assertEqual(decision.person.initials, "NJ")
        self.assertEqual(decision.identityStatus, "Mock verification matched")
        self.assertIn("No blacklist entry applies.", decision.reasons)
        evaluate_visit_mock.assert_called_once_with("VIS-0248", "gate")

    @patch.object(router, "evaluate_visit")
    @patch.object(router, "fetch_one")
    def test_identity_mismatch_denies_even_when_compliance_passes(
        self,
        fetch_one_mock,
        evaluate_visit_mock,
    ) -> None:
        """Prevent a compliant pass from bypassing the mock identity check."""
        mismatched_authorization = {
            **self.authorization,
            "token": "qr_demo_mismatch_8a20",
        }
        fetch_one_mock.return_value = mismatched_authorization
        evaluate_visit_mock.return_value = ComplianceDecision(
            "Pass",
            ["Configured training and site rules are passed."],
        )

        decision = router._gate_decision("qr_demo_mismatch_8a20")

        self.assertEqual(decision.decision, "deny")
        self.assertEqual(decision.tokenStatus, "Active")
        self.assertEqual(decision.identityStatus, "Mismatch")
        self.assertIn(
            "Mock identity verification did not match the presented identifier.",
            decision.reasons,
        )

    def test_denied_decision_cannot_record_a_gate_event(self) -> None:
        """Reject a client-supplied denied decision before any persistence occurs."""
        denied_request = GateEventRequest(
            decision=make_granted_decision().model_copy(
                update={"decision": "deny", "authorizationId": None},
            ),
            eventType="entry",
        )

        with self.assertRaises(HTTPException) as error:
            asyncio.run(router.record_gate_event(denied_request, "gate_operator"))

        self.assertEqual(error.exception.status_code, 400)
        self.assertIn("current granted authorization", error.exception.detail)

    @patch.object(router, "execute")
    @patch.object(router, "_gate_decision")
    @patch.object(router, "fetch_one")
    def test_granted_entry_persists_gate_event_visit_state_and_audit(
        self,
        fetch_one_mock,
        gate_decision_mock,
        execute_mock,
    ) -> None:
        """Record only a freshly re-evaluated active authorization at the gate."""
        fetch_one_mock.side_effect = [
            {
                "id": "PASS-8391",
                "visit_id": "VIS-0248",
                "status": "active",
                "expires_at": datetime.now(timezone.utc) + timedelta(days=1),
            },
            {"token": "qr_demo_7f4a91"},
            None,
        ]
        gate_decision_mock.return_value = make_granted_decision()

        response = asyncio.run(
            router.record_gate_event(
                GateEventRequest(decision=make_granted_decision(), eventType="entry"),
                "gate_operator",
            )
        )

        self.assertEqual(response.recordedEvent, "Entry at Gate 2")
        self.assertEqual(execute_mock.call_count, 3)
        gate_event_parameters = execute_mock.call_args_list[0].args[1]
        visit_update_parameters = execute_mock.call_args_list[1].args[1]
        audit_parameters = execute_mock.call_args_list[2].args[1]
        self.assertEqual(gate_event_parameters, ("PASS-8391", "VIS-0248", "entry"))
        self.assertEqual(visit_update_parameters, ("active", "VIS-0248"))
        self.assertEqual(audit_parameters[0], "gate_operator")
        self.assertEqual(audit_parameters[1], "gate.entry")

class ModuleAuthorizationTests(TestCase):
    """Verify server-side role access matches the operational module contract."""

    @patch.object(router, "fetch_all")
    @patch.object(router, "execute")
    def test_driver_can_view_evidence(self, execute_mock, fetch_all_mock) -> None:
        """Drivers retain access to evidence review metadata."""
        fetch_all_mock.return_value = []

        response = asyncio.run(router.module_data("evidence", "driver"))

        self.assertEqual(response.title, "Evidence review")
        fetch_all_mock.assert_called_once()

    @patch.object(router, "fetch_all")
    @patch.object(router, "execute")
    def test_driver_cannot_view_people(self, execute_mock, fetch_all_mock) -> None:
        """Drivers cannot bypass the UI and query the people directory directly."""
        with self.assertRaises(HTTPException) as error:
            asyncio.run(router.module_data("people", "driver"))

        self.assertEqual(error.exception.status_code, 403)
        fetch_all_mock.assert_not_called()
        execute_mock.assert_not_called()

    @patch.object(router, "fetch_all")
    @patch.object(router, "execute")
    def test_gate_operator_cannot_view_audit(self, execute_mock, fetch_all_mock) -> None:
        """Gate operators are restricted to gate operations."""
        with self.assertRaises(HTTPException) as error:
            asyncio.run(router.module_data("audit", "gate_operator"))

        self.assertEqual(error.exception.status_code, 403)
        fetch_all_mock.assert_not_called()
        execute_mock.assert_not_called()

    @patch.object(router, "fetch_all")
    @patch.object(router, "execute")
    def test_platform_admin_can_view_settings(self, execute_mock, fetch_all_mock) -> None:
        """Platform administrators retain access to system settings."""
        fetch_all_mock.return_value = []

        response = asyncio.run(router.module_data("settings", "platform_admin"))

        self.assertEqual(response.title, "System settings")
        fetch_all_mock.assert_called_once()


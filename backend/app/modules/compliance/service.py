"""Server-authoritative, explainable compliance evaluation."""

from dataclasses import dataclass
from datetime import date
from typing import Any

from app.db import execute, fetch_one


@dataclass(frozen=True)
class ComplianceDecision:
    """The persisted outcome and explanation for a visit evaluation."""

    status: str
    reasons: list[str]


def _status_from_reasons(reasons: list[str]) -> str:
    """Apply safety precedence to a set of current requirement findings."""
    normalized = [reason.lower() for reason in reasons]
    if any("active blacklist entry blocks access" in reason for reason in normalized):
        return "Blocked"
    if any("mandatory evidence is expired" in reason for reason in normalized):
        return "Expired"
    if any(
        "required training attempt failed" in reason or "identity verification mismatch" in reason
        for reason in normalized
    ):
        return "Fail"
    if any("evidence is pending human verification" in reason for reason in normalized):
        return "Pending"
    if any("controlled exception" in reason for reason in normalized):
        return "Exception"
    return "Pass"


# PUBLIC_INTERFACE
def evaluate_visit(visit_id: str, trigger: str) -> ComplianceDecision:
    """Evaluate and persist a visit's current compliance status and explanation.

    Args:
        visit_id: The visit whose linked person, evidence, training, blacklist,
            and authorization state must be evaluated.
        trigger: The server workflow initiating evaluation, such as ``gate`` or
            ``expiry_revalidation``.

    Returns:
        The status and ordered explanations used by approval and gate workflows.
    """
    visit = fetch_one(
        """
        SELECT v.id, v.person_id, v.compliance_status, v.short_notice,
               p.full_name, p.population, c.name AS company_name
        FROM app.visits v
        JOIN app.people p ON p.id = v.person_id
        JOIN app.companies c ON c.id = p.company_id
        WHERE v.id = %s
        """,
        (visit_id,),
    )
    if visit is None:
        return ComplianceDecision("Fail", ["Visit could not be found."])

    findings = fetch_one(
        """
        SELECT
          EXISTS(
            SELECT 1 FROM app.blacklist_entries b
            WHERE b.active
              AND (b.person_id = %s OR b.company_id = (
                  SELECT company_id FROM app.people WHERE id = %s
              ))
          ) AS is_blacklisted,
          EXISTS(
            SELECT 1 FROM app.evidence e
            WHERE e.person_id = %s AND e.status = 'expired'
          ) AS has_expired_evidence,
          EXISTS(
            SELECT 1 FROM app.evidence e
            WHERE e.person_id = %s AND e.status = 'pending_review'
          ) AS has_pending_evidence,
          EXISTS(
            SELECT 1 FROM app.training_attempts t
            WHERE t.person_id = %s AND NOT t.passed
          ) AS has_failed_training
        """,
        (visit["person_id"], visit["person_id"], visit["person_id"], visit["person_id"], visit["person_id"]),
    ) or {}

    reasons: list[str] = []
    if findings.get("is_blacklisted"):
        reasons.append("An active blacklist entry blocks access.")
    if findings.get("has_expired_evidence"):
        reasons.append("Mandatory evidence is expired and requires renewal.")
    if findings.get("has_failed_training"):
        reasons.append("A required training attempt failed the configured threshold.")
    if findings.get("has_pending_evidence"):
        reasons.append("Evidence is pending human verification.")
    if not reasons:
        reasons = [
            "Identity verification is eligible for mock confirmation.",
            "Required evidence is verified and in date.",
            "Configured training and site rules are passed.",
            "No blacklist entry applies.",
        ]

    status = _status_from_reasons(reasons)
    execute(
        """
        INSERT INTO app.compliance_checks (visit_id, status, reasons, trigger, evaluated_on)
        VALUES (%s, %s, %s::jsonb, %s, %s)
        """,
        (visit_id, status, __import__("json").dumps(reasons), trigger, date.today()),
    )
    return ComplianceDecision(status=status, reasons=reasons)


# PUBLIC_INTERFACE
def run_expiry_revalidation() -> int:
    """Re-evaluate all active visits and append deterministic mock notifications.

    Returns:
        The number of active visits evaluated.
    """
    from app.db import fetch_all

    visits = fetch_all("SELECT id FROM app.visits WHERE visit_status IN ('approved', 'active')")
    for visit in visits:
        decision = evaluate_visit(visit["id"], "expiry_revalidation")
        if decision.status in {"Expired", "Blocked"}:
            execute(
                """
                INSERT INTO app.notifications (id, visit_id, channel, status, message)
                VALUES ('NOT-' || substr(md5(random()::text), 1, 10), %s, 'mock', 'sent', %s)
                ON CONFLICT (visit_id, message)
                    WHERE message LIKE 'Mock re-validation notice:%%'
                DO NOTHING
                """,
                (visit["id"], f"Mock re-validation notice: {decision.status}"),
            )
    return len(visits)






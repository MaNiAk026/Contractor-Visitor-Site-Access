"""Versioned REST endpoints for the Renewi access platform."""

from datetime import datetime, timedelta, timezone
import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response, status

from app.core.config import get_settings
from app.db import execute, fetch_all, fetch_one
from app.models.schemas import (
    DashboardResponse,
    GateDecision,
    GateEvaluationRequest,
    GateEventRequest,
    LoginRequest,
    ModuleResponse,
    OperationalRecord,
    SearchResult,
    SessionResponse,
)
from app.modules.compliance.service import evaluate_visit
from app.modules.integrations.adapters import MockIdentityVerifier, integration_health

router = APIRouter(prefix="/api/v1", tags=["Platform API"])

MODULE_METADATA: dict[str, tuple[str, str, list[str]]] = {
    "people": ("People directory", "Manage reusable people, readiness, and registration history.", ["New person", "Export list"]),
    "companies": ("Companies", "Review legal entities, compliance, and linked people.", ["New company", "Review compliance"]),
    "sites": ("Sites and gates", "Configure locations, country scope, and gate readiness.", ["Add site", "Gate configuration"]),
    "visits": ("Access requests", "Create, track, and reuse one-off or repeat site visits.", ["New access request", "Register short-notice driver"]),
    "evidence": ("Evidence review", "Inspect metadata, mock extraction, and human verification.", ["Upload evidence", "Verify selected"]),
    "training": ("Training and site rules", "Review versioned sample learning attempts.", ["Assign training", "Review attempts"]),
    "compliance": ("Decision centre", "Review server-authoritative readiness outcomes.", ["Approve ready visits", "Review exceptions"]),
    "blacklist": ("Blacklist governance", "Manage controlled access blocks and exceptions.", ["Add blacklist entry", "Request override"]),
    "access": ("Access passes", "Issue, revoke, and inspect opaque QR passes.", ["Issue QR pass", "Revoke pass"]),
    "audit": ("Audit trail", "Search consequential actions and trace access decisions.", ["Export audit log", "Open filters"]),
    "notifications": ("Notification history", "Track mock reminders and re-validation messages.", ["Send reminder", "Configure schedule"]),
    "integrations": ("Integration health", "Inspect mock adapter health without vendor assumptions.", ["Test mock adapter", "View configuration"]),
    "settings": ("System settings", "Maintain configured requirements and role policy.", ["New requirement rule", "Manage roles"]),
}

ROLE_LABELS = {
    "platform_admin": "Platform admin",
    "compliance": "Compliance / SHEQ",
    "site_admin": "Site administrator",
    "planner": "Planner / requester",
    "contractor": "Contractor / agency",
    "driver": "Driver / visitor",
    "gate_operator": "Gate operator",
    "auditor": "Auditor",
}

MODULE_ROLES: dict[str, tuple[str, ...]] = {
    "people": ("platform_admin", "compliance", "site_admin", "planner", "contractor", "auditor"),
    "companies": ("platform_admin", "compliance", "site_admin", "planner", "contractor", "auditor"),
    "sites": ("platform_admin", "compliance", "site_admin", "planner", "contractor", "auditor"),
    "visits": ("platform_admin", "compliance", "site_admin", "planner", "contractor", "auditor"),
    "evidence": ("platform_admin", "compliance", "contractor", "driver", "auditor"),
    "training": ("platform_admin", "compliance", "contractor", "driver"),
    "compliance": ("platform_admin", "compliance", "site_admin", "auditor"),
    "blacklist": ("platform_admin", "compliance", "site_admin", "auditor"),
    "access": ("platform_admin", "compliance", "site_admin", "planner", "contractor", "driver"),
    "audit": ("platform_admin", "compliance", "auditor"),
    "notifications": ("platform_admin", "compliance", "site_admin", "planner", "contractor", "driver", "auditor"),
    "integrations": ("platform_admin", "site_admin"),
    "settings": ("platform_admin", "site_admin"),
}


# PUBLIC_INTERFACE
def current_role(
    authorization: Annotated[str | None, Header()] = None,
) -> str:
    """Resolve an authorized local role from a server-validated opaque session."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid local demonstration session is required.",
        )

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid local demonstration session is required.",
        )

    session = fetch_one(
        """
        SELECT u.role
        FROM app.demo_sessions s
        JOIN app.users u ON u.id = s.user_id
        WHERE s.token = %s AND s.expires_at > NOW() AND u.active
        """,
        (token,),
    )
    if session is None or session["role"] not in ROLE_LABELS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The local demonstration session is expired or unavailable.",
        )
    return str(session["role"])


# PUBLIC_INTERFACE
def require_role(*roles: str):
    """Build a dependency that restricts an endpoint to one or more server roles."""
    def role_guard(role: str = Depends(current_role)) -> str:
        if role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your assigned role is not authorized for this action.",
            )
        return role

    return role_guard


def _audit(actor_role: str, action: str, detail: str, entity_id: str | None = None) -> None:
    """Append a consequential action to the immutable audit-event table."""
    execute(
        """
        INSERT INTO app.audit_events (id, actor_role, action, detail, entity_id, occurred_at)
        VALUES ('AUD-' || substr(md5(random()::text), 1, 10), %s, %s, %s, %s, NOW())
        """,
        (actor_role, action, detail, entity_id),
    )


def _record(row: dict[str, object]) -> OperationalRecord:
    """Convert the shared operation-record table shape to its API contract."""
    return OperationalRecord(
        id=str(row["id"]),
        title=str(row["title"]),
        subtitle=str(row["subtitle"]),
        status=str(row["status"]),
        updated=str(row["updated"]),
        owner=str(row["owner"]) if row.get("owner") else None,
        tags=list(row.get("tags") or []),
    )


def _gate_decision(token: str) -> GateDecision:
    """Look up an opaque authorization and calculate a fresh authoritative decision."""
    authorization = fetch_one(
        """
        SELECT a.id AS authorization_id, a.token, a.status AS authorization_status,
               a.expires_at, v.id AS visit_id, v.purpose, v.site_name,
               p.full_name, p.population, c.name AS company_name
        FROM app.access_authorizations a
        JOIN app.visits v ON v.id = a.visit_id
        JOIN app.people p ON p.id = v.person_id
        JOIN app.companies c ON c.id = p.company_id
        WHERE a.token = %s
        """,
        (token,),
    )
    if authorization is None:
        return GateDecision(
            decision="deny",
            person={"name": "Unknown person", "initials": "?", "company": "Unknown", "population": "Unknown"},
            visit={"purpose": "No valid access request", "site": "Vlaardingen"},
            tokenStatus="Unknown",
            identityStatus="Not verified",
            reasons=["The QR authorization is not recognized."],
        )

    compliance = evaluate_visit(str(authorization["visit_id"]), "gate")
    expired = authorization["expires_at"] < datetime.now(timezone.utc)
    token_active = authorization["authorization_status"] == "active" and not expired
    identity_status = MockIdentityVerifier().verify(token)
    reasons = list(compliance.reasons)
    if expired:
        reasons.insert(0, "The opaque QR authorization has expired.")
    if authorization["authorization_status"] != "active":
        reasons.insert(0, f"The QR authorization is {authorization['authorization_status']}.")
    if identity_status == "Mismatch":
        reasons.insert(0, "Mock identity verification did not match the presented identifier.")

    granted = token_active and compliance.status in {"Pass", "Exception"} and identity_status != "Mismatch"
    name = str(authorization["full_name"])
    return GateDecision(
        decision="grant" if granted else "deny",
        person={
            "name": name,
            "initials": "".join(part[0] for part in name.split()[:2]).upper(),
            "company": str(authorization["company_name"]),
            "population": str(authorization["population"]).replace("_", " ").title(),
        },
        visit={"purpose": str(authorization["purpose"]), "site": str(authorization["site_name"])},
        tokenStatus="Active" if token_active else "Denied",
        identityStatus=identity_status,
        reasons=reasons,
        authorizationId=str(authorization["authorization_id"]),
    )


@router.post(
    "/auth/login",
    response_model=SessionResponse,
    summary="Start a credential-free local demonstration session",
    description="Validates a seeded local account and returns its role session. Production authentication is intentionally adapter-bound.",
)
async def login(payload: LoginRequest) -> SessionResponse:
    """Return an opaque server-validated session for a seeded local account."""
    settings = get_settings()
    if settings.auth_provider != "demo" or settings.app_env not in {"development", "local", "test"}:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Credential-free demo authentication is disabled outside the local environment.",
        )

    account = fetch_one(
        """
        SELECT id, name, email, role, label
        FROM app.users
        WHERE email = %s AND role = %s AND active
        """,
        (payload.email, payload.role),
    )
    if account is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="The selected demo account is unavailable.")

    # The browser may select a seeded role only at sign-in. All subsequent
    # authorization resolves the role from this opaque token on the server.
    token = secrets.token_urlsafe(32)
    execute("DELETE FROM app.demo_sessions WHERE expires_at <= NOW() OR user_id = %s", (account["id"],))
    execute(
        """
        INSERT INTO app.demo_sessions (token, user_id, expires_at)
        VALUES (%s, %s, %s)
        """,
        (token, account["id"], datetime.now(timezone.utc) + timedelta(hours=8)),
    )
    return SessionResponse(**account, accessToken=token)


@router.get("/dashboard", response_model=DashboardResponse, summary="Get operations dashboard")
async def dashboard(role: str = Depends(require_role("platform_admin", "compliance", "site_admin", "planner", "contractor", "auditor"))) -> DashboardResponse:
    """Return current dashboard metrics, activity, expected visits, and on-site roster."""
    _audit(role, "dashboard.viewed", "Operations dashboard viewed.")
    visits = fetch_all("SELECT * FROM app.operational_records WHERE module = 'visits' ORDER BY sort_order LIMIT 3")
    roster = fetch_all("SELECT * FROM app.operational_records WHERE module = 'roster' ORDER BY sort_order")
    activity_rows = fetch_all("SELECT * FROM app.dashboard_activity ORDER BY sort_order")
    metrics = fetch_all("SELECT * FROM app.dashboard_metrics ORDER BY sort_order")
    return DashboardResponse(
        metrics=metrics,
        activity=activity_rows,
        visits=[_record(row) for row in visits],
        chart=[
            {"label": "06:00", "approved": 4, "denied": 0},
            {"label": "08:00", "approved": 16, "denied": 1},
            {"label": "10:00", "approved": 10, "denied": 1},
            {"label": "12:00", "approved": 7, "denied": 0},
            {"label": "14:00", "approved": 11, "denied": 1},
        ],
        roster=[_record(row) for row in roster],
    )


@router.get("/search", response_model=list[SearchResult], summary="Search operational resources")
async def search(
    q: str = Query(..., min_length=1, max_length=100, description="Case-insensitive search phrase."),
    role: str = Depends(current_role),
) -> list[SearchResult]:
    """Search deterministic locally seeded operational resources."""
    _audit(role, "search.performed", f"Search query: {q}")
    return [
        SearchResult(**row)
        for row in fetch_all(
            """
            SELECT id, "group", title, description, href
            FROM app.search_index
            WHERE lower(title || ' ' || description) LIKE lower(%s)
            ORDER BY title
            """,
            (f"%{q.strip()}%",),
        )
    ]


@router.get("/health", include_in_schema=False)
async def health_liveness() -> dict[str, str]:
    """Return lightweight liveness status without depending on PostgreSQL."""
    return {"status": "ok"}


@router.get("/ready", include_in_schema=False)
async def readiness(response: Response) -> dict[str, str]:
    """Return readiness status only after the local domain migration is available."""
    try:
        result = fetch_one("SELECT to_regclass('app.people') AS domain_table")
        if not result or result["domain_table"] is None:
            response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            return {"status": "waiting_for_migration"}
    except Exception:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "database_unavailable"}
    return {"status": "ready"}


@router.get("/{module}", response_model=ModuleResponse, summary="Get an operational module")
async def module_data(module: str, role: str = Depends(current_role)) -> ModuleResponse:
    """Return records and metadata for a supported operational module."""
    if module not in MODULE_METADATA:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Operational module was not found.")
    permitted_roles = MODULE_ROLES.get(module)
    if permitted_roles and role not in permitted_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your assigned role is not authorized to view this sensitive module.",
        )
    title, description, actions = MODULE_METADATA[module]
    _audit(role, f"{module}.viewed", f"{title} viewed.")
    if module == "audit":
        audit_rows = fetch_all(
            """
            SELECT id, actor_role, action, detail, entity_id, occurred_at
            FROM app.audit_events
            ORDER BY occurred_at DESC
            LIMIT 100
            """
        )
        records = [
            OperationalRecord(
                id=str(row["id"]),
                title=str(row["action"]).replace(".", " ").replace("_", " ").title(),
                subtitle=str(row["detail"]),
                status="Pass" if "grant" in str(row["action"]).lower() or "entry" in str(row["action"]).lower() else "Fail" if "deny" in str(row["action"]).lower() else "Active",
                updated=str(row["occurred_at"]),
                owner=str(row["actor_role"]),
                tags=[str(row["entity_id"])] if row.get("entity_id") else [],
            )
            for row in audit_rows
        ]
    elif module == "integrations":
        records = [
            OperationalRecord(
                id=f"INT-{index + 1:03}",
                title=item.name,
                subtitle=item.detail,
                status=item.status,
                updated="Local demonstration configuration",
                owner=item.provider,
                tags=["Mock adapter"],
            )
            for index, item in enumerate(integration_health())
        ]
    else:
        records = [
            _record(row)
            for row in fetch_all(
                "SELECT * FROM app.operational_records WHERE module = %s ORDER BY sort_order",
                (module,),
            )
        ]
    return ModuleResponse(
        title=title,
        description=description,
        records=records,
        # The generic module endpoint is read-only. Lifecycle mutations require
        # explicit domain APIs and must not be represented as acknowledgements.
        actions=[],
        details=[
            {"label": "Scope", "value": "Vlaardingen / NL with configurable NL/BE sites"},
            {"label": "Policy authority", "value": "Server-side compliance service"},
            {"label": "Demo data", "value": "Deterministic PostgreSQL seed"},
        ],
    )


@router.post("/gate/evaluate", response_model=GateDecision, summary="Evaluate a QR authorization at a gate")
async def evaluate_gate(
    payload: GateEvaluationRequest,
    role: str = Depends(require_role("platform_admin", "site_admin", "gate_operator")),
) -> GateDecision:
    """Re-evaluate the current authorization, compliance, and mock identity state."""
    decision = _gate_decision(payload.token.strip())
    _audit(role, f"gate.{decision.decision}", "Gate authorization evaluated.", decision.authorizationId)
    return decision


@router.post("/gate/events", response_model=GateDecision, summary="Record a gate entry or exit")
async def record_gate_event(
    payload: GateEventRequest,
    role: str = Depends(require_role("platform_admin", "site_admin", "gate_operator")),
) -> GateDecision:
    """Persist a granted entry or exit and update the current site-presence roster."""
    if payload.decision.decision != "grant" or not payload.decision.authorizationId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only a current granted authorization may record access.")
    authorization = fetch_one(
        """
        SELECT a.id, a.visit_id, a.status, a.expires_at
        FROM app.access_authorizations a
        WHERE a.id = %s
        """,
        (payload.decision.authorizationId,),
    )
    if authorization is None or authorization["status"] != "active" or authorization["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="The authorization is no longer active.")
    current = _gate_decision(fetch_one("SELECT token FROM app.access_authorizations WHERE id = %s", (authorization["id"],))["token"])
    if current.decision != "grant":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="The current authorization no longer grants access.")

    execute(
        """
        INSERT INTO app.gate_events (id, authorization_id, visit_id, event_type, gate_name, occurred_at)
        VALUES ('GATE-' || substr(md5(random()::text), 1, 10), %s, %s, %s, 'Gate 2', NOW())
        """,
        (authorization["id"], authorization["visit_id"], payload.eventType),
    )
    execute(
        "UPDATE app.visits SET visit_status = %s, updated_at = NOW() WHERE id = %s",
        ("active" if payload.eventType == "entry" else "completed", authorization["visit_id"]),
    )
    _audit(role, f"gate.{payload.eventType}", f"Gate {payload.eventType} recorded at Gate 2.", str(authorization["id"]))
    return current.model_copy(
        update={"recordedEvent": f"{payload.eventType.title()} at Gate 2"}
    )





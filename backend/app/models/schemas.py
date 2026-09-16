"""Pydantic request and response models for the versioned REST API."""

from typing import Literal

from pydantic import BaseModel, Field


class SessionResponse(BaseModel):
    """Authenticated demonstration session returned after demo login."""

    id: str = Field(..., description="Stable local demonstration user identifier.")
    name: str = Field(..., description="Display name of the signed-in user.")
    email: str = Field(..., description="Demonstration email address.")
    role: str = Field(..., description="Server-authorized role identifier.")
    label: str = Field(..., description="Human-readable role label.")
    accessToken: str = Field(
        ...,
        description="Short-lived opaque local session token for protected API requests.",
    )


class LoginRequest(BaseModel):
    """Credential-free local demonstration sign-in request."""

    email: str = Field(..., min_length=3, description="Selected local demo account email.")
    role: str = Field(..., min_length=3, description="Requested local demo role.")


class OperationalRecord(BaseModel):
    """A compact operation-list record consumed by the frontend workspace."""

    id: str
    title: str
    subtitle: str
    status: str
    updated: str
    owner: str | None = None
    tags: list[str] = Field(default_factory=list)


class Metric(BaseModel):
    """A summarized dashboard metric."""

    label: str
    value: str
    change: str
    status: Literal["neutral", "success", "warning", "danger"]
    target: str


class Activity(BaseModel):
    """An auditable recent activity item."""

    id: str
    action: str
    detail: str
    actor: str
    time: str
    status: Literal["success", "warning", "danger"]


class DashboardResponse(BaseModel):
    """Operations dashboard data sourced from the authoritative backend."""

    metrics: list[Metric]
    activity: list[Activity]
    visits: list[OperationalRecord]
    chart: list[dict[str, int | str]]
    roster: list[OperationalRecord]


class ModuleResponse(BaseModel):
    """Generic operational-module response for list and detail workspaces."""

    title: str
    description: str
    records: list[OperationalRecord]
    actions: list[str]
    details: list[dict[str, str]]


class SearchResult(BaseModel):
    """A globally searchable operational resource."""

    id: str
    group: Literal["People", "Companies", "Visits", "Sites", "Access passes"]
    title: str
    description: str
    href: str


class ActionRequest(BaseModel):
    """A requested operational action from a role-authorized frontend form."""

    module: str = Field(..., description="Operational module containing the action.")
    action: str = Field(..., description="Named action selected by the user.")
    values: dict[str, str] | None = Field(
        default=None,
        description="Validated form values. Sensitive evidence bytes are never accepted here.",
    )


class ActionResponse(BaseModel):
    """Acknowledgement for an auditable operational action."""

    message: str


class GatePerson(BaseModel):
    """Privacy-minimized person details shown to an authorized gate operator."""

    name: str
    initials: str
    company: str
    population: str


class GateVisit(BaseModel):
    """The visit context relevant to a gate decision."""

    purpose: str
    site: str


class GateDecision(BaseModel):
    """Explainable server-authoritative gate decision."""

    decision: Literal["grant", "deny"]
    person: GatePerson
    visit: GateVisit
    tokenStatus: str
    identityStatus: str
    reasons: list[str]
    authorizationId: str | None = Field(
        default=None,
        description="Opaque internal authorization identifier used only for an event follow-up.",
    )
    recordedEvent: str | None = None


class GateEvaluationRequest(BaseModel):
    """A QR scan or fallback opaque identifier submitted at a gate."""

    token: str = Field(
        ...,
        min_length=3,
        max_length=256,
        description="Opaque QR authorization token or a local mock fallback identifier.",
    )


class GateEventRequest(BaseModel):
    """A gate entry or exit request based on a preceding server decision."""

    decision: GateDecision = Field(..., description="Previous authoritative gate decision.")
    eventType: Literal["entry", "exit"] = Field(..., description="Physical access event to record.")

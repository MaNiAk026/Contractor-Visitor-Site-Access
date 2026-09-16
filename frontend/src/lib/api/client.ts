import {
  dashboardFixture,
  getDemoSession,
  getModuleFixture,
  searchFixture
} from "@/lib/api/fixtures";
import { getSession } from "@/lib/auth/session";
import type {
  ActionPayload,
  DashboardData,
  GateDecision,
  ModuleData,
  OperationalModule,
  SearchResult,
  Session
} from "@/lib/api/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

class ApiError extends Error {
  /** Normalized error from a failed API request. */
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError("No API endpoint has been configured.");
  }

  const session = getSession();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...init?.headers
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null;
    throw new ApiError(body?.detail ?? "The request could not be completed.", response.status);
  }

  return response.json() as Promise<T>;
}

/**
 * Typed frontend boundary for the versioned backend REST contract.
 *
 * A configured API URL uses the FastAPI backend. With no URL configured, the
 * deterministic fixture transport remains available for credential-free local
 * frontend development and focused component tests.
 */
export const apiClient = {
  /**
   * Authenticates a user through the configured API or deterministic local role fixture.
   *
   * @param credentials - Demo role and email selected at sign-in.
   * @returns The authenticated role session.
   */
  async signIn(credentials: { email: string; role: string }): Promise<Session> {
    if (!API_BASE_URL) {
      return getDemoSession(credentials.role as Session["role"], credentials.email);
    }

    return request<Session>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials)
    });
  },

  /**
   * Retrieves top-level operations dashboard data.
   *
   * @returns Dashboard metrics, charts, activities, and roster records.
   */
  async getDashboard(): Promise<DashboardData> {
    return API_BASE_URL ? request<DashboardData>("/api/v1/dashboard") : dashboardFixture;
  },

  /**
   * Retrieves data for an operational module.
   *
   * @param module - Module resource selected by the route.
   * @returns Module title, records, details, and available actions.
   */
  async getModule(module: OperationalModule): Promise<ModuleData> {
    if (module === "dashboard") {
      return {
        title: "Operations overview",
        description: "Current activity and readiness across the selected site.",
        records: dashboardFixture.visits,
        actions: [],
        details: []
      };
    }

    return API_BASE_URL
      ? request<ModuleData>(`/api/v1/${module}`)
      : getModuleFixture(module);
  },

  /**
   * Searches the global indexed operational entities.
   *
   * @param query - Search phrase supplied by the user.
   * @returns Grouped clickable results.
   */
  async search(query: string): Promise<SearchResult[]> {
    if (API_BASE_URL) {
      return request<SearchResult[]>(`/api/v1/search?q=${encodeURIComponent(query)}`);
    }

    const normalized = query.toLowerCase().trim();
    return searchFixture.filter((result) =>
      `${result.title} ${result.description} ${result.group}`.toLowerCase().includes(normalized)
    );
  },

  /**
   * Sends a domain action to the appropriate versioned endpoint.
   *
   * @param payload - Action name, route module, and validated form values.
   * @returns A successful action response.
   */
  async performAction(payload: ActionPayload): Promise<{ message: string }> {
    if (!API_BASE_URL) {
      return { message: `${payload.action} completed in local demonstration mode.` };
    }

    return request<{ message: string }>(`/api/v1/${payload.module}/actions`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  /**
   * Evaluates an opaque gate token through the authoritative gate endpoint.
   *
   * @param token - QR scanner result or fallback opaque identifier.
   * @returns An explainable grant or deny decision.
   */
  async evaluateGate(token: string): Promise<GateDecision> {
    if (API_BASE_URL) {
      return request<GateDecision>("/api/v1/gate/evaluate", {
        method: "POST",
        body: JSON.stringify({ token })
      });
    }

    const normalized = token.trim().toLowerCase();
    if (normalized.includes("deny") || normalized.includes("expired") || normalized.includes("blocked")) {
      return {
        decision: "deny",
        person: { name: "Ravi Patel", initials: "RP", company: "Metro Maintenance", population: "Maintenance contractor" },
        visit: { purpose: "Forklift safety inspection", site: "Vlaardingen" },
        tokenStatus: "Denied",
        identityStatus: "Matched",
        reasons: ["VCA certificate expired on 15 September 2026.", "Access remains blocked until verified renewed evidence is approved."]
      };
    }

    return {
      decision: "grant",
      person: { name: "Nora Jansen", initials: "NJ", company: "Dutch Freight BV", population: "External driver" },
      visit: { purpose: "Waste delivery — bay 4", site: "Vlaardingen" },
      tokenStatus: "Active",
      identityStatus: "Mock verification matched",
      reasons: ["Identity verified", "Driving licence valid", "SHEQ training passed", "Vlaardingen site rules passed", "No blacklist entry"]
    };
  },

  /**
   * Persists an entry or exit decision through the gate service.
   *
   * @param decision - Previous server-authoritative gate result being acted on.
   * @param eventType - Entry or exit event requested by the operator.
   * @returns The refreshed decision with its recorded event message.
   */
  async recordGateEvent(decision: GateDecision, eventType: "entry" | "exit"): Promise<GateDecision> {
    if (API_BASE_URL) {
      return request<GateDecision>("/api/v1/gate/events", {
        method: "POST",
        body: JSON.stringify({ decision, eventType })
      });
    }

    return {
      ...decision,
      recordedEvent: eventType === "entry" ? "Entry at Gate 2" : "Exit at Gate 2"
    };
  }
};

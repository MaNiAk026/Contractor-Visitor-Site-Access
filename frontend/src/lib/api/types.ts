export type Role =
  | "platform_admin"
  | "compliance"
  | "site_admin"
  | "planner"
  | "contractor"
  | "driver"
  | "gate_operator"
  | "auditor";

export type ComplianceStatus = "Pass" | "Pending" | "Fail" | "Expired" | "Blocked" | "Exception";

export const OPERATIONAL_MODULES = [
  "dashboard",
  "people",
  "companies",
  "sites",
  "visits",
  "evidence",
  "training",
  "compliance",
  "blacklist",
  "access",
  "audit",
  "notifications",
  "integrations",
  "settings"
] as const;

export type OperationalModule = (typeof OPERATIONAL_MODULES)[number];

export interface Session {
  id: string;
  name: string;
  email: string;
  role: Role;
  label: string;
  /**
   * Opaque server-issued credential used for protected backend requests.
   * Fixture-only frontend sessions intentionally omit this field.
   */
  accessToken?: string;
}

export interface NavigationItem {
  label: string;
  href: string;
  icon: string;
  roles: Role[];
}

export interface Metric {
  label: string;
  value: string;
  change: string;
  status: "neutral" | "success" | "warning" | "danger";
  target: string;
}

export interface OperationalRecord {
  id: string;
  title: string;
  subtitle: string;
  status: ComplianceStatus | "Active" | "Issued" | "Connected" | "Attention";
  updated: string;
  owner?: string;
  tags?: string[];
}

export interface Activity {
  id: string;
  action: string;
  detail: string;
  actor: string;
  time: string;
  status: "success" | "warning" | "danger";
}

export interface DashboardData {
  metrics: Metric[];
  activity: Activity[];
  visits: OperationalRecord[];
  chart: Array<{ label: string; approved: number; denied: number }>;
  roster: OperationalRecord[];
}

export interface ModuleData {
  title: string;
  description: string;
  records: OperationalRecord[];
  actions: string[];
  details: Array<{ label: string; value: string }>;
}

export interface GateDecision {
  decision: "grant" | "deny";
  person: {
    name: string;
    initials: string;
    company: string;
    population: string;
  };
  visit: {
    purpose: string;
    site: string;
  };
  tokenStatus: string;
  identityStatus: string;
  reasons: string[];
  authorizationId?: string;
  recordedEvent?: string;
}

export interface SearchResult {
  id: string;
  group: "People" | "Companies" | "Visits" | "Sites" | "Access passes";
  title: string;
  description: string;
  href: string;
}

export interface ActionPayload {
  module: OperationalModule;
  action: string;
  values?: Record<string, string>;
}

export function isOperationalModule(value: string): value is OperationalModule {
  return (OPERATIONAL_MODULES as readonly string[]).includes(value);
}

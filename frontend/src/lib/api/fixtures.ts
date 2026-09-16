import type {
  DashboardData,
  ModuleData,
  NavigationItem,
  OperationalModule,
  Role,
  SearchResult,
  Session
} from "@/lib/api/types";

export const DEMO_ACCOUNTS: Session[] = [
  { id: "u-admin", name: "Elise van Dijk", email: "admin@demo.renewi.local", role: "platform_admin", label: "Platform admin" },
  { id: "u-sheq", name: "Milan Bakker", email: "sheq@demo.renewi.local", role: "compliance", label: "Compliance / SHEQ" },
  { id: "u-site", name: "Joost Visser", email: "site@demo.renewi.local", role: "site_admin", label: "Site administrator" },
  { id: "u-planner", name: "Lara de Wit", email: "planner@demo.renewi.local", role: "planner", label: "Planner / requester" },
  { id: "u-agency", name: "Amina Khan", email: "agency@demo.renewi.local", role: "contractor", label: "Contractor / agency" },
  { id: "u-driver", name: "Nora Jansen", email: "driver@demo.renewi.local", role: "driver", label: "Driver / visitor" },
  { id: "u-gate", name: "Samira El Idrissi", email: "gate@demo.renewi.local", role: "gate_operator", label: "Gate operator" },
  { id: "u-audit", name: "Willem Smit", email: "audit@demo.renewi.local", role: "auditor", label: "Auditor" }
];

export const navigationItems: NavigationItem[] = [
  { label: "Overview", href: "/dashboard", icon: "LayoutDashboard", roles: ["platform_admin", "compliance", "site_admin", "planner", "contractor", "auditor"] },
  { label: "People", href: "/people", icon: "Users", roles: ["platform_admin", "compliance", "site_admin", "planner", "contractor", "auditor"] },
  { label: "Companies", href: "/companies", icon: "Building2", roles: ["platform_admin", "compliance", "site_admin", "planner", "contractor", "auditor"] },
  { label: "Sites", href: "/sites", icon: "MapPin", roles: ["platform_admin", "compliance", "site_admin", "planner", "contractor", "auditor"] },
  { label: "Visits", href: "/visits", icon: "CalendarDays", roles: ["platform_admin", "compliance", "site_admin", "planner", "contractor", "auditor"] },
  { label: "Evidence", href: "/evidence", icon: "FileCheck2", roles: ["platform_admin", "compliance", "contractor", "driver", "auditor"] },
  { label: "Training", href: "/training", icon: "GraduationCap", roles: ["platform_admin", "compliance", "contractor", "driver"] },
  { label: "Compliance", href: "/compliance", icon: "ShieldCheck", roles: ["platform_admin", "compliance", "site_admin", "auditor"] },
  { label: "Access passes", href: "/access", icon: "QrCode", roles: ["platform_admin", "compliance", "site_admin", "planner", "contractor", "driver"] },
  { label: "Live gate", href: "/gate", icon: "ScanLine", roles: ["platform_admin", "site_admin", "gate_operator"] },
  { label: "Audit trail", href: "/audit", icon: "ScrollText", roles: ["platform_admin", "compliance", "auditor"] },
  { label: "Settings", href: "/settings", icon: "Settings2", roles: ["platform_admin", "site_admin"] }
];

export const dashboardFixture: DashboardData = {
  metrics: [
    { label: "Expected today", value: "48", change: "+6 since yesterday", status: "neutral", target: "/visits" },
    { label: "Currently on site", value: "19", change: "7 drivers · 12 contractors", status: "success", target: "/visits" },
    { label: "Ready to approve", value: "12", change: "4 need reviewer action", status: "warning", target: "/compliance" },
    { label: "Access denied", value: "3", change: "All decisions explained", status: "danger", target: "/audit" }
  ],
  chart: [
    { label: "06:00", approved: 4, denied: 0 },
    { label: "08:00", approved: 16, denied: 1 },
    { label: "10:00", approved: 10, denied: 1 },
    { label: "12:00", approved: 7, denied: 0 },
    { label: "14:00", approved: 11, denied: 1 }
  ],
  visits: [
    { id: "VIS-0248", title: "Nora Jansen", subtitle: "Dutch Freight BV · External driver", status: "Pass", updated: "Arrives 10:30", owner: "Lara de Wit", tags: ["Vlaardingen", "Short notice"] },
    { id: "VIS-0251", title: "Daan van Leeuwen", subtitle: "Westport Logistics · Temporary driver", status: "Pending", updated: "Arrives 11:15", owner: "Milan Bakker", tags: ["ID review"] },
    { id: "VIS-0255", title: "Sofie Vermeer", subtitle: "Vandermeer Services · Visitor", status: "Pass", updated: "Arrives 13:00", owner: "Lara de Wit", tags: ["Hosted"] }
  ],
  roster: [
    { id: "VIS-0231", title: "Omar Benali", subtitle: "Rotterdam Haulage · External driver", status: "Active", updated: "Entered 08:12", owner: "Gate 2" },
    { id: "VIS-0238", title: "Maaike Vos", subtitle: "CleanWaste Partners · Contractor", status: "Active", updated: "Entered 08:46", owner: "Gate 1" },
    { id: "VIS-0240", title: "Noah de Boer", subtitle: "Vlaar Transport · Temporary driver", status: "Active", updated: "Entered 09:03", owner: "Gate 2" }
  ],
  activity: [
    { id: "ACT-01", action: "Evidence verified", detail: "Driving licence for Nora Jansen approved", actor: "Milan Bakker", time: "8 min ago", status: "success" },
    { id: "ACT-02", action: "Gate access denied", detail: "Daan van Leeuwen — identity review needed", actor: "Samira El Idrissi", time: "16 min ago", status: "danger" },
    { id: "ACT-03", action: "Training completed", detail: "Site rules assessment: 92% score", actor: "Omar Benali", time: "24 min ago", status: "success" },
    { id: "ACT-04", action: "Expiry reminder sent", detail: "VCA certificate expires in 14 days", actor: "Renewi notification service", time: "31 min ago", status: "warning" }
  ]
};

const baseRecords = [
  { id: "PER-1008", title: "Nora Jansen", subtitle: "Dutch Freight BV · External driver", status: "Pass" as const, updated: "Updated today", owner: "Lara de Wit", tags: ["Vlaardingen", "CE licence"] },
  { id: "PER-1012", title: "Daan van Leeuwen", subtitle: "Westport Logistics · Temporary driver", status: "Pending" as const, updated: "Evidence uploaded 15 min ago", owner: "Milan Bakker", tags: ["ID review"] },
  { id: "PER-1016", title: "Ravi Patel", subtitle: "Metro Maintenance · Maintenance contractor", status: "Expired" as const, updated: "VCA expired yesterday", owner: "Milan Bakker", tags: ["Re-validation"] },
  { id: "PER-1021", title: "Eva de Groot", subtitle: "GreenLoop Services · Permanent contractor", status: "Fail" as const, updated: "Site rules assessment: 65%", owner: "Milan Bakker", tags: ["Training"] },
  { id: "PER-1023", title: "Tom van Dalen", subtitle: "Independent carrier · External driver", status: "Blocked" as const, updated: "Active blacklist entry", owner: "Compliance team", tags: ["Safety exception"] }
];

const moduleTitles: Record<Exclude<OperationalModule, "dashboard">, [string, string, string[]]> = {
  people: ["People directory", "Manage reusable people, their readiness, and registration history.", ["New person", "Export list"]],
  companies: ["Companies", "Review legal entities, corporate compliance, and linked people.", ["New company", "Review compliance"]],
  sites: ["Sites and gates", "Configure locations, country scope, and operational gate readiness.", ["Add site", "Gate configuration"]],
  visits: ["Access requests", "Create, track, and reuse one-off or repeat site visits.", ["New access request", "Register short-notice driver"]],
  evidence: ["Evidence review", "Inspect uploaded evidence, mock extraction fields, confidence, and human verification.", ["Upload evidence", "Verify selected"]],
  training: ["Training and site rules", "Assign sample learning modules and record versioned assessment outcomes.", ["Assign training", "Review attempts"]],
  compliance: ["Decision centre", "Review the server-authoritative readiness state and the requirements behind every outcome.", ["Approve ready visits", "Review exceptions"]],
  blacklist: ["Blacklist governance", "Manage person and company blocks with controlled, fully auditable overrides.", ["Add blacklist entry", "Request override"]],
  access: ["Access passes", "Issue, revoke, reissue, and inspect opaque QR access-token lifecycle states.", ["Issue QR pass", "Revoke pass"]],
  audit: ["Audit trail", "Search consequential actions and trace gate decisions to their evidence and checks.", ["Export audit log", "Open filters"]],
  notifications: ["Notification history", "Track local mock reminders, approvals, and re-validation delivery outcomes.", ["Send reminder", "Configure schedule"]],
  integrations: ["Integration health", "Inspect mock provider health and production configuration readiness without vendor assumptions.", ["Test mock adapter", "View configuration"]],
  settings: ["System settings", "Maintain site rules, roles, requirement templates, and controlled policy configuration.", ["New requirement rule", "Manage roles"]]
};

export function getModuleFixture(module: Exclude<OperationalModule, "dashboard">): ModuleData {
  const [title, description, actions] = moduleTitles[module];
  const records = module === "companies"
    ? baseRecords.map((record, index) => ({ ...record, id: `COM-${index + 201}`, title: record.subtitle.split(" · ")[0], subtitle: `${index + 2} linked people · Corporate evidence`, updated: record.updated }))
    : module === "sites"
      ? [
          { id: "SITE-001", title: "Vlaardingen", subtitle: "Netherlands · 2 active gates", status: "Active" as const, updated: "Gate connectivity healthy", owner: "Joost Visser", tags: ["Pilot site"] },
          { id: "SITE-002", title: "Rotterdam", subtitle: "Netherlands · Configuration draft", status: "Attention" as const, updated: "Rule configuration in review", owner: "Platform admin", tags: ["Future site"] }
        ]
      : baseRecords;

  return {
    title,
    description,
    records,
    actions: [],
    details: [
      { label: "Scope", value: "Vlaardingen / NL" },
      { label: "Policy authority", value: "Server-side compliance service" },
      { label: "Demo data", value: "Deterministic local fixtures" }
    ]
  };
}

export const searchFixture: SearchResult[] = [
  { id: "PER-1008", group: "People", title: "Nora Jansen", description: "External driver · Dutch Freight BV", href: "/people" },
  { id: "COM-201", group: "Companies", title: "Dutch Freight BV", description: "Corporate compliance: pass", href: "/companies" },
  { id: "VIS-0248", group: "Visits", title: "Nora Jansen — 10:30 arrival", description: "Vlaardingen · access ready", href: "/visits" },
  { id: "SITE-001", group: "Sites", title: "Vlaardingen", description: "Netherlands · Gate 1 and Gate 2", href: "/sites" },
  { id: "PASS-8391", group: "Access passes", title: "qr_demo_7f4a91", description: "Active opaque QR pass", href: "/access" }
];

export function getDemoSession(role: Role, email: string): Session {
  return DEMO_ACCOUNTS.find((account) => account.role === role) ??
    DEMO_ACCOUNTS.find((account) => account.email === email) ??
    DEMO_ACCOUNTS[0];
}



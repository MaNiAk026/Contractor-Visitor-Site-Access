"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileWarning,
  Filter,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  X
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { z } from "zod";
import { apiClient } from "@/lib/api/client";
import type { DashboardData, ModuleData, OperationalModule, OperationalRecord } from "@/lib/api/types";

interface OperationsWorkspaceProps {
  module: OperationalModule;
  data?: DashboardData | ModuleData;
  isLoading: boolean;
  error?: string;
  onRetry: () => void;
}

const requestSchema = z.object({
  subject: z.string().min(2, "Enter at least two characters."),
  site: z.string().min(1, "Choose a site."),
  purpose: z.string().min(4, "Describe the purpose of the visit.")
});

type RequestValues = z.infer<typeof requestSchema>;

function useModalKeyboard(onClose: () => void) {
  const dialogRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const selector = "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";
    const dialog = dialogRef.current;
    const initialFocus = dialog?.querySelector<HTMLElement>("[data-dialog-initial-focus]") ??
      dialog?.querySelector<HTMLElement>(selector) ??
      dialog;
    initialFocus?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(selector));
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      returnFocusRef.current?.focus();
    };
  }, [onClose]);

  return dialogRef;
}

function StatusBadge({ status }: { status: OperationalRecord["status"] }) {
  const normalized = status.toLowerCase().replace(/\s/g, "-");
  return <span className={`status-badge status-${normalized}`}>{status}</span>;
}

function PageSkeleton() {
  return (
    <div className="page-stack" aria-label="Loading module" role="status">
      <div className="skeleton skeleton-title" />
      <div className="skeleton-grid">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
      <div className="skeleton skeleton-table" />
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section className="state-panel state-error" role="alert">
      <AlertTriangle size={30} aria-hidden="true" />
      <div><h1>We could not load this workspace</h1><p>{message}</p></div>
      <button className="button button-secondary" type="button" onClick={onRetry}><RefreshCw size={17} /> Try again</button>
    </section>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <section className="state-panel">
      <ClipboardCheck size={30} aria-hidden="true" />
      <div><h2>{title}</h2><p>{description}</p></div>
    </section>
  );
}

function ModuleActionDialog({
  module,
  action,
  onClose,
  onComplete
}: {
  module: OperationalModule;
  action: string;
  onClose: () => void;
  onComplete: (message: string) => void;
}) {
  const dialogRef = useModalKeyboard(onClose);
  const form = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { subject: "", site: "Vlaardingen", purpose: "" }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (values: RequestValues) => {
    setIsSubmitting(true);
    try {
      const result = await apiClient.performAction({ module, action, values });
      onComplete(result.message);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section ref={dialogRef} className="action-dialog" role="dialog" aria-modal="true" aria-labelledby="action-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-heading">
          <div><p className="eyebrow">{module}</p><h2 id="action-title">{action}</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog" data-dialog-initial-focus><X size={20} /></button>
        </div>
        <p className="muted">The request is validated locally and sent through the typed API client. The backend will become the system of record in STEP-03.</p>
        <form className="form-stack" onSubmit={form.handleSubmit(submit)} noValidate>
          <label htmlFor="action-subject">Person or company
            <input id="action-subject" placeholder="e.g. Nora Jansen" {...form.register("subject")} />
            {form.formState.errors.subject && <span className="field-error">{form.formState.errors.subject.message}</span>}
          </label>
          <label htmlFor="action-site">Site
            <select id="action-site" {...form.register("site")}><option>Vlaardingen</option><option>Rotterdam</option></select>
          </label>
          <label htmlFor="action-purpose">Purpose or reason
            <textarea id="action-purpose" placeholder="Describe the operational reason for this action." {...form.register("purpose")} />
            {form.formState.errors.purpose && <span className="field-error">{form.formState.errors.purpose.message}</span>}
          </label>
          <div className="dialog-actions">
            <button className="button button-secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Savingâ€¦" : "Confirm action"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function RecordTable({ records, onOpen }: { records: OperationalRecord[]; onOpen: (record: OperationalRecord) => void }) {
  const [filter, setFilter] = useState<"all" | "attention" | "ready">("all");
  const [search, setSearch] = useState("");

  const filteredRecords = useMemo(() => records.filter((record) => {
    const matchingFilter = filter === "all" ||
      (filter === "attention" && ["Pending", "Fail", "Expired", "Blocked", "Attention"].includes(record.status)) ||
      (filter === "ready" && ["Pass", "Active", "Issued", "Connected"].includes(record.status));
    return matchingFilter && `${record.title} ${record.subtitle} ${record.id}`.toLowerCase().includes(search.toLowerCase());
  }), [filter, records, search]);

  return (
    <section className="data-panel">
      <div className="table-toolbar">
        <div className="table-search"><Search size={17} aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search records" aria-label="Search module records" /></div>
        <div className="filter-controls" aria-label="Filter records">
          <Filter size={16} aria-hidden="true" />
          {(["all", "attention", "ready"] as const).map((option) => <button key={option} type="button" className={filter === option ? "filter-active" : ""} onClick={() => setFilter(option)}>{option}</button>)}
        </div>
      </div>

      <div className="record-table-wrapper">
        <table className="record-table">
          <thead><tr><th>Record</th><th>Status</th><th>Latest update</th><th>Owner</th><th><span className="sr-only">Open detail</span></th></tr></thead>
          <tbody>
            {filteredRecords.map((record) => (
              <tr key={record.id}>
                <td><strong>{record.title}</strong><span>{record.subtitle}</span><small>{record.id}</small></td>
                <td><StatusBadge status={record.status} />
        </td>
                <td>{record.updated}</td>
                <td>{record.owner ?? "â€”"}</td>
                <td><button type="button" className="row-action" onClick={() => onOpen(record)} aria-label={`Open ${record.title}`}><ChevronRight size={18} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredRecords.length === 0 && <EmptyState title="No matching records" description="Adjust the search or filter to see operational records." />}
    </section>
  );
}

/**
 * Renders a full interactive operational module or the main dashboard from typed API data.
 *
 * @param props - Route module identity, query state, data, and retry behavior.
 * @returns The corresponding accessible operational workspace.
 */
export function OperationsWorkspace({ module, data, isLoading, error, onRetry }: OperationsWorkspaceProps) {
  const [selectedRecord, setSelectedRecord] = useState<OperationalRecord | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!data) return <EmptyState title="No data available" description="The service did not return a usable response. Retry the request." />;

  if (module === "dashboard") {
    const dashboard = data as DashboardData;
    return (
      <div className="page-stack">
        <div className="page-heading">
          <div><p className="eyebrow">Site operations Â· Tuesday 16 September</p><h1>Good morning, keep the site moving safely.</h1><p>Live readiness, arrivals, and access decisions for Vlaardingen.</p></div>
          <Link className="button button-primary" href="/visits"><Plus size={18} /> New access request</Link>
        </div>

        <section className="metric-grid">
          {dashboard.metrics.map((metric) => (
            <Link className={`metric-card metric-${metric.status}`} href={metric.target} key={metric.label}>
              <span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.change}</small><ArrowRight size={18} aria-hidden="true" />
            </Link>
          ))}
        </section>

        <section className="dashboard-grid">
          <div className="data-panel chart-panel">
            <div className="panel-heading"><div><p className="eyebrow">Today</p><h2>Gate activity</h2></div><Link href="/audit">View audit <ChevronRight size={17} /></Link></div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dashboard.chart} barGap={6}>
                  <CartesianGrid vertical={false} stroke="#e5ece7" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#65746d", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#65746d", fontSize: 12 }} />
                  <Tooltip cursor={{ fill: "#f1f6f2" }} />
                  <Bar dataKey="approved" name="Approved" fill="#147a50" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="denied" name="Denied" fill="#d84d45" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="data-panel activity-panel">
            <div className="panel-heading"><div><p className="eyebrow">Traceability</p><h2>Recent activity</h2></div><Link href="/audit">All activity <ChevronRight size={17} /></Link></div>
            <ul className="activity-list">
              {dashboard.activity.map((activity) => <li key={activity.id}><span className={`activity-icon activity-${activity.status}`}>{activity.status === "success" ? <CheckCircle2 size={16} /> : activity.status === "danger" ? <ShieldAlert size={16} /> : <BellRing size={16} />}</span><div><strong>{activity.action}</strong><p>{activity.detail}</p><small>{activity.actor} Â· {activity.time}</small></div></li>)}
            </ul>
          </div>
        </section>

        <section className="dashboard-grid">
          <div><div className="section-heading"><div><p className="eyebrow">Arrivals</p><h2>Upcoming visits</h2></div><Link href="/visits">Open all <ChevronRight size={17} /></Link></div><RecordTable records={dashboard.visits} onOpen={setSelectedRecord} /></div>
          <div><div className="section-heading"><div><p className="eyebrow">Live presence</p><h2>Currently on site</h2></div><Link href="/gate">Gate mode <ChevronRight size={17} /></Link></div><RecordTable records={dashboard.roster} onOpen={setSelectedRecord} /></div>
        </section>

        {selectedRecord && <RecordDrawer record={selectedRecord} module={module} onClose={() => setSelectedRecord(null)} />}
      </div>
    );
  }

  const moduleData = data as ModuleData;
  return (
    <div className="page-stack">
      <div className="page-heading">
        <div><p className="eyebrow">Operations workspace</p><h1>{moduleData.title}</h1><p>{moduleData.description}</p></div>
        <div className="heading-actions">
          {moduleData.actions.map((label, index) => <button className={`button ${index === 0 ? "button-primary" : "button-secondary"}`} type="button" key={label} onClick={() => setAction(label)}>{index === 0 && <Plus size={17} />}{label}</button>)}
        </div>
      </div>

      {module === "compliance" && <ComplianceExplanation />}
      {module === "evidence" && <EvidenceCallout />}
      {module === "blacklist" && <BlacklistCallout />}
      {module === "integrations" && <IntegrationCallout />}

      <section className="summary-strip">
        {moduleData.details.map((detail) => <div key={detail.label}><span>{detail.label}</span><strong>{detail.value}</strong></div>)}
      </section>

      <RecordTable records={moduleData.records} onOpen={setSelectedRecord} />

      {selectedRecord && <RecordDrawer record={selectedRecord} module={module} onClose={() => setSelectedRecord(null)} />}
      {action && <ModuleActionDialog module={module} action={action} onClose={() => setAction(null)} onComplete={setToast} />}
      {toast && <div className="toast" role="status"><CheckCircle2 size={18} />{toast}<button type="button" onClick={() => setToast(null)} aria-label="Dismiss message"><X size={16} /></button></div>}
    </div>
  );
}

function EvidenceDocumentPreview({ record }: { record: OperationalRecord }) {
  const title = record.title.toLowerCase();
  const isLicence = title.includes("driving licence");
  const isId = title.includes("identity card");
  const isCode95 = title.includes("code 95");
  const isRenewi = title.includes("renewi employee id");

  if (!isLicence && !isId && !isCode95 && !isRenewi) return null;

  const documentTitle = isLicence
    ? "DUTCH DRIVING LICENCE"
    : isId
      ? "DUTCH IDENTITY CARD"
      : isCode95
        ? "DRIVER QUALIFICATION CARD / CODE 95"
        : "RENEWI EMPLOYEE ID — DEMO";

  const documentDetail = isLicence
    ? "Categories C / CE · Professional driver"
    : isId
      ? "Netherlands · Identity document"
      : isCode95
        ? "Professional driver qualification · C / CE"
        : "Fictional demonstration employee badge";

  return (
    <section className="evidence-document-preview" aria-label={`${documentTitle} preview`}>
      <div className="evidence-document-heading">
        <div>
          <p className="eyebrow">Document preview</p>
          <strong>{documentTitle}</strong>
          <p>{documentDetail}</p>
        </div>
        <span className="status-badge status-pass">DEMO</span>
      </div>

      <div className="evidence-document-card">
        <div className="evidence-document-top">
          <div>
            <span className="evidence-document-country">
              {isRenewi ? "RENEWI" : "NEDERLAND"}
            </span>
            <strong>Nora Jansen</strong>
            <span>
              {isLicence && "Licence categories: C · CE"}
              {isId && "Nationality: NLD · Fictional demo identity"}
              {isCode95 && "Qualification: Code 95 · C / CE"}
              {isRenewi && "Employee ID · DEMO-1008"}
            </span>
          </div>
          <div className="evidence-demo-photo">DEMO<br />PHOTO</div>
        </div>

        <div className="evidence-document-tags">
          <span>NL</span>
          <span>FICTIONAL DATA</span>
          {isLicence && <span>C / CE</span>}
          {isCode95 && <span>CODE 95</span>}
          {isRenewi && <span>EMPLOYEE ID</span>}
        </div>

        <small>SAMPLE DOCUMENT · NOT A REAL IDENTITY DOCUMENT</small>
      </div>
    </section>
  );
}
function RecordDrawer({ record, module, onClose }: { record: OperationalRecord; module?: OperationalModule; onClose: () => void }) {
  const drawerRef = useModalKeyboard(onClose);

  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={onClose}>
      <aside ref={drawerRef} className="record-drawer" role="dialog" aria-modal="true" aria-labelledby="record-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer-heading"><div><p className="eyebrow">{record.id}</p><h2 id="record-title">{record.title}</h2></div><button className="icon-button" type="button" aria-label="Close detail" data-dialog-initial-focus onClick={onClose}><X size={20} /></button></div>
        <p className="drawer-subtitle">{record.subtitle}</p>
        <StatusBadge status={record.status} />
        {module === "evidence" && <EvidenceDocumentPreview record={record} />}
        <section className="readiness-card"><ShieldCheck size={25} aria-hidden="true" /><div><strong>Explainable readiness</strong><p>The backend compliance service will provide the authoritative per-rule decision, evidence references, and evaluation time.</p></div></section>
        <dl className="drawer-facts"><div><dt>Last update</dt><dd>{record.updated}</dd></div><div><dt>Responsible party</dt><dd>{record.owner ?? "Not assigned"}</dd></div><div><dt>Tags</dt><dd>{record.tags?.join(", ") ?? "None"}</dd></div></dl>
        <button className="button button-primary drawer-button" type="button" onClick={onClose}>Return to list</button>
      </aside>
    </div>
  );
}

function ComplianceExplanation() {
  return <section className="explanation-banner"><ShieldCheck size={27} aria-hidden="true" /><div><strong>Readiness is explainable, never guessed.</strong><p>Status chips display server-provided outcomes. The browser does not calculate safety policy; every failed or pending outcome must link to its required check, evidence, training, blacklist, or authorization reason.</p></div></section>;
}

function EvidenceCallout() {
  return <section className="explanation-banner warning-banner"><FileWarning size={27} aria-hidden="true" /><div><strong>Document extraction requires review.</strong><p>Mock OCR fields and confidence scores support verification, but extraction alone can never mark evidence compliant.</p></div></section>;
}

function BlacklistCallout() {
  return <section className="explanation-banner danger-banner"><ShieldAlert size={27} aria-hidden="true" /><div><strong>Blocks require traceability.</strong><p>Blacklist changes and overrides require a reason, authorized role, and immutable audit event from the backend.</p></div></section>;
}

function IntegrationCallout() {
  return <section className="explanation-banner"><CheckCircle2 size={27} aria-hidden="true" /><div><strong>Mock-first local operation.</strong><p>All shown provider states are deterministic mock adapters until production configuration is explicitly supplied.</p></div></section>;
}



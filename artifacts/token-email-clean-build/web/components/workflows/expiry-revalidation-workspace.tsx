"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  RefreshCw,
  RotateCw,
  ShieldAlert
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { EmptyState, ErrorState, PermissionState } from "@/components/states/content-state";
import { PageSkeleton } from "@/components/ui/skeleton";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { ApiError, apiRequest } from "@/lib/api-client";
import type {
  CurrentPresence,
  DemoClock,
  ExpiryAlert,
  ExpiryProcessResult,
  OnSiteRenewalResponse,
  RevalidationTask
} from "@/lib/domain";
import { enumLabel, formatDateTime } from "@/lib/domain";

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "The expiry and re-validation workspace could not be loaded.";
}

function shortReference(value: string): string {
  return `${value.slice(0, 8)}…`;
}

function alertTone(alert: ExpiryAlert): StatusTone {
  return alert.alert_code === "EXPIRED" ? "danger" : "warning";
}

function taskTone(task: RevalidationTask): StatusTone {
  return task.status === "COMPLETED" ? "success" : "warning";
}

async function refreshAuthoritativeState(
  queryClient: ReturnType<typeof useQueryClient>
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["batch6"] }),
    queryClient.invalidateQueries({ queryKey: ["batch3"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    queryClient.invalidateQueries({ queryKey: ["presence"] }),
    queryClient.invalidateQueries({ queryKey: ["records", "audit-events"] }),
    queryClient.invalidateQueries({ queryKey: ["records", "visits"] })
  ]);
}

function MutationError({ error }: { error: unknown }) {
  if (!error) {
    return null;
  }

  return (
    <p
      aria-live="assertive"
      className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {errorMessage(error)}
    </p>
  );
}

function ReferenceList({
  personId,
  requirementId,
  siteId,
  sourceId
}: {
  personId: string;
  requirementId: string;
  siteId: string;
  sourceId: string;
}) {
  return (
    <dl className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
      <div>
        <dt className="font-semibold uppercase tracking-wide text-slate-500">Person reference</dt>
        <dd className="mt-0.5 font-mono text-slate-700">{shortReference(personId)}</dd>
      </div>
      <div>
        <dt className="font-semibold uppercase tracking-wide text-slate-500">Requirement reference</dt>
        <dd className="mt-0.5 font-mono text-slate-700">{shortReference(requirementId)}</dd>
      </div>
      <div>
        <dt className="font-semibold uppercase tracking-wide text-slate-500">Site reference</dt>
        <dd className="mt-0.5 font-mono text-slate-700">{shortReference(siteId)}</dd>
      </div>
      <div>
        <dt className="font-semibold uppercase tracking-wide text-slate-500">Renewal source</dt>
        <dd className="mt-0.5 font-mono text-slate-700">{shortReference(sourceId)}</dd>
      </div>
    </dl>
  );
}

// PUBLIC_INTERFACE
/**
 * Renders the API-derived expiry, renewal, and re-validation workspace for
 * authorized managers. The browser never calculates expiry, compliance,
 * restored eligibility, or gate outcomes; all actions defer to the protected API.
 */
export function ExpiryRevalidationWorkspace() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const canRead = hasPermission("expiry:read");
  const canWrite = hasPermission("expiry:write");
  const canReadPresence = hasPermission("presence:read");

  const clockQuery = useQuery({
    queryKey: ["batch6", "demo-clock"],
    queryFn: () => apiRequest<DemoClock>("/api/demo-clock"),
    enabled: canRead,
    retry: false
  });
  const alertsQuery = useQuery({
    queryKey: ["batch6", "expiry-alerts"],
    queryFn: () => apiRequest<ExpiryAlert[]>("/api/expiry/alerts"),
    enabled: canRead,
    retry: false
  });
  const tasksQuery = useQuery({
    queryKey: ["batch6", "revalidation-tasks"],
    queryFn: () => apiRequest<RevalidationTask[]>("/api/revalidation/tasks"),
    enabled: canRead,
    retry: false
  });
  const presenceQuery = useQuery({
    queryKey: ["presence", "all"],
    queryFn: () => apiRequest<CurrentPresence[]>("/api/presence"),
    enabled: canRead && canWrite && canReadPresence,
    retry: false
  });

  const advanceClockMutation = useMutation({
    mutationFn: (days: 7 | 14 | 30) =>
      apiRequest<DemoClock>("/api/demo-clock/advance", {
        method: "POST",
        body: { days }
      }),
    onMutate: () => setSuccessMessage(null),
    onSuccess: async () => {
      await refreshAuthoritativeState(queryClient);
      setSuccessMessage("The API updated the effective demo time and refreshed the protected workspace.");
    }
  });
  const processExpiryMutation = useMutation({
    mutationFn: () =>
      apiRequest<ExpiryProcessResult>("/api/expiry/process", {
        method: "POST"
      }),
    onMutate: () => setSuccessMessage(null),
    onSuccess: async () => {
      await refreshAuthoritativeState(queryClient);
      setSuccessMessage("Expiry processing completed. Server-returned results are shown below.");
    }
  });
  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) =>
      apiRequest<RevalidationTask>(`/api/revalidation/tasks/${taskId}/complete`, {
        method: "POST"
      }),
    onMutate: () => setSuccessMessage(null),
    onSuccess: async () => {
      await refreshAuthoritativeState(queryClient);
      setSuccessMessage("The API completed the re-validation request and refreshed its authoritative task state.");
    }
  });
  const renewalMutation = useMutation({
    mutationFn: (selection: { task: RevalidationTask; expiry: string }) =>
      apiRequest<OnSiteRenewalResponse>(
        `/api/revalidation/tasks/${selection.task.id}/renewals`,
        {
          method: "POST",
          body: {
            person_id: selection.task.person_id,
            source_id: selection.task.source_id,
            expiry_date: selection.expiry
          }
        }
      ),
    onMutate: () => setSuccessMessage(null),
    onSuccess: async (renewal) => {
      setSelectedTaskId("");
      setExpiryDate("");
      await refreshAuthoritativeState(queryClient);
      setSuccessMessage(
        `Proposed expiry ${renewal.expiry_date} submitted as ${enumLabel(renewal.status)} evidence for review. The task remains open until the document is verified.`
      );
    }
  });

  if (!canRead) {
    return (
      <PermissionState
        description="Your current role cannot read protected expiry alerts or re-validation tasks."
        title="Expiry management is restricted"
      />
    );
  }

  if (clockQuery.isLoading || alertsQuery.isLoading || tasksQuery.isLoading) {
    return <PageSkeleton />;
  }

  const queryError = clockQuery.error ?? alertsQuery.error ?? tasksQuery.error;
  if (queryError) {
    return (
      <ErrorState
        description={errorMessage(queryError)}
        onRetry={() => {
          void clockQuery.refetch();
          void alertsQuery.refetch();
          void tasksQuery.refetch();
        }}
        title="The expiry workspace is unavailable"
      />
    );
  }

  const clock = clockQuery.data;
  if (!clock) {
    return null;
  }

  const alerts = alertsQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];
  const openTasks = tasks.filter((task) => task.status === "OPEN");
  const renewalTasks = openTasks.filter((task) => task.source_kind === "EVIDENCE");
  const onSitePeople = Array.from(
    new Map(
      (presenceQuery.data ?? [])
        .filter((presence) =>
          renewalTasks.some(
            (task) =>
              task.person_id === presence.person_id && task.site_id === presence.site_id
          )
        )
        .map((presence) => [presence.person_id, presence] as const)
    ).values()
  ).sort((a, b) => a.person_name.localeCompare(b.person_name));
  const personIsOnSite = onSitePeople.some((person) => person.person_id === selectedPersonId);
  const availableTasks = renewalTasks.filter(
    (task) =>
      task.person_id === selectedPersonId &&
      (presenceQuery.data ?? []).some(
        (presence) =>
          presence.person_id === task.person_id && presence.site_id === task.site_id
      )
  );
  const selectedTask = availableTasks.find((task) => task.id === selectedTaskId);
  // The API validates against the persisted effective demo date, not the host clock.
  const minimumExpiryDate = new Date(
    Date.UTC(
      new Date(clock.effective_at).getUTCFullYear(),
      new Date(clock.effective_at).getUTCMonth(),
      new Date(clock.effective_at).getUTCDate() + 1
    )
  ).toISOString().slice(0, 10);

  function submitRenewal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !canWrite ||
      !canReadPresence ||
      !personIsOnSite ||
      !selectedTask ||
      !expiryDate ||
      expiryDate < minimumExpiryDate ||
      renewalMutation.isPending
    ) {
      return;
    }
    renewalMutation.mutate({ task: selectedTask, expiry: expiryDate });
  }

  const processResult = processExpiryMutation.data;

  return (
    <section aria-labelledby="expiry-revalidation-workspace" className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Batch 6 · Expiry and re-validation</p>
          <h2
            className="mt-2 text-2xl font-bold tracking-tight text-slate-950"
            id="expiry-revalidation-workspace"
          >
            Expiry control workspace
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Alerts, renewal tasks, compliance effects, and gate eligibility remain
            server-authoritative. This workspace only displays protected API state and
            submits permitted commands.
          </p>
        </div>
        <StatusBadge tone={openTasks.length > 0 ? "warning" : "success"}>
          {openTasks.length} open re-validation {openTasks.length === 1 ? "task" : "tasks"}
        </StatusBadge>
      </div>

      {successMessage ? (
        <p
          aria-live="polite"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          role="status"
        >
          {successMessage}
        </p>
      ) : null}

      <section className="surface p-5" aria-labelledby="effective-demo-time">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-800">
              <CalendarClock aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-semibold text-slate-950" id="effective-demo-time">
                Effective demo time
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDateTime(clock.effective_at)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Last clock update: {formatDateTime(clock.updated_at)}
              </p>
            </div>
          </div>
          {canWrite ? (
            <div className="flex flex-wrap gap-2">
              {([7, 14, 30] as const).map((days) => (
                <button
                  className={secondaryButton}
                  disabled={advanceClockMutation.isPending}
                  key={days}
                  onClick={() => advanceClockMutation.mutate(days)}
                  type="button"
                >
                  <Clock3 aria-hidden="true" className="h-4 w-4" />
                  Advance {days} days
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <p className="mt-4 border-t pt-4 text-xs leading-5 text-muted-foreground">
          Clock advancement changes the persisted API effective time only. Run expiry
          processing afterwards to ask the API to create any newly due durable alerts
          and tasks.
        </p>
        <MutationError error={advanceClockMutation.error} />
      </section>

      <section className="surface p-5" aria-labelledby="expiry-processing">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <RefreshCw aria-hidden="true" className="h-5 w-5 text-emerald-700" />
              <h3 className="font-semibold text-slate-950" id="expiry-processing">
                Expiry processing
              </h3>
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Invokes the idempotent backend processing pass. Notification delivery
              results, task creation, and any compliance effects are returned and
              persisted by the API.
            </p>
          </div>
          {canWrite ? (
            <button
              className={primaryButton}
              disabled={processExpiryMutation.isPending}
              onClick={() => processExpiryMutation.mutate()}
              type="button"
            >
              <RotateCw aria-hidden="true" className="h-4 w-4" />
              {processExpiryMutation.isPending ? "Processing expiry…" : "Process expiry"}
            </button>
          ) : null}
        </div>

        {processResult ? (
          <dl className="mt-5 grid gap-3 border-t pt-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <dt className="text-slate-500">New alerts</dt>
              <dd className="mt-1 font-semibold text-slate-950">
                {processResult.created_alert_count}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">New tasks</dt>
              <dd className="mt-1 font-semibold text-slate-950">
                {processResult.created_task_count}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Existing alerts</dt>
              <dd className="mt-1 font-semibold text-slate-950">
                {processResult.existing_alert_count}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Existing tasks</dt>
              <dd className="mt-1 font-semibold text-slate-950">
                {processResult.existing_task_count}
              </dd>
            </div>
          </dl>
        ) : null}
        <MutationError error={processExpiryMutation.error} />
      </section>

      {canWrite ? (
        <section className="surface p-5" aria-labelledby="submit-on-site-renewal">
          <div className="flex items-center gap-2">
            <CalendarClock aria-hidden="true" className="h-5 w-5 text-emerald-700" />
            <h3 className="font-semibold text-slate-950" id="submit-on-site-renewal">
              Propose an on-site evidence renewal
            </h3>
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Choose someone currently on site, their open evidence task, and a new
            document expiry date. The proposal is submitted for document review;
            it does not verify evidence, complete a task, or restore access.
            Training tasks use the scored training workflow instead.
          </p>
          {!canReadPresence ? (
            <p className="mt-4 text-sm text-amber-800">
              Current-presence read permission is required to select an on-site person.
            </p>
          ) : presenceQuery.error ? (
            <ErrorState
              className="mt-4"
              description={errorMessage(presenceQuery.error)}
              onRetry={() => void presenceQuery.refetch()}
              title="The on-site roster could not be loaded"
            />
          ) : presenceQuery.isLoading ? (
            <div className="mt-4"><PageSkeleton /></div>
          ) : (
            <>
              {onSitePeople.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  No currently on-site person has an open evidence re-validation task.
                  Process expiry if a required document has expired.
                </p>
              ) : null}
              <form className="mt-4 grid gap-4 lg:grid-cols-3" onSubmit={submitRenewal}>
                <div>
                  <label className="text-sm font-semibold text-slate-800" htmlFor="renewal-person">
                    On-site person
                  </label>
                  <select
                    className="mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-950"
                    disabled={renewalMutation.isPending || onSitePeople.length === 0}
                    id="renewal-person"
                    onChange={(event) => {
                      setSelectedPersonId(event.target.value);
                      setSelectedTaskId("");
                    }}
                    required
                    value={personIsOnSite ? selectedPersonId : ""}
                  >
                    <option value="">Select a person</option>
                    {onSitePeople.map((person) => (
                      <option key={person.person_id} value={person.person_id}>
                        {person.person_name} · {person.site_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-800" htmlFor="renewal-task">
                    Open evidence task
                  </label>
                  <select
                    className="mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-950"
                    disabled={!personIsOnSite || renewalMutation.isPending}
                    id="renewal-task"
                    onChange={(event) => setSelectedTaskId(event.target.value)}
                    required
                    value={selectedTask?.id ?? ""}
                  >
                    <option value="">Select a task</option>
                    {availableTasks.map((task) => {
                      const site = (presenceQuery.data ?? []).find(
                        (person) =>
                          person.person_id === task.person_id && person.site_id === task.site_id
                      );
                      return (
                        <option key={task.id} value={task.id}>
                          {site?.site_name ?? "Current site"} · source {shortReference(task.source_id)}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-800" htmlFor="renewal-expiry">
                    Proposed expiry date
                  </label>
                  <input
                    className="mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-950"
                    disabled={!selectedTask || renewalMutation.isPending}
                    id="renewal-expiry"
                    min={minimumExpiryDate}
                    onChange={(event) => setExpiryDate(event.target.value)}
                    required
                    type="date"
                    value={expiryDate}
                  />
                </div>
                <div className="lg:col-span-3">
                  <button
                    className={primaryButton}
                    disabled={
                      !selectedTask ||
                      !expiryDate ||
                      expiryDate < minimumExpiryDate ||
                      renewalMutation.isPending
                    }
                    type="submit"
                  >
                    {renewalMutation.isPending ? "Submitting for review…" : "Submit pending renewal"}
                  </button>
                </div>
              </form>
            </>
          )}
          <MutationError error={renewalMutation.error} />
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="surface overflow-hidden" aria-labelledby="revalidation-tasks">
          <div className="border-b border-slate-200 px-5 py-5">
            <div className="flex items-center gap-2">
              <ShieldAlert aria-hidden="true" className="h-5 w-5 text-amber-700" />
              <h3 className="font-semibold text-slate-950" id="revalidation-tasks">
                Re-validation tasks
              </h3>
            </div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Completion is requested only after renewal is verified elsewhere. The
              API rejects a request if a current verified renewal is unavailable.
            </p>
          </div>

          {tasks.length === 0 ? (
            <EmptyState
              className="m-5 border-dashed shadow-none"
              description="The API has not returned any expiry-triggered re-validation tasks."
              title="No re-validation tasks"
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <li className="px-5 py-4" key={task.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {enumLabel(task.source_kind)} renewal
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Task created {formatDateTime(task.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={taskTone(task)}>{enumLabel(task.status)}</StatusBadge>
                      {canWrite && task.status === "OPEN" ? (
                        <button
                          className={secondaryButton}
                          disabled={completeTaskMutation.isPending}
                          onClick={() => completeTaskMutation.mutate(task.id)}
                          type="button"
                        >
                          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                          Request completion
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <ReferenceList
                    personId={task.person_id}
                    requirementId={task.requirement_id}
                    siteId={task.site_id}
                    sourceId={task.source_id}
                  />
                  {task.completed_at ? (
                    <p className="mt-3 text-xs text-emerald-800">
                      Completed {formatDateTime(task.completed_at)}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <div className="px-5 pb-5">
            <MutationError error={completeTaskMutation.error} />
          </div>
        </section>

        <section className="surface overflow-hidden" aria-labelledby="expiry-alerts">
          <div className="border-b border-slate-200 px-5 py-5">
            <div className="flex items-center gap-2">
              <AlertTriangle aria-hidden="true" className="h-5 w-5 text-amber-700" />
              <h3 className="font-semibold text-slate-950" id="expiry-alerts">
                Persisted expiry alerts
              </h3>
            </div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Delivery status is recorded by the API independently of expiry and
              eligibility decisions.
            </p>
          </div>

          {alerts.length === 0 ? (
            <EmptyState
              className="m-5 border-dashed shadow-none"
              description="The API has not returned a due or expired evidence or training alert."
              title="No expiry alerts"
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {alerts.map((alert) => (
                <li className="px-5 py-4" key={alert.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {enumLabel(alert.source_kind)} · {enumLabel(alert.alert_code)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Eligibility expiry time: {formatDateTime(alert.expires_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={alertTone(alert)}>
                        {enumLabel(alert.alert_code)}
                      </StatusBadge>
                      <StatusBadge tone="info">
                        {enumLabel(alert.delivery_status)} via {enumLabel(alert.delivery_mode)}
                      </StatusBadge>
                    </div>
                  </div>
                  <ReferenceList
                    personId={alert.person_id}
                    requirementId={alert.requirement_id}
                    siteId={alert.site_id}
                    sourceId={alert.source_id}
                  />
                  <p className="mt-3 text-xs text-muted-foreground">
                    Alert created {formatDateTime(alert.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}

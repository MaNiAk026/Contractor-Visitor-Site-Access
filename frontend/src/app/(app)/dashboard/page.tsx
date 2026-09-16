"use client";

import { useQuery } from "@tanstack/react-query";
import { OperationsWorkspace } from "@/components/operations-workspace";
import { apiClient } from "@/lib/api/client";

/**
 * Renders the top-level operations dashboard.
 *
 * @returns The dashboard workspace with loading and recovery states.
 */
export default function DashboardPage() {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiClient.getDashboard()
  });

  return (
    <OperationsWorkspace
      module="dashboard"
      data={query.data}
      isLoading={query.isLoading}
      error={query.error instanceof Error ? query.error.message : undefined}
      onRetry={() => query.refetch()}
    />
  );
}

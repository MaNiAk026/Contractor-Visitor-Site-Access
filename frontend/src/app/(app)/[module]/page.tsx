"use client";

import { useQuery } from "@tanstack/react-query";
import { notFound, useParams } from "next/navigation";
import { OperationsWorkspace } from "@/components/operations-workspace";
import { isOperationalModule, type OperationalModule } from "@/lib/api/types";
import { apiClient } from "@/lib/api/client";

/**
 * Renders any configured administrative operational module.
 *
 * @returns The requested module view or a Next.js not-found response for invalid routes.
 */
export default function OperationalModulePage() {
  const params = useParams<{ module: string }>();
  const moduleKey = params.module;

  if (!isOperationalModule(moduleKey) || moduleKey === "dashboard") {
    notFound();
  }

  const typedModule = moduleKey as OperationalModule;
  const query = useQuery({
    queryKey: ["module", typedModule],
    queryFn: () => apiClient.getModule(typedModule)
  });

  return (
    <OperationsWorkspace
      module={typedModule}
      data={query.data}
      isLoading={query.isLoading}
      error={query.error instanceof Error ? query.error.message : undefined}
      onRetry={() => query.refetch()}
    />
  );
}

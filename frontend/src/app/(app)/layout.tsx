"use client";

import { AppShell } from "@/components/app-shell";

/**
 * Wraps all administrative and operational routes in the role-aware shell.
 *
 * @param props - Active protected route content.
 * @returns The shared navigation and workspace shell.
 */
export default function ApplicationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}

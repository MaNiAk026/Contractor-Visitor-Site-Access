"use client";

import type { Role, Session } from "@/lib/api/types";

const SESSION_KEY = "renewi-demo-session";

/**
 * Persists a local demonstration session for client-side navigation.
 *
 * @param session - Authenticated session returned by the selected transport.
 * @returns Nothing.
 */
export function setSession(session: Session): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

/**
 * Obtains the active local demonstration session.
 *
 * @returns The stored session, or null when no user is signed in.
 */
export function getSession(): Session | null {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as Session;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

/**
 * Removes the current local demonstration session.
 *
 * @returns Nothing.
 */
export function clearSession(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

/**
 * Tests whether a role may access a module.
 *
 * @param role - The authenticated user's role.
 * @param permittedRoles - Roles permitted by the server-provided navigation contract.
 * @returns True when the role is permitted.
 */
export function canAccess(role: Role, permittedRoles: Role[]): boolean {
  return permittedRoles.includes(role);
}

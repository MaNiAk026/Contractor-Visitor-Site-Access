"use client";

import * as Icons from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ComponentType, type ReactNode, useEffect, useState } from "react";
import { Building2, LogOut, Menu, Search, X } from "lucide-react";
import { navigationItems } from "@/lib/api/fixtures";
import { apiClient } from "@/lib/api/client";
import { canAccess, clearSession, getSession } from "@/lib/auth/session";
import type { SearchResult, Session } from "@/lib/api/types";

interface AppShellProps {
  children: ReactNode;
}

function NavigationIcon({ name }: { name: string }) {
  const Icon = Icons[name as keyof typeof Icons] as ComponentType<{ size?: number; "aria-hidden"?: boolean }> | undefined;
  return Icon ? <Icon size={18} aria-hidden={true} /> : <Icons.Circle size={18} aria-hidden={true} />;
}

/**
 * Provides protected role-aware navigation and global operational search.
 *
 * @param props - Administrative route content rendered inside the shell.
 * @returns The persistent responsive application workspace.
 */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSessionState] = useState<Session | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    const activeSession = getSession();
    if (!activeSession) {
      router.replace("/login");
      return;
    }
    setSessionState(activeSession);
  }, [router]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      apiClient.search(query).then(setResults).catch(() => setResults([]));
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  if (!session) {
    return <div className="shell-loading" role="status">Loading secure workspace…</div>;
  }

  const visibleNavigation = navigationItems.filter((item) => canAccess(session.role, item.roles));
  const openSearch = () => {
    setSearchOpen(true);
    setMobileOpen(false);
  };
  const signOut = () => {
    clearSession();
    router.push("/login");
  };

  return (
    <div className="app-frame">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`} aria-label="Main navigation">
        <div className="sidebar-brand">
          <Link href="/dashboard" className="brand-lockup">
            <span className="brand-mark"><Building2 size={21} aria-hidden="true" /></span>
            <div><strong>renewi</strong><span>Access operations</span></div>
          </Link>
          <button className="icon-button mobile-only" type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)}>
            <X size={21} aria-hidden="true" />
          </button>
        </div>

        <nav className="nav-list">
          <p className="nav-label">Workspace</p>
          {visibleNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href ? "nav-link-active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <NavigationIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-site">
            <span className="online-dot" />
            <div><strong>Vlaardingen</strong><span>Demo site · NL</span></div>
          </div>
          <button className="sidebar-signout" type="button" onClick={signOut}>
            <LogOut size={17} aria-hidden="true" /> Sign out
          </button>
        </div>
      </aside>

      {mobileOpen && <button className="sidebar-overlay" type="button" aria-label="Close navigation overlay" onClick={() => setMobileOpen(false)} />}

      <div className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-menu" type="button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
            <Menu size={22} aria-hidden="true" />
          </button>
          <button className="search-trigger" type="button" onClick={openSearch}>
            <Search size={18} aria-hidden="true" />
            <span>Search people, visits, sites…</span>
            <kbd>⌘ K</kbd>
          </button>
          <div className="topbar-actions">
            <span className="demo-pill">Local demo</span>
            <button className="user-menu" type="button" onClick={signOut} aria-label="Sign out">
              <span className="avatar">{session.name.split(" ").map((name) => name[0]).join("").slice(0, 2)}</span>
              <span className="user-menu-copy"><strong>{session.name}</strong><small>{session.label}</small></span>
            </button>
          </div>
        </header>

        <main className="workspace-content">{children}</main>
      </div>

      {searchOpen && (
        <div className="search-backdrop" role="presentation" onMouseDown={() => setSearchOpen(false)}>
          <section className="search-dialog" role="dialog" aria-modal="true" aria-label="Global search" onMouseDown={(event) => event.stopPropagation()}>
            <div className="search-input-row">
              <Search size={20} aria-hidden="true" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search people, companies, visits, sites, or access passes"
                aria-label="Search all operational records"
              />
              <button className="icon-button" type="button" aria-label="Close search" onClick={() => setSearchOpen(false)}><X size={19} /></button>
            </div>
            <div className="search-results">
              {!query && <p className="search-hint">Start typing to search across people, companies, visits, sites, and access passes.</p>}
              {query && results.length === 0 && <p className="search-hint">No operational records match “{query}”.</p>}
              {results.map((result) => (
                <Link className="search-result" key={result.id} href={result.href} onClick={() => setSearchOpen(false)}>
                  <span className="search-group">{result.group}</span>
                  <strong>{result.title}</strong>
                  <span>{result.description}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

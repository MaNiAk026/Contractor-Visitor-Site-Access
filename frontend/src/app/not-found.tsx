"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell-loading" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <section style={{ textAlign: "center", maxWidth: "520px" }}>
        <p className="eyebrow">Renewi access platform</p>
        <h1>Page not found</h1>
        <p style={{ margin: "1rem 0 1.5rem" }}>
          The requested workspace page could not be found.
        </p>
        <Link className="button button-primary" href="/dashboard">
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}

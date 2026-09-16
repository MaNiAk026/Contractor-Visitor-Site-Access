import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GatePage from "@/app/gate/page";
import { apiClient } from "@/lib/api/client";
import type { GateDecision } from "@/lib/api/types";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>
}));

vi.mock("@/lib/api/client", () => ({
  apiClient: {
    evaluateGate: vi.fn(),
    recordGateEvent: vi.fn()
  }
}));

const grantedDecision: GateDecision = {
  decision: "grant",
  person: {
    name: "Nora Jansen",
    initials: "NJ",
    company: "Dutch Freight BV",
    population: "External driver"
  },
  visit: { purpose: "Waste delivery — bay 4", site: "Vlaardingen" },
  tokenStatus: "Active",
  identityStatus: "Mock verification matched",
  reasons: ["Required evidence is verified and in date.", "No blacklist entry applies."],
  authorizationId: "PASS-8391"
};

describe("GatePage STEP-04 coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a touch-oriented grant and records the selected entry event", async () => {
    vi.mocked(apiClient.evaluateGate).mockResolvedValue(grantedDecision);
    vi.mocked(apiClient.recordGateEvent).mockResolvedValue({
      ...grantedDecision,
      recordedEvent: "Entry at Gate 2"
    });

    render(<GatePage />);

    fireEvent.click(screen.getByRole("button", { name: /verify access/i }));

    expect(await screen.findByRole("heading", { name: "Access granted" })).toBeInTheDocument();
    expect(screen.getByText("Nora Jansen")).toBeInTheDocument();
    expect(screen.getByText("Mock verification matched")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /record entry/i }));

    await waitFor(() => {
      expect(apiClient.recordGateEvent).toHaveBeenCalledWith(grantedDecision, "entry");
    });
    expect(await screen.findByText(/entry at gate 2 recorded in the gate and audit logs/i)).toBeInTheDocument();
  });

  it("shows every denial reason and never presents entry controls for a denied pass", async () => {
    vi.mocked(apiClient.evaluateGate).mockResolvedValue({
      ...grantedDecision,
      decision: "deny",
      tokenStatus: "Denied",
      identityStatus: "Mismatch",
      reasons: [
        "Mock identity verification did not match the presented identifier.",
        "Mandatory evidence is expired and requires renewal."
      ]
    });

    render(<GatePage />);
    fireEvent.change(screen.getByLabelText("Access pass"), {
      target: { value: "qr_demo_mismatch_8a20" }
    });
    fireEvent.click(screen.getByRole("button", { name: /verify access/i }));

    expect(await screen.findByRole("heading", { name: "Access denied" })).toBeInTheDocument();
    expect(
      screen.getByText("Mock identity verification did not match the presented identifier.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Mandatory evidence is expired and requires renewal.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /record entry/i })).not.toBeInTheDocument();
  });

  it("recovers visibly from a failed scan without retaining a stale decision", async () => {
    vi.mocked(apiClient.evaluateGate).mockRejectedValue(new Error("Gate service unavailable."));

    render(<GatePage />);
    fireEvent.click(screen.getByRole("button", { name: /verify access/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Gate service unavailable.");
    expect(screen.getByRole("heading", { name: /ready for the next arrival/i })).toBeInTheDocument();
  });
});

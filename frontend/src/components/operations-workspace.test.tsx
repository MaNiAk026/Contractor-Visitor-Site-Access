import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OperationsWorkspace } from "@/components/operations-workspace";
import { dashboardFixture, getModuleFixture } from "@/lib/api/fixtures";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>
}));

describe("OperationsWorkspace", () => {
  it("renders actionable dashboard metrics and current roster", () => {
    render(<OperationsWorkspace module="dashboard" data={dashboardFixture} isLoading={false} onRetry={vi.fn()} />);

    expect(screen.getByRole("heading", { name: /keep the site moving safely/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Currently on site" })).toBeInTheDocument();
    expect(screen.getByText("Omar Benali")).toBeInTheDocument();
  });

  it("filters operational records using the accessible table search", () => {
    render(<OperationsWorkspace module="people" data={getModuleFixture("people")} isLoading={false} onRetry={vi.fn()} />);

    fireEvent.change(screen.getByRole("textbox", { name: /search module records/i }), { target: { value: "Nora" } });

    expect(screen.getByText("Nora Jansen")).toBeInTheDocument();
    expect(screen.queryByText("Ravi Patel")).not.toBeInTheDocument();
  });

  it("does not expose unsupported generic mutation actions", () => {
    render(<OperationsWorkspace module="visits" data={getModuleFixture("visits")} isLoading={false} onRetry={vi.fn()} />);

    expect(screen.queryByRole("button", { name: /new access request/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

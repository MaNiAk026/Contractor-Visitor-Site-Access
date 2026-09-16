import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OperationsWorkspace } from "@/components/operations-workspace";
import { getModuleFixture } from "@/lib/api/fixtures";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>
}));

describe("OperationsWorkspace STEP-04 coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("presents the compliance explanation while preserving server-provided status semantics", () => {
    render(
      <OperationsWorkspace
        module="compliance"
        data={getModuleFixture("compliance")}
        isLoading={false}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByText("Readiness is explainable, never guessed.")).toBeInTheDocument();
    expect(screen.getByText("Expired")).toBeInTheDocument();
    expect(screen.getByText("Blocked")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "attention" }));

    expect(screen.getByText("Ravi Patel")).toBeInTheDocument();
    expect(screen.getByText("Tom van Dalen")).toBeInTheDocument();
    expect(screen.queryByText("Nora Jansen")).not.toBeInTheDocument();
  });

  it("renders an accessible error and delegates recovery to the query owner", () => {
    const onRetry = vi.fn();

    render(
      <OperationsWorkspace
        module="visits"
        isLoading={false}
        error="The API is temporarily unavailable."
        onRetry={onRetry}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent("The API is temporarily unavailable.");
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("does not expose unsupported generic lifecycle actions", () => {
    render(
      <OperationsWorkspace
        module="visits"
        data={getModuleFixture("visits")}
        isLoading={false}
        onRetry={vi.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: /new access request/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /confirm action/i })).not.toBeInTheDocument();
  });
});

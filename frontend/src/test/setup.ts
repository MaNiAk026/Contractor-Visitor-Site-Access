import "@testing-library/jest-dom/vitest";

/** Minimal browser API implementation required by responsive chart components in jsdom. */
class ResizeObserverMock implements ResizeObserver {
  constructor(_callback: ResizeObserverCallback) {}

  observe(_target: Element, _options?: ResizeObserverOptions): void {}

  unobserve(_target: Element): void {}

  disconnect(): void {}
}

globalThis.ResizeObserver = ResizeObserverMock;

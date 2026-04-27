export const ONE_REQUEST_GUARD_WINDOW_MS = 10 * 60 * 1000;
export const ONE_REQUEST_MAX_ACTIVE_UNPAID_QUOTES = 3;
export const ONE_REQUEST_MAX_REQUESTS_PER_WINDOW = 8;

export type OneRequestGuardState = {
  activeUnpaidQuoteCount: number;
  recentRequestCount: number;
};

export function assertOneRequestIntakeAllowed(input: OneRequestGuardState) {
  if (input.activeUnpaidQuoteCount >= ONE_REQUEST_MAX_ACTIVE_UNPAID_QUOTES) {
    throw new Error(
      "Too many active unpaid quotes. Pay, resume, or let an earlier quote expire before opening more Boreal requests.",
    );
  }

  if (input.recentRequestCount >= ONE_REQUEST_MAX_REQUESTS_PER_WINDOW) {
    throw new Error(
      "Too many recent Boreal requests. Wait a few minutes before opening another one.",
    );
  }
}

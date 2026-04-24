import "server-only";

type RetryOptions = {
  attempts: number;
  baseDelayMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
};

export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const attempts = Math.max(1, options.attempts);
  const baseDelayMs = options.baseDelayMs ?? 400;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;

      if (attempt === attempts) {
        break;
      }

      if (options.shouldRetry && !options.shouldRetry(error, attempt)) {
        break;
      }

      await sleep(baseDelayMs * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Retry operation failed.");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

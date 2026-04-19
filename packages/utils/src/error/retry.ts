export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
}

export interface RetryPolicy {
  execute: <T>(fn: () => Promise<T>) => Promise<T>;
}

export function createRetryPolicy(options: RetryOptions = {}): RetryPolicy {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    retryCondition = () => true,
    onRetry,
  } = options;

  function getDelay(attempt: number): number {
    const delay = baseDelay * Math.pow(backoffFactor, attempt);
    const jitter = delay * 0.2 * Math.random();
    return Math.min(delay + jitter, maxDelay);
  }

  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt === maxRetries || !retryCondition(error)) {
          throw error;
        }
        onRetry?.(error, attempt + 1);
        await sleep(getDelay(attempt));
      }
    }
    throw lastError;
  }

  return { execute };
}

export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    onError?: (error: unknown) => void;
    retry?: number;
    retryDelay?: number;
  } = {}
): T {
  const { onError, retry = 0, retryDelay = 1000 } = options;

  return (async (...args: Parameters<T>) => {
    const retryPolicy = createRetryPolicy({
      maxRetries: retry,
      baseDelay: retryDelay,
      onRetry: onError ? (err) => onError(err) : undefined,
    });
    return retryPolicy.execute(() => fn(...args));
  }) as T;
}

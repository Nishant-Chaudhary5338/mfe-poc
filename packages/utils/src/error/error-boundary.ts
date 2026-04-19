// Note: Error boundary is React-specific. We provide the utility here but
// actual React component integration depends on the consumer.
import type { AppError } from './error-classes';

export interface ErrorBoundaryConfig {
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
  fallback?: unknown; // ReactNode
  isolate?: boolean;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export function createErrorBoundaryHelpers(config: ErrorBoundaryConfig = {}) {
  const { onError, fallback, isolate = false } = config;

  function handleError(error: Error, errorInfo: { componentStack: string }) {
    onError?.(error, errorInfo);
  }

  function getInitialState(): ErrorBoundaryState {
    return { hasError: false, error: null };
  }

  function getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  function logError(error: Error, errorInfo: { componentStack: string }) {
    console.error('[ErrorBoundary]', error.message, {
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  function isAppError(error: unknown): error is AppError {
    return error instanceof Error && 'code' in error && 'status' in error;
  }

  return {
    handleError,
    getInitialState,
    getDerivedStateFromError,
    logError,
    isAppError,
    fallback,
    isolate,
  };
}

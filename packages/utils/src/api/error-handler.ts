import { ERROR_CODES } from '../constants/common';
import type { NormalizedApiError } from './types';

export function handleApiError(error: unknown): NormalizedApiError {
  if (error instanceof Error) {
    if ('status' in error && typeof (error as any).status === 'number') {
      const status = (error as any).status;
      return {
        message: error.message,
        status,
        code: getErrorCode(status),
        details: (error as any).data ?? (error as any).details,
      };
    }
    return {
      message: error.message,
      status: 500,
      code: ERROR_CODES.UNKNOWN,
    };
  }
  if (error === null || error === undefined) {
    return {
      message: 'An unknown error occurred',
      status: 500,
      code: ERROR_CODES.UNKNOWN,
    };
  }
  return {
    message: 'An unknown error occurred',
    status: 500,
    code: ERROR_CODES.UNKNOWN,
    details: error,
  };
}

function getErrorCode(status: number): string {
  const map: Record<number, string> = {
    400: ERROR_CODES.VALIDATION,
    401: ERROR_CODES.AUTH_EXPIRED,
    403: ERROR_CODES.FORBIDDEN,
    404: ERROR_CODES.NOT_FOUND,
    408: ERROR_CODES.TIMEOUT,
    409: ERROR_CODES.CONFLICT,
    429: ERROR_CODES.RATE_LIMITED,
    500: ERROR_CODES.SERVER_ERROR,
  };
  return map[status] ?? ERROR_CODES.UNKNOWN;
}

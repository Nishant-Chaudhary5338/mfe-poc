import type { CursorPaginationState } from './types';

export function createCursorPagination(pageSize = 20): {
  state: CursorPaginationState;
  advance: (nextCursor: string | null) => void;
  reset: () => void;
  getArg: () => { cursor: string | null; limit: number };
} {
  let state: CursorPaginationState = {
    cursor: null,
    nextCursor: null,
    hasMore: true,
    pageSize,
  };

  return {
    get state() {
      return state;
    },
    advance(nextCursor: string | null) {
      state = {
        ...state,
        cursor: nextCursor,
        hasMore: nextCursor !== null,
      };
    },
    reset() {
      state = { cursor: null, nextCursor: null, hasMore: true, pageSize };
    },
    getArg() {
      return { cursor: state.cursor, limit: state.pageSize };
    },
  };
}

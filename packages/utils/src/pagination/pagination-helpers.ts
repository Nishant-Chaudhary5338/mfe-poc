import type { PaginationState, PaginationConfig, RtkPaginationArg, PageRange } from './types';

export function createPaginationState(config: PaginationConfig = {}): PaginationState {
  const { initialPage = 1, pageSize = 20, totalCount = 0 } = config;
  const safePageSize = Math.max(1, Math.floor(pageSize) || 20);
  const safeTotalCount = Math.max(0, Math.floor(totalCount) || 0);
  const totalPages = Math.max(1, Math.ceil(safeTotalCount / safePageSize));
  const safePage = Math.max(1, Math.min(totalPages, Math.floor(initialPage) || 1));
  return {
    page: safePage,
    pageSize: safePageSize,
    totalCount: safeTotalCount,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  };
}

export function createRtkPaginationArg(page: number, pageSize: number): RtkPaginationArg {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safePageSize = Math.max(1, Math.floor(pageSize) || 20);
  return {
    offset: (safePage - 1) * safePageSize,
    limit: safePageSize,
    page: safePage,
  };
}

export function calculatePageRange(
  currentPage: number,
  totalPages: number,
  siblings = 1
): PageRange {
  const safeCurrentPage = Math.max(1, Math.floor(currentPage) || 1);
  const safeTotalPages = Math.max(1, Math.floor(totalPages) || 1);
  const safeSiblings = Math.max(0, Math.floor(siblings) || 1);
  const totalSlots = safeSiblings * 2 + 5; // first + last + current + 2*siblings + 2 ellipsis

  if (safeTotalPages <= totalSlots) {
    return {
      pages: Array.from({ length: safeTotalPages }, (_, i) => i + 1),
      start: 1,
      end: safeTotalPages,
    };
  }

  const leftSiblingIndex = Math.max(safeCurrentPage - safeSiblings, 1);
  const rightSiblingIndex = Math.min(safeCurrentPage + safeSiblings, safeTotalPages);

  const showLeftEllipsis = leftSiblingIndex > 2;
  const showRightEllipsis = rightSiblingIndex < safeTotalPages - 1;

  const pages: (number | 'ellipsis')[] = [1];

  if (showLeftEllipsis) {
    pages.push('ellipsis');
  }

  for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
    if (i !== 1 && i !== totalPages) {
      pages.push(i);
    }
  }

  if (showRightEllipsis) {
    pages.push('ellipsis');
  }

  if (safeTotalPages > 1) {
    pages.push(safeTotalPages);
  }

  return { pages, start: leftSiblingIndex, end: rightSiblingIndex };
}

export function parsePaginationParams(searchParams: URLSearchParams | Record<string, string>): {
  page: number;
  pageSize: number;
} {
  const get = (key: string) => {
    if (searchParams instanceof URLSearchParams) return searchParams.get(key);
    return searchParams[key] ?? null;
  };
  const page = Math.max(1, Math.floor(parseInt(get('page') ?? '1', 10)) || 1);
  const pageSize = Math.max(1, Math.min(100, Math.floor(parseInt(get('pageSize') ?? '20', 10)) || 20));
  return { page, pageSize };
}

export function createPaginationMeta(page: number, pageSize: number, total: number) {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safePageSize = Math.max(1, Math.floor(pageSize) || 20);
  const safeTotal = Math.max(0, Math.floor(total) || 0);
  const totalPages = Math.max(1, Math.ceil(safeTotal / safePageSize));
  return {
    currentPage: Math.min(safePage, totalPages),
    pageSize: safePageSize,
    totalCount: safeTotal,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  };
}

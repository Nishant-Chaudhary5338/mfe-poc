export interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationConfig {
  initialPage?: number;
  pageSize?: number;
  totalCount?: number;
}

export interface CursorPaginationState {
  cursor: string | null;
  nextCursor: string | null;
  hasMore: boolean;
  pageSize: number;
}

export interface RtkPaginationArg {
  offset: number;
  limit: number;
  page?: number;
}

export interface PageRange {
  pages: (number | 'ellipsis')[];
  start: number;
  end: number;
}

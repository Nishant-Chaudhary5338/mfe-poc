import type { RtkPaginationArg } from './types';

export interface InfiniteScrollConfig<TData, TArg> {
  getNextPageParam: (lastPage: TData, allPages: TData[]) => TArg | undefined;
  getPreviousPageParam?: (firstPage: TData, allPages: TData[]) => TArg | undefined;
}

export function createInfiniteScrollHelpers() {
  function getNextOffset(currentOffset: number, limit: number, totalCount: number): number | undefined {
    if (!Number.isFinite(currentOffset) || !Number.isFinite(limit) || !Number.isFinite(totalCount)) {
      return undefined;
    }
    const safeOffset = Math.max(0, Math.floor(currentOffset));
    const safeLimit = Math.max(1, Math.floor(limit));
    const safeTotal = Math.max(0, Math.floor(totalCount));
    const next = safeOffset + safeLimit;
    return next < safeTotal ? next : undefined;
  }

  function mergePages<T>(pages: T[][]): T[] {
    if (!Array.isArray(pages)) return [];
    return pages.flat();
  }

  return { getNextOffset, mergePages };
}

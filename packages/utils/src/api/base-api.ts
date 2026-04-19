// This file provides helpers for creating RTK Query base APIs.
// The actual createBaseApi depends on @reduxjs/toolkit being installed.
// We provide a factory pattern that consumers can use.
import type { BaseApiConfig } from './types';

export type CreateBaseApiFn = (config: BaseApiConfig) => any;

/**
 * Returns the configuration object for creating an RTK Query API.
 * Usage:
 *   import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
 *   const config = getBaseApiConfig({ baseUrl: '/api', tagTypes: ['User'] });
 *   const api = createApi({ ...config, endpoints: () => ({}) });
 */
export function getBaseApiConfig(config: BaseApiConfig) {
  const { baseUrl, reducerPath = 'api', tagTypes = [], prepareHeaders, fetchFn } = config;

  if (!baseUrl?.trim()) {
    throw new Error('Base URL is required');
  }

  return {
    reducerPath,
    tagTypes,
    baseQuery: {
      baseUrl,
      prepareHeaders,
      fetchFn,
    },
  };
}

export interface CrudEndpointsBuilder<T> {
  getList: T;
  getById: T;
  create: T;
  update: T;
  delete: T;
}

/**
 * Helper to generate CRUD endpoint configs (used with injectEndpoints)
 */
export function getCrudEndpointConfig(config: {
  entity: string;
  baseUrl: string;
  tagTypes?: string[];
}) {
  const { entity, baseUrl, tagTypes = [entity] } = config;

  if (!entity?.trim() || !baseUrl?.trim()) {
    throw new Error('Entity and baseUrl are required');
  }

  return {
    entity,
    baseUrl,
    tagTypes,
    endpoints: {
      [`get${entity}s`]: {
        query: (params?: Record<string, unknown>) => ({ url: baseUrl, params }),
        providesTags: tagTypes,
      },
      [`get${entity}ById`]: {
        query: (id: string | number) => ({ url: `${baseUrl}/${id}` }),
        providesTags: (_result: unknown, _error: unknown, id: string | number) => [{ type: entity, id }],
      },
      [`create${entity}`]: {
        query: (body: unknown) => ({ url: baseUrl, method: 'POST', body }),
        invalidatesTags: tagTypes,
      },
      [`update${entity}`]: {
        query: ({ id, ...body }: { id: string | number }) => ({ url: `${baseUrl}/${id}`, method: 'PUT', body }),
        invalidatesTags: (_result: unknown, _error: unknown, { id }: { id: string | number }) => [
          ...tagTypes.map((t) => ({ type: t, id })),
        ],
      },
      [`delete${entity}`]: {
        query: (id: string | number) => ({ url: `${baseUrl}/${id}`, method: 'DELETE' }),
        invalidatesTags: tagTypes,
      },
    },
  };
}

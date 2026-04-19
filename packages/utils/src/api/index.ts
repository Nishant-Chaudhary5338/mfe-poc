export { getBaseApiConfig, getCrudEndpointConfig } from './base-api';
export type { BaseApiConfig, CrudEndpointsBuilder, PaginatedEndpointConfig, CrudEndpointConfig, NormalizedApiError, RetryConfig } from './types';

export { handleApiError } from './error-handler';
export { createOptimisticUpdate, createPaginatedEndpointBuilder, createWebSocketEndpointConfig } from './rtk-query-helpers';
export { createApiClient } from './api-client';
export type { ApiClientConfig, RequestOptions } from './api-client';

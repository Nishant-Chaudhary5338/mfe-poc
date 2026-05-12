import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './index';

export interface Metric {
  id: string; service: string; region: string;
  cpu: number; memory: number; latencyMs: number; uptime: number; status: string;
}
export interface Alert {
  id: string; rule: string; service: string;
  severity: string; firedAt: string; status: string;
}

export const smsApi = createApi({
  reducerPath: 'smsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5001',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Metric', 'Alert'],
  endpoints: builder => ({
    getMetrics: builder.query<Metric[], void>({ query: () => '/api/mock/metrics', providesTags: ['Metric'] }),
    getAlerts:  builder.query<Alert[], void>({  query: () => '/api/mock/alerts',  providesTags: ['Alert']  }),
  }),
});

export const { useGetMetricsQuery, useGetAlertsQuery } = smsApi;

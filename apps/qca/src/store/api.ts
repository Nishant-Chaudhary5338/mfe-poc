import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './index';

export interface Check {
  id: string; asset: string; rule: string;
  status: string; score: number; runAt: string; operator: string;
}
export interface Rule {
  id: string; name: string; type: string;
  threshold: string; active: boolean; severity: string;
}

export const qcaApi = createApi({
  reducerPath: 'qcaApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5001',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Check', 'Rule'],
  endpoints: builder => ({
    getChecks: builder.query<Check[], void>({ query: () => '/api/mock/checks', providesTags: ['Check'] }),
    getRules:  builder.query<Rule[],  void>({ query: () => '/api/mock/rules',  providesTags: ['Rule']  }),
  }),
});

export const { useGetChecksQuery, useGetRulesQuery } = qcaApi;

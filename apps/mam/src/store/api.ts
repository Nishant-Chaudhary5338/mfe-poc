import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Asset {
  id: string; name: string; type: string;
  size: number; uploadedBy: string; url: string; status: string;
}
export interface Job {
  id: string; asset: string; preset: string;
  status: string; progress: number; startedAt: string | null; duration: number | null;
}

export const mamApi = createApi({
  reducerPath: 'mamApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5001',
    prepareHeaders: headers => {
      // MAM trusts the shell's token bridge
      const token = (globalThis as any).__tvplus_auth?.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Asset', 'Job'],
  endpoints: builder => ({
    getAssets: builder.query<Asset[], void>({ query: () => '/api/mock/assets', providesTags: ['Asset'] }),
    getJobs:   builder.query<Job[],   void>({ query: () => '/api/mock/jobs',   providesTags: ['Job']   }),
  }),
});

export const { useGetAssetsQuery, useGetJobsQuery } = mamApi;

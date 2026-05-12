import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './index';

export interface Article {
  id: string; title: string; status: string;
  author: string; createdAt: string; tags: string[];
}

export const cmsApi = createApi({
  reducerPath: 'cmsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5001',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Article'],
  endpoints: builder => ({
    getArticles: builder.query<Article[], void>({ query: () => '/api/mock/articles', providesTags: ['Article'] }),
  }),
});

export const { useGetArticlesQuery } = cmsApi;

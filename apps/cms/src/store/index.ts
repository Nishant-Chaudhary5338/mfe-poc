import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './authSlice';
import { cmsApi } from './api';

export const store = configureStore({
  reducer: { auth: authReducer, [cmsApi.reducerPath]: cmsApi.reducer },
  middleware: gDM => gDM().concat(cmsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

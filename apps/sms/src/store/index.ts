import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './authSlice';
import { smsApi } from './api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [smsApi.reducerPath]: smsApi.reducer,
  },
  middleware: gDM => gDM().concat(smsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

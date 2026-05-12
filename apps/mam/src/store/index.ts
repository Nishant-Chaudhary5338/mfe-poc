import { configureStore } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import { mamApi } from './api';

export const store = configureStore({
  reducer: { [mamApi.reducerPath]: mamApi.reducer },
  middleware: gDM => gDM().concat(mamApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
// MAM uses useAuth() from @repo/auth for user identity (shell bridge)
// Only selector hook needed for data queries
export const useAppSelector = useSelector.bind(null) as typeof useSelector;

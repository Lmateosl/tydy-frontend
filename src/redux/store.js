import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './api/apiSlice';
import { authApi } from './api/authApi';
import authReducer from './slices/authSlice';
import usuariosReducer from './slices/usuariosSlice';
import listaReducer from './slices/listasSlice';

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    [authApi.reducerPath]: authApi.reducer,
    auth: authReducer,
    usuarios: usuariosReducer,
    listas: listaReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware, authApi.middleware),
});
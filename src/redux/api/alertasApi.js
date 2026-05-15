import { apiSlice } from "./apiSlice";

export const alertasApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    enviarAlertaManual: builder.mutation({
      query: (payload) => ({
        url: "/alertas-manuales",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Notificaciones"],
    }),
  }),
});

export const {
  useEnviarAlertaManualMutation,
} = alertasApi;

import { apiSlice } from "./apiSlice";

export const portalClienteApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    obtenerResumenPortalCliente: builder.query({
      query: (params = {}) => {
        const query = [];
        if (params.desde) query.push(`desde=${encodeURIComponent(params.desde)}`);
        if (params.hasta) query.push(`hasta=${encodeURIComponent(params.hasta)}`);
        const qs = query.length ? `?${query.join("&")}` : "";
        return `/portal-cliente/resumen${qs}`;
      },
    }),

    obtenerRiesgosPortalCliente: builder.query({
      query: (params = {}) => {
        const query = [];
        if (params.desde) query.push(`desde=${encodeURIComponent(params.desde)}`);
        if (params.hasta) query.push(`hasta=${encodeURIComponent(params.hasta)}`);
        const qs = query.length ? `?${query.join("&")}` : "";
        return `/portal-cliente/riesgos${qs}`;
      },
    }),

    obtenerHistorialPortalCliente: builder.query({
      query: (params = {}) => {
        const query = [];
        if (params.desde) query.push(`desde=${encodeURIComponent(params.desde)}`);
        if (params.hasta) query.push(`hasta=${encodeURIComponent(params.hasta)}`);
        const qs = query.length ? `?${query.join("&")}` : "";
        return `/portal-cliente/historial${qs}`;
      },
    }),

    obtenerFeedbackPortalCliente: builder.query({
      query: (params = {}) => {
        const query = [];
        if (params.desde) query.push(`desde=${encodeURIComponent(params.desde)}`);
        if (params.hasta) query.push(`hasta=${encodeURIComponent(params.hasta)}`);
        const qs = query.length ? `?${query.join("&")}` : "";
        return `/portal-cliente/feedback${qs}`;
      },
    }),
  }),
});

export const {
  useObtenerResumenPortalClienteQuery,
  useObtenerRiesgosPortalClienteQuery,
  useObtenerHistorialPortalClienteQuery,
  useObtenerFeedbackPortalClienteQuery,
  useLazyObtenerResumenPortalClienteQuery,
  useLazyObtenerRiesgosPortalClienteQuery,
  useLazyObtenerHistorialPortalClienteQuery,
  useLazyObtenerFeedbackPortalClienteQuery,
} = portalClienteApi;

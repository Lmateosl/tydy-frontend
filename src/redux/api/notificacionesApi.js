import { apiSlice } from "./apiSlice";

export const notificacionesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    obtenerNotificaciones: builder.query({
      query: ({ limit = 20, offset = 0, solo_no_leidas = false } = {}) =>
        `/notificaciones?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}&solo_no_leidas=${encodeURIComponent(solo_no_leidas)}`,
      providesTags: (result) => [
        "Notificaciones",
        ...(result?.items || []).map((item) => ({ type: "Notificaciones", id: item.id })),
      ],
    }),

    obtenerUnreadCount: builder.query({
      query: () => "/notificaciones/unread-count",
      providesTags: ["Notificaciones"],
    }),

    marcarNotificacionLeida: builder.mutation({
      query: (destinatario_id) => ({
        url: `/notificaciones/${destinatario_id}/leer`,
        method: "POST",
      }),
      invalidatesTags: ["Notificaciones"],
    }),

    marcarTodasLeidas: builder.mutation({
      query: () => ({
        url: "/notificaciones/leer-todas",
        method: "POST",
      }),
      invalidatesTags: ["Notificaciones"],
    }),
  }),
});

export const {
  useObtenerNotificacionesQuery,
  useObtenerUnreadCountQuery,
  useMarcarNotificacionLeidaMutation,
  useMarcarTodasLeidasMutation,
} = notificacionesApi;

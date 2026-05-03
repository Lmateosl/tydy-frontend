import { apiSlice } from "./apiSlice";

const buildQueryString = (params = {}) => {
  const query = [];

  if (params.estado) query.push(`estado=${encodeURIComponent(params.estado)}`);
  if (params.prioridad) query.push(`prioridad=${encodeURIComponent(params.prioridad)}`);
  if (params.tipo) query.push(`tipo=${encodeURIComponent(params.tipo)}`);
  if (params.empresa_id) query.push(`empresa_id=${encodeURIComponent(params.empresa_id)}`);
  if (params.locacion_id) query.push(`locacion_id=${encodeURIComponent(params.locacion_id)}`);
  if (params.area_id) query.push(`area_id=${encodeURIComponent(params.area_id)}`);
  if (params.empleado_id) query.push(`empleado_id=${encodeURIComponent(params.empleado_id)}`);
  if (params.supervisor_id) query.push(`supervisor_id=${encodeURIComponent(params.supervisor_id)}`);
  if (params.asignado_a_id) query.push(`asignado_a_id=${encodeURIComponent(params.asignado_a_id)}`);
  if (params.actividad_usuario_id) query.push(`actividad_usuario_id=${encodeURIComponent(params.actividad_usuario_id)}`);
  if (params.feedback_id) query.push(`feedback_id=${encodeURIComponent(params.feedback_id)}`);
  if (params.desde) query.push(`desde=${encodeURIComponent(params.desde)}`);
  if (params.hasta) query.push(`hasta=${encodeURIComponent(params.hasta)}`);

  return query.length ? `?${query.join("&")}` : "";
};

export const incidentesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    obtenerIncidentes: builder.query({
      query: (params = {}) => `/incidentes/${buildQueryString(params)}`,
      providesTags: (result = []) => [
        "Incidentes",
        ...result.map((incidente) => ({ type: "Incidentes", id: incidente.id })),
      ],
    }),

    obtenerIncidente: builder.query({
      query: (incidente_id) => `/incidentes/${incidente_id}`,
      providesTags: (result, error, incidente_id) => [{ type: "Incidentes", id: incidente_id }],
    }),

    obtenerTimelineIncidente: builder.query({
      query: ({ incidente_id, limit = 20, offset = 0 }) =>
        `/incidentes/${incidente_id}/timeline?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`,
      providesTags: (result, error, { incidente_id }) => [
        { type: "IncidenteTimeline", id: incidente_id },
      ],
    }),

    comentarIncidente: builder.mutation({
      query: ({ incidente_id, datos }) => {
        const formData = new FormData();
        if (datos?.mensaje !== undefined && datos?.mensaje !== null && `${datos.mensaje}`.trim() !== "") {
          formData.append("mensaje", datos.mensaje);
        }
        if (datos?.foto instanceof File) {
          formData.append("foto", datos.foto);
        }

        return {
          url: `/incidentes/${incidente_id}/comentarios`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (result, error, { incidente_id }) => [
        { type: "IncidenteTimeline", id: incidente_id },
        { type: "Incidentes", id: incidente_id },
        "Incidentes",
      ],
    }),

    crearIncidente: builder.mutation({
      query: (payload) => ({
        url: "/incidentes/",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Incidentes"],
    }),

    editarIncidente: builder.mutation({
      query: ({ incidente_id, datos }) => ({
        url: `/incidentes/${incidente_id}`,
        method: "PUT",
        body: datos,
      }),
      invalidatesTags: (result, error, { incidente_id }) => [
        "Incidentes",
        { type: "Incidentes", id: incidente_id },
        { type: "IncidenteTimeline", id: incidente_id },
      ],
    }),

    eliminarIncidente: builder.mutation({
      query: (incidente_id) => ({
        url: `/incidentes/${incidente_id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Incidentes"],
    }),

    resolverIncidente: builder.mutation({
      query: ({ incidente_id, datos }) => {
        const tieneFoto = datos?.foto_resolucion instanceof File;

        if (tieneFoto) {
          const formData = new FormData();
          if (datos?.evidencia_resolucion !== undefined && datos?.evidencia_resolucion !== null) {
            formData.append("evidencia_resolucion", datos.evidencia_resolucion);
          }
          formData.append("foto_resolucion", datos.foto_resolucion);

          return {
            url: `/incidentes/${incidente_id}/resolver`,
            method: "POST",
            body: formData,
          };
        }

        return {
          url: `/incidentes/${incidente_id}/resolver`,
          method: "POST",
          body: {
            evidencia_resolucion: datos?.evidencia_resolucion,
          },
        };
      },
      invalidatesTags: (result, error, { incidente_id }) => [
        "Incidentes",
        { type: "Incidentes", id: incidente_id },
        { type: "IncidenteTimeline", id: incidente_id },
      ],
    }),

    marcarIncidenteEnProceso: builder.mutation({
      query: (incidente_id) => ({
        url: `/incidentes/${incidente_id}/en-proceso`,
        method: "POST",
        body: {},
      }),
      invalidatesTags: (result, error, incidente_id) => [
        "Incidentes",
        { type: "Incidentes", id: incidente_id },
        { type: "IncidenteTimeline", id: incidente_id },
      ],
    }),

    cerrarIncidente: builder.mutation({
      query: (incidente_id) => ({
        url: `/incidentes/${incidente_id}/cerrar`,
        method: "POST",
        body: {},
      }),
      invalidatesTags: (result, error, incidente_id) => [
        "Incidentes",
        { type: "Incidentes", id: incidente_id },
        { type: "IncidenteTimeline", id: incidente_id },
      ],
    }),
  }),
});

export const {
  useObtenerIncidentesQuery,
  useObtenerIncidenteQuery,
  useObtenerTimelineIncidenteQuery,
  useComentarIncidenteMutation,
  useCrearIncidenteMutation,
  useEditarIncidenteMutation,
  useEliminarIncidenteMutation,
  useResolverIncidenteMutation,
  useMarcarIncidenteEnProcesoMutation,
  useCerrarIncidenteMutation,
} = incidentesApi;

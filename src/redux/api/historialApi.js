import { apiSlice } from "./apiSlice";

export const actividadesUsuarioApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // Crear Actividad Usuario
    crearActividadUsuario: builder.mutation({
      query: (nuevaActividad) => ({
        url: "/actividades-usuario/",
        method: "POST",
        body: nuevaActividad,
      }),
    }),

    // Listar Actividades Usuario con filtros
    obtenerActividadesUsuario: builder.query({
      query: (params = {}) => {
        const query = [];
        if (params.usuario_id) query.push(`usuario_id=${encodeURIComponent(params.usuario_id)}`);
        if (params.finalizada !== undefined) query.push(`finalizada=${encodeURIComponent(params.finalizada)}`);
        if (params.desde) query.push(`desde=${encodeURIComponent(params.desde)}`);
        if (params.hasta) query.push(`hasta=${encodeURIComponent(params.hasta)}`);
        const qs = query.length ? `?${query.join("&")}` : "";
        return `/actividades-usuario/${qs}`;
      },
    }),

    // Exportar Actividades con filtros
    exportarActividadesUsuario: builder.query({
      query: (params = {}) => {
        const query = [];
        if (params.usuario_id) query.push(`usuario_id=${encodeURIComponent(params.usuario_id)}`);
        if (params.finalizada !== undefined) query.push(`finalizada=${encodeURIComponent(params.finalizada)}`);
        if (params.desde) query.push(`desde=${encodeURIComponent(params.desde)}`);
        if (params.hasta) query.push(`hasta=${encodeURIComponent(params.hasta)}`);
        if (params.formato) query.push(`formato=${encodeURIComponent(params.formato)}`);
        const qs = query.length ? `?${query.join("&")}` : "";
        return `/actividades-usuario/exportar${qs}`;
      },
    }),

    // Obtener Actividad por ID
    obtenerActividadUsuario: builder.query({
      query: (actividad_id) => `/actividades-usuario/${actividad_id}`,
    }),

    // Actualizar Actividad por ID
    editarActividadUsuario: builder.mutation({
      query: ({ actividad_id, datos }) => ({
        url: `/actividades-usuario/${actividad_id}`,
        method: "PUT",
        body: datos,
      }),
    }),

    // Finalizar Actividad por ID
    finalizarActividadUsuario: builder.mutation({
      query: ({ actividad_id, datos }) => ({
        url: `/actividades-usuario/${actividad_id}/finalizar`,
        method: "PUT",
        body: datos,
      }),
    }),

  }),
});

export const {
  useCrearActividadUsuarioMutation,
  useObtenerActividadesUsuarioQuery,
  useExportarActividadesUsuarioQuery,
  useLazyExportarActividadesUsuarioQuery,
  useObtenerActividadUsuarioQuery,
  useEditarActividadUsuarioMutation,
  useFinalizarActividadUsuarioMutation,
} = actividadesUsuarioApi;
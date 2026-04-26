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
        if (params.empresa) query.push(`empresa=${encodeURIComponent(params.empresa)}`);
        if (params.estado_verificacion) query.push(`estado_verificacion=${encodeURIComponent(params.estado_verificacion)}`);
        if (params.desde) query.push(`desde=${encodeURIComponent(params.desde)}`);
        if (params.hasta) query.push(`hasta=${encodeURIComponent(params.hasta)}`);
        const qs = query.length ? `?${query.join("&")}` : "";
        return `/actividades-usuario/${qs}`;
      },
    }),

    // Resumen operativo dashboard
    obtenerResumenOperativo: builder.query({
      query: () => "/dashboard/operativo/resumen",
    }),

    // Riesgos operativos dashboard
    obtenerRiesgosOperativos: builder.query({
      query: (params = {}) => {
        const query = [];
        if (params.desde) query.push(`desde=${encodeURIComponent(params.desde)}`);
        if (params.hasta) query.push(`hasta=${encodeURIComponent(params.hasta)}`);
        const qs = query.length ? `?${query.join("&")}` : "";
        return `/dashboard/operativo/riesgos${qs}`;
      },
    }),

    // Exportar Actividades con filtros
    exportarActividadesUsuario: builder.query({
      query: (params = {}) => {
        const query = [];
        if (params.usuario_id) query.push(`usuario_id=${encodeURIComponent(params.usuario_id)}`);
        if (params.finalizada !== undefined) query.push(`finalizada=${encodeURIComponent(params.finalizada)}`);
        if (params.empresa) query.push(`empresa=${encodeURIComponent(params.empresa)}`);
        if (params.estado_verificacion) query.push(`estado_verificacion=${encodeURIComponent(params.estado_verificacion)}`);
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
  useObtenerResumenOperativoQuery,
  useObtenerRiesgosOperativosQuery,
  useExportarActividadesUsuarioQuery,
  useLazyExportarActividadesUsuarioQuery,
  useObtenerActividadUsuarioQuery,
  useEditarActividadUsuarioMutation,
  useFinalizarActividadUsuarioMutation,
} = actividadesUsuarioApi;

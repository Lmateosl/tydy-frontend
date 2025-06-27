import { apiSlice } from "./apiSlice";

export const categoriasActividadesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // CATEGORÍAS
    obtenerCategorias: builder.query({
      query: () => "/categorias/",
    }),
    crearCategoria: builder.mutation({
      query: (nuevaCategoria) => ({
        url: "/categorias/",
        method: "POST",
        body: nuevaCategoria,
      }),
    }),
    obtenerCategoria: builder.query({
      query: (categoria_id) => `/categorias/${categoria_id}`,
    }),
    editarCategoria: builder.mutation({
      query: ({ categoria_id, datos }) => ({
        url: `/categorias/${categoria_id}`,
        method: "PUT",
        body: datos,
      }),
    }),
    eliminarCategoria: builder.mutation({
      query: (categoria_id) => ({
        url: `/categorias/${categoria_id}`,
        method: "DELETE",
      }),
    }),
    obtenerActividadesPorCategoria: builder.query({
      query: (categoria_id) => `/categorias/categoria/${categoria_id}/actividades`,
    }),

    // ACTIVIDADES
    obtenerActividades: builder.query({
      query: () => "/actividades/",
    }),
    crearActividad: builder.mutation({
      query: (nuevaActividad) => ({
        url: "/actividades/",
        method: "POST",
        body: nuevaActividad,
      }),
    }),
    obtenerActividad: builder.query({
      query: (actividad_id) => `/actividades/${actividad_id}`,
    }),
    editarActividad: builder.mutation({
      query: ({ actividad_id, datos }) => ({
        url: `/actividades/${actividad_id}`,
        method: "PUT",
        body: datos,
      }),
    }),
    eliminarActividad: builder.mutation({
      query: (actividad_id) => ({
        url: `/actividades/${actividad_id}`,
        method: "DELETE",
      }),
    }),

  }),
});

export const {
  useObtenerCategoriasQuery,
  useCrearCategoriaMutation,
  useObtenerCategoriaQuery,
  useEditarCategoriaMutation,
  useEliminarCategoriaMutation,
  useObtenerActividadesPorCategoriaQuery,
  useObtenerActividadesQuery,
  useCrearActividadMutation,
  useObtenerActividadQuery,
  useEditarActividadMutation,
  useEliminarActividadMutation,
} = categoriasActividadesApi;
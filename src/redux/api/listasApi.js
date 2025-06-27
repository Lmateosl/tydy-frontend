import { apiSlice } from "./apiSlice";

export const listasApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // LISTAS DE ACTIVIDADES
    obtenerListas: builder.query({
      query: () => "/listas_actividades/",
    }),
    crearLista: builder.mutation({
      query: (nuevaLista) => ({
        url: "/listas_actividades/",
        method: "POST",
        body: nuevaLista,
      }),
    }),
    obtenerLista: builder.query({
      query: (lista_id) => `/listas_actividades/${lista_id}`,
    }),
    editarLista: builder.mutation({
      query: ({ lista_id, datos }) => ({
        url: `/listas_actividades/${lista_id}`,
        method: "PUT",
        body: datos,
      }),
    }),
    eliminarLista: builder.mutation({
      query: (lista_id) => ({
        url: `/listas_actividades/${lista_id}`,
        method: "DELETE",
      }),
    }),
    obtenerListaPorCodigo: builder.query({
      query: (code) => `/listas_actividades/por_codigo/${code}`,
    }),
    obtenerListaPorCodigoOut: builder.query({
      query: (codeout) => `/listas_actividades/por_codigoout/${codeout}`,
    }),

  }),
});

export const {
  useObtenerListasQuery,
  useCrearListaMutation,
  useObtenerListaQuery,
  useLazyObtenerListaQuery,
  useEditarListaMutation,
  useEliminarListaMutation,
  useObtenerListaPorCodigoQuery,
  useLazyObtenerListaPorCodigoQuery,
  useObtenerListaPorCodigoOutQuery,
} = listasApi;
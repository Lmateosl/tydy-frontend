import { apiSlice } from "./apiSlice";

export const empresasApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    obtenerEmpresas: builder.query({
      query: () => "/empresas/",
    }),
    crearEmpresa: builder.mutation({
      query: (nuevaEmpresa) => ({
        url: "/empresas/",
        method: "POST",
        body: nuevaEmpresa,
      }),
    }),
    obtenerEmpresa: builder.query({
      query: (empresa_id) => `/empresas/${empresa_id}`,
    }),
    editarEmpresa: builder.mutation({
      query: ({ empresa_id, datos }) => ({
        url: `/empresas/${empresa_id}`,
        method: "PUT",
        body: datos,
      }),
    }),
    eliminarEmpresa: builder.mutation({
      query: (empresa_id) => ({
        url: `/empresas/${empresa_id}`,
        method: "DELETE",
      }),
    }),
    obtenerLocaciones: builder.query({
      query: () => "/locaciones/",
    }),
    crearLocacion: builder.mutation({
      query: (nuevaLocacion) => ({
        url: "/locaciones/",
        method: "POST",
        body: nuevaLocacion,
      }),
    }),
    obtenerLocacion: builder.query({
      query: (locacion_id) => `/locaciones/${locacion_id}`,
    }),
    editarLocacion: builder.mutation({
      query: ({ locacion_id, datos }) => ({
        url: `/locaciones/${locacion_id}`,
        method: "PUT",
        body: datos,
      }),
    }),
    eliminarLocacion: builder.mutation({
      query: (locacion_id) => ({
        url: `/locaciones/${locacion_id}`,
        method: "DELETE",
      }),
    }),
    obtenerLocacionesPorEmpresa: builder.query({
      query: (empresa_id) => `/locaciones/empresa/${empresa_id}`,
    }),
    obtenerAreasUsuario: builder.query({
      query: () => "/areas/",
    }),
    crearArea: builder.mutation({
      query: (nuevaArea) => ({
        url: "/areas/",
        method: "POST",
        body: nuevaArea,
      }),
    }),
    resumenTotales: builder.query({
      query: () => "/areas/resumen-totales",
    }),
    obtenerAreasPorLocacion: builder.query({
      query: (locacion_id) => `/areas/${locacion_id}/`,
    }),
    obtenerArea: builder.query({
      query: ({ locacion_id, area_id }) =>
        `/areas/${locacion_id}/${area_id}/`,
    }),
    editarArea: builder.mutation({
      query: ({ locacion_id, area_id, datos }) => ({
        url: `/areas/${locacion_id}/${area_id}/`,
        method: "PUT",
        body: datos,
      }),
    }),
    eliminarArea: builder.mutation({
      query: ({ locacion_id, area_id }) => ({
        url: `/areas/${locacion_id}/${area_id}/`,
        method: "DELETE",
      }),
    }),
    obtenerUsuariosArea: builder.query({
      query: ({ locacion_id, area_id }) =>
        `/areas/${locacion_id}/${area_id}/usuarios/`,
    }),
    buscarCoordenadas: builder.query({
      query: (direccion) => `/locaciones/coordenadas/?direccion=${encodeURIComponent(direccion)}`,
    }),
  }),
});

export const {
  useObtenerEmpresasQuery,
  useCrearEmpresaMutation,
  useObtenerEmpresaQuery,
  useEditarEmpresaMutation,
  useEliminarEmpresaMutation,
  useObtenerLocacionesQuery,
  useCrearLocacionMutation,
  useObtenerLocacionQuery,
  useEditarLocacionMutation,
  useEliminarLocacionMutation,
  useObtenerLocacionesPorEmpresaQuery,
  useObtenerAreasUsuarioQuery,
  useCrearAreaMutation,
  useResumenTotalesQuery,
  useObtenerAreasPorLocacionQuery,
  useObtenerAreaQuery,
  useEditarAreaMutation,
  useEliminarAreaMutation,
  useObtenerUsuariosAreaQuery,
  useBuscarCoordenadasQuery,
} = empresasApi;
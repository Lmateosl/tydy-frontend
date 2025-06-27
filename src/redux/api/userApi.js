import { apiSlice } from './apiSlice';

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    obtenerPerfil: builder.query({
      query: () => '/usuarios/perfil',
    }),

    obtenerMisUsuarios: builder.query({
      query: () => '/usuarios/mis-usuarios',
    }),

    obtenerMisEmpresas: builder.query({
      query: () => '/usuarios/mis-empresas',
    }),

    obtenerMisCategorias: builder.query({
      query: () => '/usuarios/mis-categorias',
    }),

    obtenerMisActividades: builder.query({
      query: () => '/usuarios/mis-actividades',
    }),

    obtenerMisListasActividades: builder.query({
      query: () => '/usuarios/mis-listas-actividades',
    }),

    obtenerUsuarios: builder.query({
      query: () => '/usuarios/',
    }),

    crearUsuario: builder.mutation({
      query: (nuevoUsuario) => ({
        url: '/usuarios/',
        method: 'POST',
        body: nuevoUsuario,
      }),
    }),

    editarUsuario: builder.mutation({
      query: ({ usuario_id, datos }) => ({
        url: `/usuarios/${usuario_id}`,
        method: 'PUT',
        body: datos,
      }),
    }),

    eliminarUsuario: builder.mutation({
      query: (usuario_id) => ({
        url: `/usuarios/${usuario_id}`,
        method: 'DELETE',
      }),
    }),

    obtenerUsuarioPorId: builder.query({
      query: (usuario_id) => `/usuarios/${usuario_id}`,
    }),
    
    obtenerMiCompania: builder.query({
      query: () => '/usuarios/mi-compania',
    }),

    cambiarContrasena: builder.mutation({
      query: ({ usuario_id, contrasena_actual, nueva_contrasena }) => ({
        url: `/usuarios/${usuario_id}/cambiar-contrasena`,
        method: 'PUT',
        body: new URLSearchParams({
          contrasena_actual,
          nueva_contrasena,
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
    }),

    obtenerEstructuraUsuario: builder.query({
      query: (usuario_id) => `/usuarios/${usuario_id}/estructura`,
    }),
    
  }),
});

export const {
  useObtenerPerfilQuery,
  useLazyObtenerPerfilQuery,
  useObtenerMisUsuariosQuery,
  useObtenerMisEmpresasQuery,
  useObtenerMisCategoriasQuery,
  useObtenerMisActividadesQuery,
  useObtenerMisListasActividadesQuery,
  useObtenerUsuariosQuery,
  useLazyObtenerUsuariosQuery,
  useCrearUsuarioMutation,
  useEditarUsuarioMutation,
  useEliminarUsuarioMutation,
  useObtenerUsuarioPorIdQuery,
  useObtenerMiCompaniaQuery,
  useLazyObtenerMiCompaniaQuery,
  useCambiarContrasenaMutation,
  useObtenerEstructuraUsuarioQuery,
  useLazyObtenerEstructuraUsuarioQuery,
} = userApi;
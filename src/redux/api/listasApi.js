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

    // FEEDBACK QR
    crearFeedbackList: builder.mutation({
      // POST /listas_actividades/feedback/list
      query: (payload) => ({
        url: "/listas_actividades/feedback/list",
        method: "POST",
        body: payload, // { empresa_id, locacion_id?, area_id?, contexto? }
      }),
    }),
    obtenerFeedbackQr: builder.query({
      // GET /listas_actividades/feedback
      query: () => "/listas_actividades/feedback",
    }),
    actualizarFeedbackQr: builder.mutation({
      // PUT /listas_actividades/feedback/{feedback_id}
      query: ({ feedback_id, datos }) => ({
        url: `/listas_actividades/feedback/${feedback_id}`,
        method: "PUT",
        body: datos, // { empresa_id?, locacion_id?, area_id?, contexto? }
      }),
    }),
    eliminarFeedbackQr: builder.mutation({
      // DELETE /listas_actividades/feedback/{feedback_id}
      query: (feedback_id) => ({
        url: `/listas_actividades/feedback/${feedback_id}`,
        method: "DELETE",
      }),
    }),

    // FEEDBACK USER
    obtenerFeedbackUser: builder.query({
      // GET /listas_actividades/feedback-user
      query: () => "/listas_actividades/feedback-user",
    }),
    crearFeedbackUser: builder.mutation({
      // POST /listas_actividades/feedback-user (multipart/form-data)
      query: (data) => {
        const formData = new FormData();
        if (data.empresa !== undefined && data.empresa !== null && data.empresa !== "") {
          formData.append("empresa", data.empresa);
        }
        if (data.direccion !== undefined && data.direccion !== null && data.direccion !== "") {
          formData.append("direccion", data.direccion);
        }
        formData.append("calificacion", String(data.calificacion));
        formData.append("company_id", data.company_id);
        if (data.empresa_id !== undefined && data.empresa_id !== null && data.empresa_id !== "") {
          formData.append("empresa_id", data.empresa_id);
        }
        if (data.contexto !== undefined && data.contexto !== null && data.contexto !== "") {
          formData.append("contexto", data.contexto);
        }
        if (data.locacion_id !== undefined && data.locacion_id !== null && data.locacion_id !== "") {
          formData.append("locacion_id", data.locacion_id);
        }
        if (data.area_id !== undefined && data.area_id !== null && data.area_id !== "") {
          formData.append("area_id", data.area_id);
        }

        if (data.nombre !== undefined && data.nombre !== null && data.nombre !== "") {
          formData.append("nombre", data.nombre);
        }
        if (data.comentario !== undefined && data.comentario !== null && data.comentario !== "") {
          formData.append("comentario", data.comentario);
        }
        if (data.foto) {
          formData.append("foto", data.foto); // debe ser un File/Blob
        }

        return {
          url: "/listas_actividades/feedback-user",
          method: "POST",
          body: formData,
        };
      },
    }),
    actualizarFeedbackUser: builder.mutation({
      // PUT /listas_actividades/feedback-user/{feedback_id} (multipart/form-data)
      query: ({ feedback_id, data }) => {
        const formData = new FormData();
        if (data.empresa !== undefined && data.empresa !== null) {
          formData.append("empresa", data.empresa);
        }
        if (data.direccion !== undefined && data.direccion !== null) {
          formData.append("direccion", data.direccion);
        }
        if (data.calificacion !== undefined && data.calificacion !== null) {
          formData.append("calificacion", String(data.calificacion));
        }
        if (data.nombre !== undefined && data.nombre !== null) {
          formData.append("nombre", data.nombre);
        }
        if (data.comentario !== undefined && data.comentario !== null) {
          formData.append("comentario", data.comentario);
        }
        if (data.locacion_id !== undefined && data.locacion_id !== null && data.locacion_id !== "") {
          formData.append("locacion_id", data.locacion_id);
        }
        if (data.area_id !== undefined && data.area_id !== null && data.area_id !== "") {
          formData.append("area_id", data.area_id);
        }
        if (data.foto) {
          formData.append("foto", data.foto);
        }
        return {
          url: `/listas_actividades/feedback-user/${feedback_id}`,
          method: "PUT",
          body: formData,
        };
      },
    }),
    eliminarFeedbackUser: builder.mutation({
      // DELETE /listas_actividades/feedback-user/{feedback_id}
      query: (feedback_id) => ({
        url: `/listas_actividades/feedback-user/${feedback_id}`,
        method: "DELETE",
      }),
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
  useCrearFeedbackListMutation,
  useObtenerFeedbackQrQuery,
  useActualizarFeedbackQrMutation,
  useEliminarFeedbackQrMutation,
  useObtenerFeedbackUserQuery,
  useCrearFeedbackUserMutation,
  useActualizarFeedbackUserMutation,
  useEliminarFeedbackUserMutation,
} = listasApi;

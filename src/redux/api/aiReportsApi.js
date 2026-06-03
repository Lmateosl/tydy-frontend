import { apiSlice } from "./apiSlice";

const buildQueryString = (params = {}) => {
  const query = [];
  if (params.scope_type) query.push(`scope_type=${encodeURIComponent(params.scope_type)}`);
  if (params.scope_entity_id) query.push(`scope_entity_id=${encodeURIComponent(params.scope_entity_id)}`);
  if (params.period_type) query.push(`period_type=${encodeURIComponent(params.period_type)}`);
  if (params.status) query.push(`status=${encodeURIComponent(params.status)}`);
  if (params.limit) query.push(`limit=${encodeURIComponent(params.limit)}`);
  if (params.offset) query.push(`offset=${encodeURIComponent(params.offset)}`);
  return query.length ? `?${query.join("&")}` : "";
};

export const aiReportsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    obtenerAISettings: builder.query({
      query: () => "/ai/settings",
      providesTags: ["AIUsage"],
    }),

    obtenerAIUsageCurrent: builder.query({
      query: () => "/ai/usage/current",
      providesTags: ["AIUsage"],
    }),

    generarAIReport: builder.mutation({
      query: (payload) => ({
        url: "/ai/reports/generate",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["AIReports", "AIUsage"],
    }),

    obtenerAIReports: builder.query({
      query: (params = {}) => `/ai/reports${buildQueryString(params)}`,
      providesTags: (result) => {
        const items = result?.items || [];
        return [
          "AIReports",
          ...items.map((report) => ({ type: "AIReports", id: report.id })),
        ];
      },
    }),

    obtenerAIReportDetalle: builder.query({
      query: (reportId) => `/ai/reports/${reportId}`,
      providesTags: (result, error, reportId) => [{ type: "AIReports", id: reportId }],
    }),

    obtenerAIReportStatus: builder.query({
      query: (reportId) => `/ai/reports/${reportId}/status`,
      providesTags: (result, error, reportId) => [{ type: "AIReports", id: reportId }],
    }),
  }),
});

export const {
  useObtenerAISettingsQuery,
  useObtenerAIUsageCurrentQuery,
  useGenerarAIReportMutation,
  useObtenerAIReportsQuery,
  useObtenerAIReportDetalleQuery,
  useObtenerAIReportStatusQuery,
} = aiReportsApi;

import { useEffect, useMemo, useState } from "react";
import { FileStack, LoaderCircle, Sparkles } from "lucide-react";
import { useObtenerAIReportDetalleQuery, useObtenerAIReportsQuery } from "../../redux/api/aiReportsApi";
import AIReportDetailModal from "./AIReportDetailModal";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatScope = (report) => {
  if (report.scope_type === "company") return "Compañía";
  if (report.scope_type === "empresa") return "Empresa";
  if (report.scope_type === "locacion") return "Locación";
  return report.scope_type || "Scope";
};

const formatPeriod = (report) => {
  const start = formatDateTime(report.period_start).split(",")[0];
  const end = formatDateTime(report.period_end).split(",")[0];
  return `${report.period_type === "monthly" ? "Mensual" : "Semanal"} · ${start} - ${end}`;
};

const statusStyles = {
  queued: "bg-[#e7f1fb] text-[#0A5EA8] border-[#bfd8f1]",
  processing: "bg-[#fff6db] text-[#8a6500] border-[#f4df9d]",
  completed: "bg-[#e7f8ea] text-[#237a2b] border-[#bfe7c4]",
  failed: "bg-[#fde9e9] text-[#b23030] border-[#f4c2c2]",
};

const formatScopeLabel = (report) => {
  const scope = formatScope(report);
  return report.period_type === "monthly" ? `${scope} · Monthly` : `${scope} · Weekly`;
};

export default function AIReportsPanel({ onGenerateFirstReport, onGenerateAgain }) {
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(0);

  const { data, isLoading, isFetching } = useObtenerAIReportsQuery(
    { limit: 20, offset: 0 },
    {
      pollingInterval,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      refetchOnMountOrArgChange: true,
    }
  );

  const selectedReport = useMemo(
    () => data?.items?.find((item) => item.id === selectedReportId) || null,
    [data?.items, selectedReportId]
  );

  const shouldPoll = useMemo(
    () => (data?.items || []).some((report) => ["queued", "processing"].includes(report.status)),
    [data?.items]
  );

  useEffect(() => {
    setPollingInterval(shouldPoll ? 5000 : 0);
  }, [shouldPoll]);

  const {
    data: reportDetail,
    isLoading: isLoadingDetail,
  } = useObtenerAIReportDetalleQuery(selectedReportId, {
    skip: !selectedReportId,
    pollingInterval: selectedReport?.status === "queued" || selectedReport?.status === "processing" ? 5000 : 0,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  return (
    <>
      <section className="rounded-[28px] bg-white border border-[#e6f0f8] shadow-xl shadow-[#0A2A47]/5 p-5 md:p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e9f6ea] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#237a2b]">
                <Sparkles size={12} />
                AI
              </span>
              <span className="inline-flex rounded-full bg-[#eef4fa] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#0A2A47]">
                Admin only
              </span>
            </div>
            <h3 className="mt-3 text-2xl font-extrabold text-[#0A2A47] tracking-tight">Reportes generados</h3>
            <p className="mt-1 text-sm text-gray-500">
              Historial de resúmenes AI creados para actividades, incidentes y feedback verificado.
            </p>
          </div>
          {shouldPoll ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dbe8f2] bg-[#f8fbfd] px-3 py-2 text-sm font-semibold text-[#0A2A47]">
              <LoaderCircle size={16} className="animate-spin text-[#3BAE3D]" />
              Generando...
            </div>
          ) : null}
        </div>

        {isLoading || isFetching ? (
          <div className="rounded-2xl border border-dashed border-[#dbe8f2] bg-[#f8fbfd] px-4 py-5 text-sm text-gray-500 text-center">
            Cargando reportes AI...
          </div>
        ) : !data?.items?.length ? (
          <div className="rounded-[26px] border border-dashed border-[#dbe8f2] bg-[#f8fbfd] px-6 py-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3BAE3D]">AI Operations Intelligence</p>
            <h4 className="mt-3 text-2xl font-extrabold text-[#0A2A47]">Generate your first AI report</h4>
            <p className="mt-2 text-sm text-gray-500">
              Obtain a verified operational summary grounded in TYDY execution data.
            </p>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3 text-left">
              {["Operational summary", "Risk insights", "Problem areas", "Recommendations"].map((item) => (
                <div key={item} className="rounded-2xl border border-[#edf3f8] bg-white px-4 py-4">
                  <p className="font-semibold text-[#0A2A47]">{item}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={onGenerateFirstReport}
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#071f35] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#071f35]/15"
            >
              Generate First Report
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-[#e6f0f8]">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#edf3f8]">
                <thead className="bg-[#f8fbfd]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.16em] text-gray-500">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.16em] text-gray-500">Scope</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.16em] text-gray-500">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.16em] text-gray-500">Modelo</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.16em] text-gray-500">Costo</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.16em] text-gray-500">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf3f8] bg-white">
                  {data.items.map((report) => (
                    <tr key={report.id} className="hover:bg-[#fbfdff]">
                      <td className="px-4 py-4 align-top">
                        <p className="text-sm font-semibold text-[#0A2A47]">{formatDateTime(report.created_at)}</p>
                        <p className="mt-1 text-xs text-gray-500">{formatPeriod(report)}</p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className="inline-flex items-center gap-2 rounded-full border border-[#e6f0f8] bg-[#fbfdff] px-2.5 py-1 text-xs font-bold text-[#0A2A47]">
                          <FileStack size={14} />
                          {formatScopeLabel(report)}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${statusStyles[report.status] || statusStyles.queued}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p className="text-sm font-semibold text-[#0A2A47]">{report.model || "No disponible"}</p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p className="text-sm text-gray-500">No disponible en V1</p>
                      </td>
                      <td className="px-4 py-4 align-top text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedReportId(report.id)}
                          className="inline-flex items-center justify-center rounded-2xl bg-[#071f35] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#071f35]/15"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <AIReportDetailModal
        isOpen={Boolean(selectedReportId)}
        onClose={() => setSelectedReportId(null)}
        report={reportDetail || selectedReport}
        isLoading={isLoadingDetail}
        onGenerateAgain={onGenerateAgain}
      />
    </>
  );
}

import { FileText, LoaderCircle, X } from "lucide-react";

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

const renderKeyMetrics = (metrics = {}) => {
  const entries = Object.entries(metrics);
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500">No hay métricas clave disponibles.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-2xl border border-[#edf3f8] bg-[#fbfdff] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
            {value?.label || key.replaceAll("_", " ")}
          </p>
          <p className="mt-1 text-xl font-extrabold text-[#0A2A47]">{value?.value ?? "no disponible"}</p>
        </div>
      ))}
    </div>
  );
};

const renderSources = (sources = []) => {
  if (!sources.length) {
    return <p className="text-sm text-gray-500">No hay fuentes registradas.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {sources.map((citation, index) => (
        <div key={`${citation.source_id || "citation"}-${index}`} className="rounded-2xl border border-[#edf3f8] bg-[#fbfdff] px-4 py-3 text-sm">
          <p className="font-semibold text-[#0A2A47]">{citation.label || citation.source_id || "Sin etiqueta"}</p>
          <p className="mt-1 text-gray-500">{citation.source_type || "source"}</p>
        </div>
      ))}
    </div>
  );
};

export default function AIReportDetailModal({ isOpen, onClose, report, isLoading, onGenerateAgain }) {
  if (!isOpen) return null;

  const status = report?.status;
  const reportJson = report?.report_json || {};
  const citations = report?.citations_json || reportJson.citations || [];

  return (
    <div className="fixed inset-0 z-50 bg-[#071f35]/45 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-[28px] bg-white shadow-2xl border border-[#dbe8f2] overflow-hidden max-h-[88vh] flex flex-col">
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-[#edf3f8]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3BAE3D]">AI Report</p>
            <h3 className="text-2xl font-extrabold text-[#0A2A47] tracking-tight">
              {reportJson.title || "Detalle del reporte AI"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {reportJson.period_label || "Resumen operativo generado con datos verificados de TYDY."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl border border-[#e6f0f8] bg-[#f8fbfd] text-[#0A2A47] flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-5">
          {isLoading ? (
            <div className="rounded-2xl border border-[#e6f0f8] bg-[#f8fbfd] px-5 py-6 text-sm text-gray-500">
              Cargando detalle del reporte...
            </div>
          ) : status === "queued" || status === "processing" ? (
            <div className="rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-5 py-6">
              <div className="flex items-center gap-3 text-[#0A2A47]">
                <LoaderCircle size={18} className="animate-spin" />
                <p className="font-semibold">
                  {status === "queued" ? "Waiting for processing" : "Generating report with AI"}
                </p>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                TYDY está preparando el resumen operativo usando actividades, incidentes y feedback verificado.
              </p>
            </div>
          ) : status === "failed" ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6">
              <p className="font-semibold text-red-700">Generation Failed</p>
              <p className="mt-2 text-sm text-red-600">{report?.error_message || "Ocurrió un error inesperado."}</p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGenerateAgain?.();
                  }}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#071f35] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#071f35]/15"
                >
                  Generate Again
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-[#edf3f8] bg-[#fbfdff] px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Estado</p>
                  <p className="mt-1 text-lg font-bold text-[#0A2A47] capitalize">{report?.status}</p>
                </div>
                <div className="rounded-2xl border border-[#edf3f8] bg-[#fbfdff] px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Creado</p>
                  <p className="mt-1 text-sm font-semibold text-[#0A2A47]">{formatDateTime(report?.created_at)}</p>
                </div>
                <div className="rounded-2xl border border-[#edf3f8] bg-[#fbfdff] px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Completado</p>
                  <p className="mt-1 text-sm font-semibold text-[#0A2A47]">{formatDateTime(report?.completed_at)}</p>
                </div>
              </div>

              <section className="rounded-[26px] border border-[#e6f0f8] bg-white px-5 py-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={18} className="text-[#0A2A47]" />
                  <h4 className="text-lg font-bold text-[#0A2A47]">Executive Summary</h4>
                </div>
                <p className="text-sm leading-7 text-gray-700">
                  {reportJson.executive_summary || "no disponible"}
                </p>
              </section>

              <section className="rounded-[26px] border border-[#e6f0f8] bg-white px-5 py-5">
                <h4 className="text-lg font-bold text-[#0A2A47] mb-3">Key Metrics</h4>
                {renderKeyMetrics(reportJson.key_metrics)}
              </section>

              <section className="rounded-[26px] border border-[#e6f0f8] bg-white px-5 py-5">
                <h4 className="text-lg font-bold text-[#0A2A47] mb-3">Problem Areas</h4>
                {(reportJson.problem_areas || []).length === 0 ? (
                  <p className="text-sm text-gray-500">No hay áreas problemáticas destacadas.</p>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-[#edf3f8]">
                    <table className="min-w-full divide-y divide-[#edf3f8]">
                      <thead className="bg-[#f8fbfd]">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.16em] text-gray-500">Area</th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.16em] text-gray-500">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#edf3f8] bg-white">
                        {reportJson.problem_areas.map((item, index) => (
                          <tr key={`${item.name || "problem-area"}-${index}`}>
                            <td className="px-4 py-4 text-sm font-semibold text-[#0A2A47]">{item.name || "Sin nombre"}</td>
                            <td className="px-4 py-4 text-sm text-gray-600">{item.reason || "no disponible"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="rounded-[26px] border border-[#e6f0f8] bg-white px-5 py-5">
                <h4 className="text-lg font-bold text-[#0A2A47] mb-3">Recommendations</h4>
                {(reportJson.recommendations || []).length === 0 ? (
                  <p className="text-sm text-gray-500">No hay recomendaciones disponibles.</p>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {reportJson.recommendations.map((item, index) => (
                      <div key={`recommendation-${index}`} className="rounded-2xl border border-[#edf3f8] bg-[#fbfdff] px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-semibold text-[#0A2A47]">
                            {typeof item === "string" ? item : item.text || "no disponible"}
                          </p>
                          {typeof item === "object" && item?.priority ? (
                            <span className="inline-flex rounded-full bg-[#eef4fa] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#0A2A47]">
                              {item.priority}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-[26px] border border-[#e6f0f8] bg-white px-5 py-5">
                <h4 className="text-lg font-bold text-[#0A2A47] mb-3">Caveats</h4>
                {(reportJson.caveats || []).length === 0 ? (
                  <p className="text-sm text-gray-500">Sin observaciones adicionales.</p>
                ) : (
                  <ul className="space-y-2 list-disc pl-5 text-sm text-gray-600">
                    {reportJson.caveats.map((item, index) => (
                      <li key={`caveat-${index}`}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-[26px] border border-[#e6f0f8] bg-white px-5 py-5">
                <h4 className="text-lg font-bold text-[#0A2A47] mb-3">Sources</h4>
                {renderSources(citations)}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { useSelector } from "react-redux";
import Layout from "../../../components/Layout";
import AIReportsPanel from "../../../components/ai/AIReportsPanel";
import GenerateAIReportModal from "../../../components/ai/GenerateAIReportModal";
import {
  useGenerarAIReportMutation,
  useObtenerAIReportDetalleQuery,
  useObtenerAIReportsQuery,
  useObtenerAISettingsQuery,
  useObtenerAIUsageCurrentQuery,
} from "../../../redux/api/aiReportsApi";
import {
  useObtenerActividadesUsuarioQuery,
  useObtenerRiesgosOperativosQuery,
  useObtenerResumenOperativoQuery,
} from "../../../redux/api/historialApi";
import { useObtenerFeedbackUserQuery } from "../../../redux/api/listasApi";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Building2,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MapPin,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import {
  formatBackendDateTime,
  getBusinessDateParts,
  getBusinessPeriodRange,
} from "../../../utils/dateTime";

const PERIODOS_DASHBOARD = [
  { value: "hoy", label: "Hoy" },
  { value: "7dias", label: "7 dias" },
  { value: "1mes", label: "1 mes" },
  { value: "6meses", label: "6 meses" },
  { value: "1anio", label: "1 año" },
];

function TarjetaResumen({ titulo, valor, icono, principal = false }) {
  if (principal) {
    return (
      <div className="relative overflow-hidden bg-[#071f35] text-white rounded-2xl p-4 flex flex-col justify-between shadow-xl shadow-[#071f35]/15 border border-white/10 min-h-[118px]">
        <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.24),_transparent_38%)]" />
        <div className="relative flex items-start justify-between gap-3">
          <span className="text-sm text-white/70 font-medium">{titulo}</span>
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 text-[#b7f7ba] flex items-center justify-center">
            {icono}
          </div>
        </div>
        <div className="relative mt-4">
          <span className="text-3xl font-extrabold tracking-tight">{valor}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 border border-[#e6f0f8] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{titulo}</p>
        <div className="w-9 h-9 rounded-xl bg-[#f4f8fb] text-[#0A2A47] flex items-center justify-center border border-[#e6f0f8]">
          {icono}
        </div>
      </div>
      <p className="text-2xl font-extrabold text-[#0A2A47] tracking-tight">{valor}</p>
    </div>
  );
}

const clampPercentage = (used, limit) => {
  if (!limit || limit <= 0) return 0;
  return Math.max(0, Math.min(100, (Number(used || 0) / Number(limit)) * 100));
};

const getAvailabilityRatio = (remaining, limit) => {
  if (!limit || limit <= 0) return 0;
  return Math.max(0, Number(remaining || 0) / Number(limit));
};

const getUsageTone = (remaining, limit) => {
  const ratio = getAvailabilityRatio(remaining, limit);
  if (ratio <= 0.1) {
    return {
      accent: "text-[#b23030]",
      badge: "bg-[#fde9e9] text-[#b23030] border-[#f4c2c2]",
      bar: "bg-[#d64545]",
      track: "bg-[#fde9e9]",
    };
  }
  if (ratio <= 0.25) {
    return {
      accent: "text-[#8a6500]",
      badge: "bg-[#fff6db] text-[#8a6500] border-[#f4df9d]",
      bar: "bg-[#e0a100]",
      track: "bg-[#fff6db]",
    };
  }
  return {
    accent: "text-[#237a2b]",
    badge: "bg-[#e7f8ea] text-[#237a2b] border-[#bfe7c4]",
    bar: "bg-[#3BAE3D]",
    track: "bg-[#e7f8ea]",
  };
};

const formatCompactNumber = (value) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

function UsageMetricCard({
  title,
  usedLabel,
  remainingLabel,
  helper,
  progress,
  tone,
}) {
  return (
    <div className="rounded-[24px] border border-[#e6f0f8] bg-[#f8fbfd] px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-extrabold text-[#0A2A47]">{usedLabel}</p>
          <p className={`mt-1 text-sm font-semibold ${tone.accent}`}>{remainingLabel}</p>
        </div>
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${tone.badge}`}>
          Live
        </span>
      </div>
      <div className="mt-4">
        <div className={`h-2.5 w-full overflow-hidden rounded-full ${tone.track}`}>
          <div className={`h-full rounded-full transition-all ${tone.bar}`} style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-gray-500">{helper}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const usuario = useSelector((state) => state.usuarios?.usuarioLogueado);
  const isAdmin = usuario?.rol === "admin";
  const [periodoDashboard, setPeriodoDashboard] = useState("hoy");
  const [showGenerateReportModal, setShowGenerateReportModal] = useState(false);

  const rangoDashboard = useMemo(() => {
    const { desde, hasta } = getBusinessPeriodRange(periodoDashboard);
    return {
      desde,
      hasta,
      params: {
        desde: formatBackendDateTime(desde),
        hasta: formatBackendDateTime(hasta),
      },
    };
  }, [periodoDashboard]);

  const {
    data: resumen,
    isLoading,
    isFetching,
    isError,
  } = useObtenerResumenOperativoQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const {
    data: actividades = [],
    isLoading: isLoadingActividades,
  } = useObtenerActividadesUsuarioQuery(rangoDashboard.params, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const {
    data: feedbacks = [],
    isLoading: isLoadingFeedbacks,
  } = useObtenerFeedbackUserQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const {
    data: riesgosData,
    isLoading: isLoadingRiesgos,
    isFetching: isFetchingRiesgos,
  } = useObtenerRiesgosOperativosQuery(rangoDashboard.params, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const {
    data: aiSettings,
    isLoading: isLoadingAISettings,
  } = useObtenerAISettingsQuery(undefined, {
    skip: !isAdmin,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const {
    data: aiUsageCurrent,
    isLoading: isLoadingAIUsage,
  } = useObtenerAIUsageCurrentQuery(undefined, {
    skip: !isAdmin,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const { data: aiReportsData } = useObtenerAIReportsQuery(
    { limit: 20, offset: 0 },
    {
      skip: !isAdmin,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );
  const [generarAIReport, { isLoading: isGeneratingAIReport }] = useGenerarAIReportMutation();

  const cargando = isLoading || isFetching;
  const valor = (campo) => (cargando ? "..." : resumen?.[campo] ?? 0);
  const valorHoras = (campo) => {
    if (cargando) return "...";
    const numero = Number(resumen?.[campo] ?? 0);
    return `${numero.toFixed(1)} h`;
  };
  const riesgosOperativos = {
    locacionesConProblemas: riesgosData?.locaciones_con_problemas ?? [],
    empleadosConTareasPendientes: riesgosData?.empleados_con_pendientes ?? [],
    incidentesRecientes: riesgosData?.incidentes_recientes ?? [],
    locacionesConMasIncidentes: riesgosData?.locaciones_con_mas_incidentes ?? [],
  };

  const renderEmptyState = (mensaje) => (
    <div className="rounded-2xl border border-dashed border-[#dbe8f2] bg-[#f8fbfd] px-4 py-5 text-sm text-gray-500 text-center">
      {mensaje}
    </div>
  );

  const formatearFecha = (valorFecha) => {
    if (!valorFecha) return "-";
    const fecha = new Date(valorFecha);
    if (Number.isNaN(fecha.getTime())) return "-";
    return fecha.toLocaleString("es-ES", {
      timeZone: "America/Guayaquil",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatearTipoIncidente = (tipo) => {
    if (!tipo) return "Sin tipo";
    return tipo
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letra) => letra.toUpperCase());
  };

  const colores = {
    azul: "#0A2A47",
    verde: "#3BAE3D",
    azulClaro: "#DCEBFA",
    rojo: "#D64545",
    amarillo: "#E0A100",
  };

  const aiStatusLabel = aiSettings?.ai_enabled ? "Habilitado" : "Deshabilitado";
  const aiPlanName = aiSettings?.plan_name || "Sin plan";
  const aiUsage = aiUsageCurrent?.usage;
  const aiRemaining = aiUsageCurrent?.remaining;
  const aiReports = aiReportsData?.items || [];
  const lastReport = aiReports[0] || null;
  const hasReports = aiReports.length > 0;
  const hasPendingReports = aiReports.some((report) => ["queued", "processing"].includes(report.status));
  const {
    data: lastReportDetail,
  } = useObtenerAIReportDetalleQuery(lastReport?.id, {
    skip: !isAdmin || !lastReport?.id,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const reportsProgress = clampPercentage(aiUsage?.reports_generated_count, aiSettings?.reports_monthly_limit);
  const tokensProgress = clampPercentage(aiUsage?.total_tokens, aiSettings?.monthly_token_limit);
  const costProgress = clampPercentage(aiUsage?.total_cost_usd, aiSettings?.monthly_cost_limit_usd);
  const reportsTone = getUsageTone(aiRemaining?.reports_remaining, aiSettings?.reports_monthly_limit);
  const tokensTone = getUsageTone(aiRemaining?.tokens_remaining, aiSettings?.monthly_token_limit);
  const costTone = getUsageTone(aiRemaining?.cost_remaining_usd, aiSettings?.monthly_cost_limit_usd);
  const showUsageWarning =
    getAvailabilityRatio(aiRemaining?.reports_remaining, aiSettings?.reports_monthly_limit) <= 0.1 ||
    getAvailabilityRatio(aiRemaining?.tokens_remaining, aiSettings?.monthly_token_limit) <= 0.1 ||
    getAvailabilityRatio(aiRemaining?.cost_remaining_usd, aiSettings?.monthly_cost_limit_usd) <= 0.1;

  const handleGenerateAIReport = async (payload) => {
    try {
      await generarAIReport(payload).unwrap();
    } catch (error) {
      throw error;
    }
  };

  const actividadesPorDia = useMemo(() => {
    const agrupado = actividades.reduce((acc, actividad) => {
      if (!actividad?.hora_inicio) return acc;
      const partesFecha = getBusinessDateParts(actividad.hora_inicio);
      if (!partesFecha) return acc;
      const clave = `${String(partesFecha.day).padStart(2, "0")}/${String(partesFecha.month).padStart(2, "0")}`;
      acc[clave] = (acc[clave] || 0) + 1;
      return acc;
    }, {});

    const entries = Object.entries(agrupado).sort((a, b) => {
      const [diaA, mesA] = a[0].split("/");
      const [diaB, mesB] = b[0].split("/");
      return new Date(2000, Number(mesA) - 1, Number(diaA)) - new Date(2000, Number(mesB) - 1, Number(diaB));
    });

    return {
      categories: entries.map(([fecha]) => fecha),
      series: entries.map(([, total]) => total),
    };
  }, [actividades]);

  const actividadesPorLocacion = useMemo(() => {
    const agrupado = actividades.reduce((acc, actividad) => {
      const nombreLocacion =
        actividad?.usuario?.area?.locacion?.nombre || "Sin locación";
      acc[nombreLocacion] = (acc[nombreLocacion] || 0) + 1;
      return acc;
    }, {});

    const entries = Object.entries(agrupado)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return {
      categories: entries.map(([nombre]) => nombre),
      series: entries.map(([, total]) => total),
    };
  }, [actividades]);

  const feedbackPorCalificacion = useMemo(() => {
    const buckets = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const feedbacksFiltrados = feedbacks.filter((feedback) => {
      if (!feedback?.creado_en) return false;
      const fecha = new Date(feedback.creado_en);
      if (Number.isNaN(fecha.getTime())) return false;
      return fecha >= rangoDashboard.desde && fecha <= rangoDashboard.hasta;
    });

    feedbacksFiltrados.forEach((feedback) => {
      const rating = Math.round(Number(feedback?.calificacion));
      if (rating >= 1 && rating <= 5) {
        buckets[rating] += 1;
      }
    });

    return {
      categories: ["1", "2", "3", "4", "5"],
      series: [1, 2, 3, 4, 5].map((rating) => buckets[rating]),
    };
  }, [feedbacks, rangoDashboard.desde, rangoDashboard.hasta]);

  const opcionesBaseChart = {
    chart: {
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: "inherit",
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 3 },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 4,
    },
    legend: { show: false },
    tooltip: {
      theme: "light",
    },
    xaxis: {
      labels: {
        style: { colors: "#6B7280", fontSize: "12px" },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: "#6B7280", fontSize: "12px" },
      },
    },
  };

  const renderTabsPeriodo = (periodoActivo, onChange) => (
    <div className="inline-flex flex-wrap gap-1.5 rounded-2xl bg-[#f4f8fb] border border-[#e6f0f8] p-1.5">
      {PERIODOS_DASHBOARD.map((periodo) => {
        const activo = periodoActivo === periodo.value;
        return (
          <button
            key={periodo.value}
            type="button"
            onClick={() => onChange(periodo.value)}
            className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              activo
                ? "bg-[#071f35] text-white shadow-md shadow-[#071f35]/15"
                : "text-[#0A2A47] hover:bg-white hover:shadow-sm"
            }`}
          >
            {periodo.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <Layout>
      <div className="p-4 md:p-6 bg-[#f4f8fb] min-h-full">
        <div className="relative overflow-hidden mb-6 rounded-[28px] bg-white border border-[#e6f0f8] shadow-xl shadow-[#0A2A47]/5 p-5 md:p-6">
          <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.12),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(10,42,71,0.08),_transparent_35%)]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#0A2A47] tracking-tight">
                Dashboard operativo
              </h1>
              <p className="mt-2 text-sm text-gray-500 max-w-xl">
                Estado real de la operación en el periodo seleccionado.
              </p>
            </div>
            <div className="lg:max-w-[420px] lg:text-right">
              {renderTabsPeriodo(periodoDashboard, setPeriodoDashboard)}
            </div>
          </div>
        </div>

        {isAdmin ? (
          <div className="mb-6 space-y-6">
            <section className="rounded-[28px] bg-white border border-[#e6f0f8] shadow-xl shadow-[#0A2A47]/5 p-5 md:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#e9f6ea] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#237a2b]">
                      <Sparkles size={12} />
                      AI
                    </span>
                    <span className="inline-flex rounded-full bg-[#eef4fa] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#0A2A47]">
                      Admin only
                    </span>
                  </div>
                  <h2 className="mt-3 text-3xl font-extrabold text-[#0A2A47] tracking-tight">
                    AI Operations Reports
                  </h2>
                  <p className="mt-2 text-sm text-gray-500 max-w-2xl">
                    Genera resúmenes inteligentes sobre actividades, incidentes y feedback usando datos verificados de TYDY.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGenerateReportModal(true)}
                  disabled={!aiSettings?.ai_enabled || isGeneratingAIReport}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#071f35] text-white px-5 py-3 text-sm font-semibold shadow-lg shadow-[#071f35]/15 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isGeneratingAIReport ? "Generando..." : "Generar reporte AI"}
                </button>
              </div>

              {showUsageWarning && aiSettings?.ai_enabled ? (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-red-800">
                  <p className="font-semibold">AI quota is almost exhausted.</p>
                  <p className="mt-1 text-sm">
                    Queda menos del 10% de al menos uno de los límites mensuales de AI para esta compañía.
                  </p>
                </div>
              ) : null}

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-[#e6f0f8] bg-[#f8fbfd] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Estado AI</p>
                  <p className="mt-2 text-2xl font-extrabold text-[#0A2A47]">
                    {isLoadingAISettings ? "..." : aiStatusLabel}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{aiPlanName}</p>
                  <p className="mt-4 text-xs text-gray-500">
                    Fuente: company_ai_settings y usage mensual verificado de TYDY.
                  </p>
                </div>

                <UsageMetricCard
                  title="Reportes AI"
                  usedLabel={
                    isLoadingAIUsage ? "..." : `${aiUsage?.reports_generated_count ?? 0} / ${aiSettings?.reports_monthly_limit ?? 0}`
                  }
                  remainingLabel={
                    isLoadingAIUsage ? "..." : `${aiRemaining?.reports_remaining ?? 0} reports remaining`
                  }
                  helper="Uso mensual del paquete de reportes AI."
                  progress={reportsProgress}
                  tone={reportsTone}
                />

                <UsageMetricCard
                  title="Tokens"
                  usedLabel={
                    isLoadingAIUsage
                      ? "..."
                      : `${formatCompactNumber(aiUsage?.total_tokens)} / ${formatCompactNumber(aiSettings?.monthly_token_limit)}`
                  }
                  remainingLabel={
                    isLoadingAIUsage ? "..." : `${formatCompactNumber(aiRemaining?.tokens_remaining)} tokens remaining`
                  }
                  helper="Capacidad total de procesamiento AI disponible este mes."
                  progress={tokensProgress}
                  tone={tokensTone}
                />

                <UsageMetricCard
                  title="Costo estimado"
                  usedLabel={
                    isLoadingAIUsage
                      ? "..."
                      : `${formatCurrency(aiUsage?.total_cost_usd)} / ${formatCurrency(aiSettings?.monthly_cost_limit_usd)}`
                  }
                  remainingLabel={
                    isLoadingAIUsage ? "..." : `${formatCurrency(aiRemaining?.cost_remaining_usd)} budget remaining`
                  }
                  helper="Costo acumulado del mes basado en el consumo reportado por TYDY."
                  progress={costProgress}
                  tone={costTone}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="rounded-[24px] border border-[#e6f0f8] bg-white px-5 py-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Remaining This Month</p>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-[#edf3f8] bg-[#fbfdff] px-4 py-4">
                      <p className="text-sm text-gray-500">Reports</p>
                      <p className="mt-2 text-2xl font-extrabold text-[#0A2A47]">
                        {isLoadingAIUsage ? "..." : aiRemaining?.reports_remaining ?? 0}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#edf3f8] bg-[#fbfdff] px-4 py-4">
                      <p className="text-sm text-gray-500">Tokens</p>
                      <p className="mt-2 text-2xl font-extrabold text-[#0A2A47]">
                        {isLoadingAIUsage ? "..." : formatCompactNumber(aiRemaining?.tokens_remaining)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#edf3f8] bg-[#fbfdff] px-4 py-4">
                      <p className="text-sm text-gray-500">Budget</p>
                      <p className="mt-2 text-2xl font-extrabold text-[#0A2A47]">
                        {isLoadingAIUsage ? "..." : formatCurrency(aiRemaining?.cost_remaining_usd)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#e6f0f8] bg-white px-5 py-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Last Report</p>
                  {hasReports ? (
                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-lg font-bold text-[#0A2A47]">
                          {lastReportDetail?.report_json?.title || "Reporte AI generado"}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {formatearFecha(lastReport?.created_at)}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-[#edf3f8] bg-[#fbfdff] px-4 py-3">
                          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Modelo</p>
                          <p className="mt-1 text-sm font-semibold text-[#0A2A47]">{lastReport?.model || "No disponible"}</p>
                        </div>
                        <div className="rounded-2xl border border-[#edf3f8] bg-[#fbfdff] px-4 py-3">
                          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Costo estimado</p>
                          <p className="mt-1 text-sm font-semibold text-[#0A2A47]">No disponible en V1</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-[#dbe8f2] bg-[#f8fbfd] px-4 py-5 text-sm text-gray-500">
                      Sin reportes generados
                    </div>
                  )}
                </div>
              </div>

              {!aiSettings?.ai_enabled && !isLoadingAISettings ? (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-800">
                  <p className="font-semibold">AI Reports no está habilitado para esta compañía.</p>
                  <p className="mt-1 text-sm">
                    Esta función requiere activación comercial para poder generar resúmenes AI.
                  </p>
                </div>
              ) : null}
            </section>

            <AIReportsPanel
              onGenerateFirstReport={() => setShowGenerateReportModal(true)}
              onGenerateAgain={() => setShowGenerateReportModal(true)}
            />
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          <TarjetaResumen
            titulo="Actividades hoy"
            valor={valor("actividades_hoy")}
            icono={<ClipboardList />}
            principal
          />
          <TarjetaResumen
            titulo="Completadas hoy"
            valor={valor("actividades_completadas_hoy")}
            icono={<CheckCircle2 size={16} />}
            principal
          />
          <TarjetaResumen
            titulo="Pendientes hoy"
            valor={valor("actividades_pendientes_hoy")}
            icono={<Clock3 size={16} />}
            principal
          />
          <TarjetaResumen
            titulo="Evidencias faltantes"
            valor={valor("evidencias_faltantes")}
            icono={<Camera size={16} />}
            principal
          />
          <TarjetaResumen
            titulo="Feedbacks negativos"
            valor={valor("feedbacks_negativos")}
            icono={<AlertCircle size={16} />}
            principal
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <TarjetaResumen
            titulo="Incidentes abiertos"
            valor={valor("incidentes_abiertos")}
            icono={<AlertTriangle size={16} />}
          />
          <TarjetaResumen
            titulo="Incidentes resueltos"
            valor={valor("incidentes_resueltos")}
            icono={<CheckCircle2 size={16} />}
          />
          <TarjetaResumen
            titulo="Incidentes críticos"
            valor={valor("incidentes_criticos")}
            icono={<AlertCircle size={16} />}
          />
          <TarjetaResumen
            titulo="Tiempo prom. resolución"
            valor={valorHoras("tiempo_promedio_resolucion_horas")}
            icono={<Clock3 size={16} />}
          />
        </div>

        {isError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
            No se pudo cargar el resumen operativo.
          </div>
        ) : null}

        <div className="mb-6">
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <h2 className="text-2xl font-extrabold text-[#0A2A47] tracking-tight">
              Atención requerida
            </h2>
            <p className="text-sm text-gray-500">
              Problemas detectados en el periodo seleccionado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-[#e6f0f8] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-[#0A2A47]">
                  Locaciones con problemas
                </h3>
                <MapPin size={18} className="text-[#0A2A47]" />
              </div>
              {isLoadingRiesgos || isFetchingRiesgos ? (
                renderEmptyState("Cargando datos...")
              ) : riesgosOperativos.locacionesConProblemas.length === 0 ? (
                renderEmptyState("Sin datos disponibles por ahora.")
              ) : (
                <div className="space-y-3">
                  {riesgosOperativos.locacionesConProblemas.map((locacion) => (
                    <div
                      key={locacion.locacion_id || locacion.locacion_nombre}
                      className="rounded-2xl border border-[#edf3f8] bg-[#fbfdff] px-3 py-3 hover:border-[#dbe8f2] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#0A2A47]">
                            {locacion.locacion_nombre}
                          </p>
                          <p className="text-sm text-gray-500">
                            {locacion.empresa_nombre || "Sin empresa"}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-[#D64545]">
                          {locacion.total_problemas}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                        <span className="rounded-full bg-white border border-[#e6f0f8] px-2.5 py-1">
                          No verificadas: {locacion.actividades_no_verificadas}
                        </span>
                        <span className="rounded-full bg-white border border-[#e6f0f8] px-2.5 py-1">
                          Evidencias faltantes: {locacion.evidencias_faltantes}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-[#e6f0f8] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-[#0A2A47]">
                  Empleados con tareas pendientes
                </h3>
                <Users size={18} className="text-[#0A2A47]" />
              </div>
              {isLoadingRiesgos || isFetchingRiesgos ? (
                renderEmptyState("Cargando datos...")
              ) : riesgosOperativos.empleadosConTareasPendientes.length === 0 ? (
                renderEmptyState("Sin datos disponibles por ahora.")
              ) : (
                <div className="space-y-3">
                  {riesgosOperativos.empleadosConTareasPendientes.map((empleado) => (
                    <div
                      key={empleado.usuario_id || `${empleado.nombre}-${empleado.locacion_nombre || "sin-locacion"}`}
                      className="rounded-2xl border border-[#edf3f8] bg-[#fbfdff] px-3 py-3 hover:border-[#dbe8f2] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#0A2A47]">
                            {empleado.nombre}
                          </p>
                          <p className="text-sm text-gray-500">
                            {empleado.identificacion || "Sin identificación"}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-[#D64545]">
                          {empleado.total_pendientes}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        {empleado.area_nombre || "Sin área"} · {empleado.locacion_nombre || "Sin locación"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-[#e6f0f8] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-[#0A2A47]">
                  Incidentes recientes
                </h3>
                <Building2 size={18} className="text-[#0A2A47]" />
              </div>
              {isLoadingRiesgos || isFetchingRiesgos ? (
                renderEmptyState("Cargando datos...")
              ) : riesgosOperativos.incidentesRecientes.length === 0 ? (
                renderEmptyState("No hay incidentes recientes en este período.")
              ) : (
                <div className="space-y-3">
                  {riesgosOperativos.incidentesRecientes.map((incidente) => (
                    <div
                      key={incidente.id}
                      className="rounded-2xl border border-[#edf3f8] bg-[#fbfdff] px-3 py-3 hover:border-[#dbe8f2] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#0A2A47]">
                            {incidente.locacion_nombre || "Sin locación"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {incidente.area_nombre || "Sin área"}{incidente.empresa_nombre ? ` · ${incidente.empresa_nombre}` : ""}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatearFecha(incidente.creado_en)}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                        <span className="rounded-full bg-white border border-[#e6f0f8] px-2.5 py-1">
                          {formatearTipoIncidente(incidente.tipo)}
                        </span>
                        <span className="rounded-full bg-white border border-[#e6f0f8] px-2.5 py-1">
                          {incidente.estado}
                        </span>
                        <span className="rounded-full bg-white border border-[#e6f0f8] px-2.5 py-1">
                          Prioridad: {incidente.prioridad}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-[#e6f0f8] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-[#0A2A47]">
                  Locaciones con más incidentes
                </h3>
                <MapPin size={18} className="text-[#0A2A47]" />
              </div>
              {isLoadingRiesgos || isFetchingRiesgos ? (
                renderEmptyState("Cargando datos...")
              ) : riesgosOperativos.locacionesConMasIncidentes.length === 0 ? (
                renderEmptyState("No hay locaciones con incidentes en este período.")
              ) : (
                <div className="space-y-3">
                  {riesgosOperativos.locacionesConMasIncidentes.map((locacion) => (
                    <div
                      key={locacion.locacion_id || `${locacion.locacion_nombre}-${locacion.empresa_nombre || "sin-empresa"}`}
                      className="rounded-2xl border border-[#edf3f8] bg-[#fbfdff] px-3 py-3 hover:border-[#dbe8f2] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#0A2A47]">
                            {locacion.locacion_nombre || "Sin locación"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {locacion.empresa_nombre || "Sin empresa"}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-[#D64545]">
                          {locacion.total_incidentes}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                        <span className="rounded-full bg-white border border-[#e6f0f8] px-2.5 py-1">
                          Abiertos: {locacion.incidentes_abiertos}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <h2 className="text-2xl font-extrabold text-[#0A2A2A47] tracking-tight">
              Tendencias operativas
            </h2>
            <p className="text-sm text-gray-500">
              Lectura de actividad y percepción en el mismo periodo.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="bg-white border border-[#e6f0f8] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#0A2A47]">
                    Actividades por día
                  </h3>
                  <p className="text-sm text-gray-500">
                    Ejecuciones registradas en el tiempo
                  </p>
                </div>
                <BarChart3 size={18} className="text-[#0A2A47]" />
              </div>
              {isLoadingActividades ? (
                renderEmptyState("Cargando datos...")
              ) : actividadesPorDia.series.length === 0 ? (
                renderEmptyState("Todavía no hay actividades registradas.")
              ) : (
                <Chart
                  type="area"
                  height={300}
                  series={[{ name: "Actividades", data: actividadesPorDia.series }]}
                  options={{
                    ...opcionesBaseChart,
                    colors: [colores.azul],
                    fill: {
                      type: "gradient",
                      gradient: {
                        shadeIntensity: 1,
                        opacityFrom: 0.28,
                        opacityTo: 0.04,
                        stops: [0, 95, 100],
                      },
                    },
                    xaxis: {
                      ...opcionesBaseChart.xaxis,
                      categories: actividadesPorDia.categories,
                    },
                  }}
                />
              )}
            </div>

            <div className="bg-white border border-[#e6f0f8] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#0A2A47]">
                    Actividades por locación
                  </h3>
                  <p className="text-sm text-gray-500">
                    Locaciones con mayor movimiento
                  </p>
                </div>
                <MapPin size={18} className="text-[#0A2A47]" />
              </div>
              {isLoadingActividades ? (
                renderEmptyState("Cargando datos...")
              ) : actividadesPorLocacion.series.length === 0 ? (
                renderEmptyState("Todavía no hay locaciones con actividad.")
              ) : (
                <Chart
                  type="bar"
                  height={300}
                  series={[{ name: "Actividades", data: actividadesPorLocacion.series }]}
                  options={{
                    ...opcionesBaseChart,
                    colors: [colores.verde],
                    plotOptions: {
                      bar: {
                        borderRadius: 6,
                        columnWidth: "48%",
                      },
                    },
                    xaxis: {
                      ...opcionesBaseChart.xaxis,
                      categories: actividadesPorLocacion.categories,
                    },
                  }}
                />
              )}
            </div>

            <div className="bg-white border border-[#e6f0f8] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#0A2A47]">
                    Feedback por calificación
                  </h3>
                  <p className="text-sm text-gray-500">
                    Distribución real de respuestas recibidas
                  </p>
                </div>
                <Star size={18} className="text-[#0A2A47]" />
              </div>
              {isLoadingFeedbacks ? (
                renderEmptyState("Cargando datos...")
              ) : feedbackPorCalificacion.series.every((total) => total === 0) ? (
                renderEmptyState("Todavía no hay feedback registrado.")
              ) : (
                <Chart
                  type="donut"
                  height={300}
                  series={feedbackPorCalificacion.series}
                  options={{
                    ...opcionesBaseChart,
                    stroke: { width: 0 },
                    colors: [
                      colores.rojo,
                      "#F07B3F",
                      colores.amarillo,
                      "#78B84C",
                      colores.verde,
                    ],
                    labels: feedbackPorCalificacion.categories.map(
                      (rating) => `${rating} estrella${rating === "1" ? "" : "s"}`
                    ),
                    plotOptions: {
                      pie: {
                        donut: {
                          size: "68%",
                        },
                      },
                    },
                    legend: {
                      show: true,
                      position: "bottom",
                      fontSize: "12px",
                      labels: { colors: "#6B7280" },
                    },
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {isAdmin ? (
        <GenerateAIReportModal
          isOpen={showGenerateReportModal}
          onClose={() => setShowGenerateReportModal(false)}
          onSubmit={handleGenerateAIReport}
          isSubmitting={isGeneratingAIReport}
        />
      ) : null}
    </Layout>
  );
}

import { useMemo, useState } from "react";
import Chart from "react-apexcharts";
import Layout from "../../../components/Layout";
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
  MessageSquareWarning,
  Star,
  Users,
} from "lucide-react";

const PERIODOS_DASHBOARD = [
  { value: "hoy", label: "Hoy" },
  { value: "7dias", label: "7 dias" },
  { value: "1mes", label: "1 mes" },
  { value: "6meses", label: "6 meses" },
  { value: "1anio", label: "1 año" },
];

function obtenerRangoPeriodo(periodo) {
  const ahora = new Date();
  const desde = new Date(ahora);
  const hasta = new Date(ahora);

  desde.setHours(0, 0, 0, 0);
  hasta.setHours(23, 59, 59, 999);

  switch (periodo) {
    case "7dias":
      desde.setDate(desde.getDate() - 7);
      break;
    case "1mes":
      desde.setMonth(desde.getMonth() - 1);
      break;
    case "6meses":
      desde.setMonth(desde.getMonth() - 6);
      break;
    case "1anio":
      desde.setFullYear(desde.getFullYear() - 1);
      break;
    case "hoy":
    default:
      break;
  }

  return { desde, hasta };
}

function formatearFechaApi(fecha) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  const hours = String(fecha.getHours()).padStart(2, "0");
  const minutes = String(fecha.getMinutes()).padStart(2, "0");
  const seconds = String(fecha.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

function TarjetaResumen({ titulo, valor, icono, principal = false }) {
  if (principal) {
    return (
      <div className="bg-[#0A2A47] text-white rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <span className="text-sm opacity-80">{titulo}</span>
        <div className="flex items-center justify-between mt-2">
          <span className="text-3xl font-bold">{valor}</span>
          <div className="text-[#3BAE3D]">{icono}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e6f0f8] rounded-xl p-3 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-500">{titulo}</p>
        <div className="text-[#0A2A47]">{icono}</div>
      </div>
      <p className="text-2xl font-bold text-[#0A2A47]">{valor}</p>
    </div>
  );
}

export default function Dashboard() {
  const [periodoDashboard, setPeriodoDashboard] = useState("hoy");

  const rangoDashboard = useMemo(() => {
    const { desde, hasta } = obtenerRangoPeriodo(periodoDashboard);
    return {
      desde,
      hasta,
      params: {
        desde: formatearFechaApi(desde),
        hasta: formatearFechaApi(hasta),
      },
    };
  }, [periodoDashboard]);

  const {
    data: resumen,
    isLoading,
    isFetching,
    isError,
  } = useObtenerResumenOperativoQuery();
  const {
    data: actividades = [],
    isLoading: isLoadingActividades,
  } = useObtenerActividadesUsuarioQuery(rangoDashboard.params);
  const {
    data: feedbacks = [],
    isLoading: isLoadingFeedbacks,
  } = useObtenerFeedbackUserQuery();
  const {
    data: riesgosData,
    isLoading: isLoadingRiesgos,
    isFetching: isFetchingRiesgos,
  } = useObtenerRiesgosOperativosQuery(rangoDashboard.params);

  const cargando = isLoading || isFetching;
  const valor = (campo) => (cargando ? "..." : resumen?.[campo] ?? 0);
  const riesgosOperativos = {
    locacionesConProblemas: riesgosData?.locaciones_con_problemas ?? [],
    empleadosConTareasPendientes: riesgosData?.empleados_con_pendientes ?? [],
    comentariosRecientes: riesgosData?.comentarios_recientes ?? [],
    feedbackNegativoReciente: riesgosData?.feedback_negativo_reciente ?? [],
  };

  const renderEmptyState = (mensaje) => (
    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-500 text-center">
      {mensaje}
    </div>
  );

  const formatearFecha = (valorFecha) => {
    if (!valorFecha) return "-";
    const fecha = new Date(valorFecha);
    if (Number.isNaN(fecha.getTime())) return "-";
    return fecha.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const colores = {
    azul: "#0A2A47",
    verde: "#3BAE3D",
    azulClaro: "#DCEBFA",
    rojo: "#D64545",
    amarillo: "#E0A100",
  };

  const actividadesPorDia = useMemo(() => {
    const agrupado = actividades.reduce((acc, actividad) => {
      if (!actividad?.hora_inicio) return acc;
      const fecha = new Date(actividad.hora_inicio);
      if (Number.isNaN(fecha.getTime())) return acc;
      const clave = fecha.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
      });
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
    <div className="flex flex-wrap gap-2">
      {PERIODOS_DASHBOARD.map((periodo) => {
        const activo = periodoActivo === periodo.value;
        return (
          <button
            key={periodo.value}
            type="button"
            onClick={() => onChange(periodo.value)}
            className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
              activo
                ? "bg-[#0A2A47] text-white"
                : "border border-[#0A2A47] text-[#0A2A47] hover:bg-[#e6f0f8]"
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
      <div className="p-4">
        <div className="mb-6 rounded-2xl bg-white border border-[#e6f0f8] shadow-sm p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-[#0A2A47]">
                Dashboard operativo
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Estado real de la operación en el periodo seleccionado.
              </p>
            </div>
            <div className="lg:max-w-[420px] lg:text-right">
              {renderTabsPeriodo(periodoDashboard, setPeriodoDashboard)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <TarjetaResumen
            titulo="Actividades vencidas"
            valor={valor("actividades_vencidas")}
            icono={<AlertTriangle size={16} />}
          />
          <TarjetaResumen
            titulo="Empleados activos hoy"
            valor={valor("empleados_activos_hoy")}
            icono={<Users size={16} />}
          />
          <TarjetaResumen
            titulo="Locaciones con actividad"
            valor={valor("locaciones_con_actividad_hoy")}
            icono={<MapPin size={16} />}
          />
          <TarjetaResumen
            titulo="Incidentes abiertos"
            valor={valor("incidentes_abiertos")}
            icono={<Building2 size={16} />}
          />
        </div>

        {isError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
            No se pudo cargar el resumen operativo.
          </div>
        ) : null}

        <div className="mb-6">
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <h2 className="text-2xl font-extrabold text-[#0A2A47]">
              Atención requerida
            </h2>
            <p className="text-sm text-gray-500">
              Problemas detectados en el periodo seleccionado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-[#e6f0f8] rounded-xl p-4 shadow-sm">
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
                      className="rounded-lg border border-gray-100 px-3 py-3"
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
                        <span className="rounded-full bg-[#F8FAFC] px-2 py-1">
                          No verificadas: {locacion.actividades_no_verificadas}
                        </span>
                        <span className="rounded-full bg-[#F8FAFC] px-2 py-1">
                          Evidencias faltantes: {locacion.evidencias_faltantes}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-[#e6f0f8] rounded-xl p-4 shadow-sm">
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
                      className="rounded-lg border border-gray-100 px-3 py-3"
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

            <div className="bg-white border border-[#e6f0f8] rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-[#0A2A47]">
                  Comentarios recientes
                </h3>
                <MessageSquareWarning size={18} className="text-[#0A2A47]" />
              </div>
              {isLoadingRiesgos || isFetchingRiesgos ? (
                renderEmptyState("Cargando datos...")
              ) : riesgosOperativos.comentariosRecientes.length === 0 ? (
                renderEmptyState("Sin datos disponibles por ahora.")
              ) : (
                <div className="space-y-3">
                  {riesgosOperativos.comentariosRecientes.map((comentario) => (
                    <div
                      key={comentario.actividad_id}
                      className="rounded-lg border border-gray-100 px-3 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#0A2A47]">
                            {comentario.usuario_nombre || "Sin usuario"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {comentario.locacion_nombre || "Sin locación"}{comentario.empresa_nombre ? ` · ${comentario.empresa_nombre}` : ""}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatearFecha(comentario.hora_fin || comentario.hora_inicio)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                        {comentario.comentario}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-[#e6f0f8] rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-[#0A2A47]">
                  Feedback negativo reciente
                </h3>
                <MessageSquareWarning size={18} className="text-[#0A2A47]" />
              </div>
              {isLoadingRiesgos || isFetchingRiesgos ? (
                renderEmptyState("Cargando datos...")
              ) : riesgosOperativos.feedbackNegativoReciente.length === 0 ? (
                renderEmptyState("Sin datos disponibles por ahora.")
              ) : (
                <div className="space-y-3">
                  {riesgosOperativos.feedbackNegativoReciente.map((feedback) => (
                    <div
                      key={feedback.feedback_id}
                      className="rounded-lg border border-gray-100 px-3 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#0A2A47]">
                            {feedback.nombre || "Anónimo"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {feedback.empresa} · {feedback.direccion}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-[#D64545]">
                          {Number(feedback.calificacion).toFixed(1)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">
                        {feedback.comentario || "Sin comentario"}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        {formatearFecha(feedback.creado_en)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <h2 className="text-2xl font-extrabold text-[#0A2A47]">
              Tendencias operativas
            </h2>
            <p className="text-sm text-gray-500">
              Lectura de actividad y percepción en el mismo periodo.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="bg-white border border-[#e6f0f8] rounded-xl p-4 shadow-sm">
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
                  height={280}
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

            <div className="bg-white border border-[#e6f0f8] rounded-xl p-4 shadow-sm">
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
                  height={280}
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

            <div className="bg-white border border-[#e6f0f8] rounded-xl p-4 shadow-sm">
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
                  height={280}
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
    </Layout>
  );
}

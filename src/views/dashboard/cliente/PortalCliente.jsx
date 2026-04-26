import { useMemo, useState } from "react";
import Layout from "../../../components/Layout";
import {
  useObtenerFeedbackPortalClienteQuery,
  useObtenerHistorialPortalClienteQuery,
  useObtenerResumenPortalClienteQuery,
  useObtenerRiesgosPortalClienteQuery,
  useLazyObtenerFeedbackPortalClienteQuery,
  useLazyObtenerHistorialPortalClienteQuery,
  useLazyObtenerResumenPortalClienteQuery,
  useLazyObtenerRiesgosPortalClienteQuery,
} from "../../../redux/api/portalClienteApi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Camera,
  CalendarClock,
  CheckCircle2,
  Download,
  ImageOff,
  ImageIcon,
  Info,
  MapPin,
  ScanSearch,
  ShieldCheck,
  Star,
} from "lucide-react";

const PERIODOS = [
  { value: "hoy", label: "Hoy" },
  { value: "7dias", label: "7 días" },
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

function formatearFecha(valorFecha) {
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
}

function formatearHoras(valor) {
  const numero = Number(valor ?? 0);
  if (!Number.isFinite(numero)) return "0.0 h";
  return `${numero.toFixed(1)} h`;
}

function formatDuracion(segundos) {
  if (!Number.isFinite(Number(segundos))) return "-";
  const total = Number(segundos);
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const seg = total % 60;
  if (horas > 0) return `${horas}h ${minutos}m`;
  if (minutos > 0) return `${minutos}m ${seg}s`;
  return `${seg}s`;
}

function formatCoordenadas(latitud, longitud) {
  if (!latitud || !longitud) return "-";
  return `${Number(latitud).toFixed(6)}, ${Number(longitud).toFixed(6)}`;
}

function staticMapUrl(actividad) {
  const token = import.meta.env.VITE_LOCATIONIQ_PUBLIC_TOKEN;
  if (!token) return null;

  const inicioLat = Number(actividad.latitud_inicio);
  const inicioLng = Number(actividad.longitud_inicio);
  const cierreLat = Number(actividad.latitud_fin);
  const cierreLng = Number(actividad.longitud_fin);
  const tieneInicio = Number.isFinite(inicioLat) && Number.isFinite(inicioLng);
  const tieneCierre = Number.isFinite(cierreLat) && Number.isFinite(cierreLng);
  if (!tieneInicio && !tieneCierre) return null;

  const centerLat = tieneInicio && tieneCierre ? (inicioLat + cierreLat) / 2 : (tieneInicio ? inicioLat : cierreLat);
  const centerLng = tieneInicio && tieneCierre ? (inicioLng + cierreLng) / 2 : (tieneInicio ? inicioLng : cierreLng);
  const params = new URLSearchParams({
    key: token,
    center: `${centerLat},${centerLng}`,
    zoom: tieneInicio && tieneCierre ? "15" : "16",
    size: "600x320",
    format: "jpg",
    maptype: "streets",
  });

  if (tieneInicio) {
    params.append("markers", `icon:large-green-cutout|${inicioLat},${inicioLng}`);
  }
  if (tieneCierre) {
    params.append("markers", `icon:large-red-cutout|${cierreLat},${cierreLng}`);
  }
  if (tieneInicio && tieneCierre) {
    params.append("path", `color:blue|weight:4|${inicioLat},${inicioLng}|${cierreLat},${cierreLng}`);
  }

  return `https://maps.locationiq.com/v3/staticmap?${params.toString()}`;
}

function normalizarEstado(estado) {
  return (estado || "").trim().toLowerCase();
}

function obtenerEstiloEstado(estado) {
  switch (normalizarEstado(estado)) {
    case "verificada":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "verificada_con_baja_precision":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "requiere_revision":
      return "bg-red-100 text-red-800 border-red-200";
    case "iniciada":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function formatearEstadoVerificacion(estado) {
  switch (normalizarEstado(estado)) {
    case "verificada":
      return "Verificada";
    case "verificada_con_baja_precision":
      return "Baja precisión";
    case "requiere_revision":
      return "Requiere revisión";
    case "iniciada":
      return "Iniciada";
    default:
      return estado || "-";
  }
}

function obtenerNombreActividad(actividad) {
  const actividades = actividad?.lista?.actividades ?? [];
  if (actividades.length > 0) {
    return actividades.map((item) => item.nombre).filter(Boolean).join(", ");
  }
  return actividad?.lista?.nombre || "Actividad registrada";
}

function TarjetaResumen({ titulo, valor, detalle, icono, principal = false }) {
  if (principal) {
    return (
      <div className="bg-[#0A2A47] text-white rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <span className="text-sm opacity-80">{titulo}</span>
        <div className="flex items-center justify-between mt-2">
          <span className="text-3xl font-bold">{valor}</span>
          <div className="text-[#3BAE3D]">{icono}</div>
        </div>
        <p className="text-xs text-white/75 mt-3">{detalle}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e6f0f8] rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{titulo}</p>
          <p className="text-3xl font-bold text-[#0A2A47] mt-2">{valor}</p>
        </div>
        <div className="text-[#0A2A47]">{icono}</div>
      </div>
      <p className="text-xs text-gray-500 mt-3">{detalle}</p>
    </div>
  );
}

function EmptyState({ mensaje }) {
  return (
    <div className="rounded-lg border border-dashed border-[#d8e7f2] bg-[#f8fbfe] px-4 py-6 text-sm text-[#5d7183] text-center">
      {mensaje}
    </div>
  );
}

function Seccion({ titulo, subtitulo, children }) {
  return (
    <section className="bg-white border border-[#e6f0f8] rounded-xl p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[#0A2A47]">{titulo}</h2>
        {subtitulo && <p className="text-sm text-gray-500 mt-1">{subtitulo}</p>}
      </div>
      {children}
    </section>
  );
}

function DetalleVerificacion({ label, value }) {
  return (
    <div className="border border-[#e6f0f8] bg-white rounded-md p-2 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-[#0A2A47] break-words">{value || "-"}</p>
    </div>
  );
}

function DetallePrecision({ label, value }) {
  const tooltip = "Precisión GPS aproximada: 8 m = ubicación bastante buena; 25 m = razonable; 120 m = ubicación floja; 500 m = muy poco confiable.";

  return (
    <div className="border border-[#e6f0f8] bg-white rounded-md p-2 shadow-sm">
      <div className="flex items-center gap-1">
        <p className="text-xs text-gray-500">{label}</p>
        <span
          title={tooltip}
          className="inline-flex cursor-help text-[#0A2A47]"
        >
          <Info size={13} />
        </span>
      </div>
      <p className="text-sm font-semibold text-[#0A2A47] break-words">{value || "-"}</p>
    </div>
  );
}

export default function PortalCliente() {
  const [periodo, setPeriodo] = useState("hoy");
  const [actividadFicha, setActividadFicha] = useState(null);
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [modalReporteAbierto, setModalReporteAbierto] = useState(false);
  const [generandoReporte, setGenerandoReporte] = useState(false);
  const [reporteConfig, setReporteConfig] = useState({
    desde: "",
    hasta: "",
  });

  const rango = useMemo(() => {
    const { desde, hasta } = obtenerRangoPeriodo(periodo);
    return {
      desde,
      hasta,
      params: {
        desde: formatearFechaApi(desde),
        hasta: formatearFechaApi(hasta),
      },
    };
  }, [periodo]);

  const { data: resumen, isLoading: cargandoResumen, isFetching: actualizandoResumen } =
    useObtenerResumenPortalClienteQuery(rango.params);
  const { data: observaciones, isLoading: cargandoObservaciones } =
    useObtenerRiesgosPortalClienteQuery(rango.params);
  const { data: historial = [], isLoading: cargandoHistorial } =
    useObtenerHistorialPortalClienteQuery(rango.params);
  const { data: feedback = [], isLoading: cargandoFeedback } =
    useObtenerFeedbackPortalClienteQuery(rango.params);
  const [obtenerResumenReporte] = useLazyObtenerResumenPortalClienteQuery();
  const [obtenerRiesgosReporte] = useLazyObtenerRiesgosPortalClienteQuery();
  const [obtenerHistorialReporte] = useLazyObtenerHistorialPortalClienteQuery();
  const [obtenerFeedbackReporte] = useLazyObtenerFeedbackPortalClienteQuery();

  const cargandoTarjetas = cargandoResumen || actualizandoResumen;
  const totalActividades = resumen?.actividades_hoy ?? 0;
  const actividadesRealizadas = resumen?.actividades_completadas_hoy ?? 0;
  const seguimientosAbiertos = resumen?.seguimientos_abiertos ?? 0;
  const seguimientosResueltos = resumen?.seguimientos_resueltos ?? 0;
  const tiempoRespuestaHoras = resumen?.tiempo_promedio_respuesta_horas ?? 0;

  const areasConSeguimientoCliente = observaciones?.areas_con_seguimiento ?? [];
  const seguimientosRecientes = observaciones?.seguimientos_recientes ?? [];

  const exportarReporteGeneralPDF = ({
    resumenReporte,
    historialReporte,
    feedbackReporte,
    observacionesReporte,
    desdeReporte,
    hastaReporte,
  }) => {
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const fechaArchivo = new Date().toISOString().slice(0, 10);
    let cursorY = 16;
    const totalActividadesReporte = resumenReporte?.actividades_hoy ?? 0;
    const actividadesRealizadasReporte = resumenReporte?.actividades_completadas_hoy ?? 0;
    const cumplimientoReporte = totalActividadesReporte > 0
      ? Math.round((actividadesRealizadasReporte / totalActividadesReporte) * 100)
      : 0;
    const evidenciasRegistradasReporte = Math.max(
      actividadesRealizadasReporte - (resumenReporte?.evidencias_faltantes ?? 0),
      0
    );
    const feedbackEnRevisionReporte = resumenReporte?.feedbacks_negativos ?? 0;
    const areasConSeguimientoReporte = observacionesReporte?.locaciones_con_problemas ?? [];
    const observacionesRecientesReporte = observacionesReporte?.comentarios_recientes ?? [];
    const feedbackRevisionReporte = observacionesReporte?.feedback_negativo_reciente ?? [];

    const agregarTextoSeccion = (titulo, lineas) => {
      doc.setFontSize(11);
      doc.setTextColor(10, 42, 71);
      doc.text(titulo, 14, cursorY);
      cursorY += 4;

      if (!lineas.length) {
        doc.setFontSize(9);
        doc.setTextColor(90, 90, 90);
        doc.text("Sin registros para este período", 14, cursorY);
        cursorY += 6;
        return;
      }

      autoTable(doc, {
        startY: cursorY,
        theme: "plain",
        styles: { fontSize: 9, textColor: [70, 70, 70], cellPadding: 1.5 },
        margin: { left: 14, right: 14 },
        body: lineas.map((linea) => [linea]),
      });
      cursorY = doc.lastAutoTable.finalY + 4;
    };

    doc.setFontSize(18);
    doc.setTextColor(10, 42, 71);
    doc.text("Reporte de cumplimiento del servicio", pageWidth / 2, cursorY, { align: "center" });
    cursorY += 8;

    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text(
      `Período: ${formatearFecha(desdeReporte)} - ${formatearFecha(hastaReporte)}`,
      pageWidth / 2,
      cursorY,
      { align: "center" }
    );
    cursorY += 8;

    autoTable(doc, {
      startY: cursorY,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2.5, textColor: [10, 42, 71] },
      headStyles: { fillColor: [10, 42, 71], textColor: 255 },
      margin: { left: 14, right: 14 },
      head: [["Resumen ejecutivo", "Valor"]],
      body: [
        ["Actividades realizadas", String(actividadesRealizadasReporte)],
        ["Cumplimiento", `${cumplimientoReporte}%`],
        ["Evidencias registradas", String(evidenciasRegistradasReporte)],
        ["Feedback en revisión", String(feedbackEnRevisionReporte)],
      ],
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 90 },
        1: { cellWidth: 40 },
      },
    });

    cursorY = doc.lastAutoTable.finalY + 8;

    doc.setFontSize(11);
    doc.setTextColor(10, 42, 71);
    doc.text("Actividades", 14, cursorY);
    cursorY += 4;

    if (historialReporte.length === 0) {
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);
      doc.text("Sin registros para este período", 14, cursorY);
      cursorY += 8;
    } else {
      autoTable(doc, {
        startY: cursorY,
        theme: "grid",
        styles: { fontSize: 8.5, cellPadding: 2, textColor: [10, 42, 71], valign: "top" },
        headStyles: { fillColor: [10, 42, 71], textColor: 255 },
        margin: { left: 14, right: 14 },
        head: [[
          "Fecha",
          "Locación",
          "Área",
          "Actividad / lista",
          "Estado",
          "Comentario",
        ]],
        body: historialReporte.map((item) => [
          formatearFecha(item.hora_fin || item.hora_inicio),
          item.usuario?.area?.locacion?.nombre || "-",
          item.usuario?.area?.nombre || "-",
          obtenerNombreActividad(item),
          formatearEstadoVerificacion(item.estado_verificacion),
          item.comentario?.trim() || "-",
        ]),
      });
      cursorY = doc.lastAutoTable.finalY + 8;
    }

    doc.setFontSize(11);
    doc.setTextColor(10, 42, 71);
    doc.text("Feedback", 14, cursorY);
    cursorY += 4;

    if (feedbackReporte.length === 0) {
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);
      doc.text("Sin registros para este período", 14, cursorY);
      cursorY += 8;
    } else {
      autoTable(doc, {
        startY: cursorY,
        theme: "grid",
        styles: { fontSize: 8.5, cellPadding: 2, textColor: [10, 42, 71], valign: "top" },
        headStyles: { fillColor: [10, 42, 71], textColor: 255 },
        margin: { left: 14, right: 14 },
        head: [[
          "Fecha",
          "Empresa",
          "Lugar evaluado",
          "Calificación",
          "Comentario",
        ]],
        body: feedbackReporte.map((item) => [
          formatearFecha(item.creado_en),
          item.empresa || "-",
          item.contexto || item.direccion || "-",
          Number(item.calificacion).toFixed(1),
          item.comentario?.trim() || "-",
        ]),
      });
      cursorY = doc.lastAutoTable.finalY + 8;
    }

    agregarTextoSeccion(
      "Observaciones del servicio · Áreas con seguimiento",
      areasConSeguimientoReporte.map((item) =>
        `${item.locacion_nombre} · ${item.empresa_nombre || "Servicio asignado"} · Seguimientos: ${item.total_problemas} · Evidencias faltantes: ${item.evidencias_faltantes}`
      )
    );

    agregarTextoSeccion(
      "Observaciones del servicio · Observaciones recientes",
      observacionesRecientesReporte.map((item) =>
        `${item.locacion_nombre || "Locación no disponible"} · ${formatearFecha(item.hora_fin || item.hora_inicio)} · ${item.comentario}`
      )
    );

    agregarTextoSeccion(
      "Observaciones del servicio · Feedback en revisión",
      feedbackRevisionReporte.map((item) =>
        `${item.empresa || "Empresa asignada"} · Lugar evaluado: ${item.contexto || item.direccion || "-"} · Calificación: ${Number(item.calificacion).toFixed(1)} · ${item.comentario?.trim() || "Sin comentario adicional"}`
      )
    );

    doc.save(`reporte-cumplimiento-servicio-${fechaArchivo}.pdf`);
  };

  const abrirModalReporte = () => {
    setReporteConfig({
      desde: rango.desde.toISOString().slice(0, 10),
      hasta: rango.hasta.toISOString().slice(0, 10),
    });
    setModalReporteAbierto(true);
  };

  const generarReporteConRango = async () => {
    if (!reporteConfig.desde || !reporteConfig.hasta) return;
    if (reporteConfig.desde > reporteConfig.hasta) return;

    const desdeReporte = `${reporteConfig.desde}T00:00:00`;
    const hastaReporte = `${reporteConfig.hasta}T23:59:59`;
    const paramsReporte = {
      desde: desdeReporte,
      hasta: hastaReporte,
    };

    setGenerandoReporte(true);

    try {
      const [
        resumenReporte,
        observacionesReporte,
        historialReporte,
        feedbackReporte,
      ] = await Promise.all([
        obtenerResumenReporte(paramsReporte).unwrap(),
        obtenerRiesgosReporte(paramsReporte).unwrap(),
        obtenerHistorialReporte(paramsReporte).unwrap(),
        obtenerFeedbackReporte(paramsReporte).unwrap(),
      ]);

      exportarReporteGeneralPDF({
        resumenReporte,
        historialReporte,
        feedbackReporte,
        observacionesReporte,
        desdeReporte,
        hastaReporte,
      });
      setModalReporteAbierto(false);
    } catch (error) {
      console.error("No se pudo generar el reporte del cliente", error);
    } finally {
      setGenerandoReporte(false);
    }
  };

  const exportarFichaPDF = async (actividad) => {
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let cursorY = 16;

    const urlToDataURL = async (url) => {
      try {
        const res = await fetch(url, { mode: "cors" });
        const blob = await res.blob();
        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch {
        return null;
      }
    };

    const addImageSafe = (imgData, x, y, width, height = 0) => {
      if (!imgData) return false;
      try {
        const format = imgData.startsWith("data:image/png") ? "PNG" : "JPEG";
        doc.addImage(imgData, format, x, y, width, height);
        return true;
      } catch {
        return false;
      }
    };

    doc.setFontSize(18);
    doc.setTextColor(10, 42, 71);
    doc.text("Ficha de cumplimiento verificado", pageWidth / 2, cursorY, { align: "center" });
    cursorY += 8;

    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text(`Fecha de generación: ${formatearFecha(new Date().toISOString())}`, pageWidth / 2, cursorY, { align: "center" });
    cursorY += 8;

    autoTable(doc, {
      startY: cursorY,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2.5, textColor: [10, 42, 71] },
      headStyles: { fillColor: [10, 42, 71], textColor: 255 },
      margin: { left: 14, right: 14 },
      body: [
        ["Estado de verificación", formatearEstadoVerificacion(actividad.estado_verificacion)],
        ["Fecha inicio", formatearFecha(actividad.hora_inicio)],
        ["Fecha fin", formatearFecha(actividad.hora_fin)],
        ["Duración", formatDuracion(actividad.duracion_segundos)],
        ["Locación", actividad.usuario?.area?.locacion?.nombre || "-"],
        ["Área", actividad.usuario?.area?.nombre || "-"],
        ["Lista / actividad", obtenerNombreActividad(actividad)],
        ["Comentario", actividad.comentario || "-"],
        ["GPS inicio", formatCoordenadas(actividad.latitud_inicio, actividad.longitud_inicio)],
        ["GPS cierre", formatCoordenadas(actividad.latitud_fin, actividad.longitud_fin)],
        ["Precisión inicio", actividad.precision_inicio ? `${Number(actividad.precision_inicio).toFixed(1)} m` : "-"],
        ["Precisión cierre", actividad.precision_fin ? `${Number(actividad.precision_fin).toFixed(1)} m` : "-"],
      ],
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 48 },
        1: { cellWidth: pageWidth - 76 },
      },
    });

    cursorY = doc.lastAutoTable.finalY + 8;

    const mapaEstaticoUrl = staticMapUrl(actividad);
    if (mapaEstaticoUrl) {
      const mapaData = await urlToDataURL(mapaEstaticoUrl);
      if (mapaData) {
        if (cursorY + 86 > pageHeight - 14) {
          doc.addPage();
          cursorY = 16;
        }
        doc.setFontSize(11);
        doc.setTextColor(10, 42, 71);
        doc.text("Snapshot / mapa", 14, cursorY);
        cursorY += 4;
        if (addImageSafe(mapaData, 14, cursorY, pageWidth - 28, 78)) {
          cursorY += 84;
        }
      }
    }

    if (actividad.imagen) {
      const evidenciaData = await urlToDataURL(actividad.imagen);
      if (evidenciaData) {
        if (cursorY + 90 > pageHeight - 14) {
          doc.addPage();
          cursorY = 16;
        }
        doc.setFontSize(11);
        doc.setTextColor(10, 42, 71);
        doc.text("Evidencia visual", 14, cursorY);
        cursorY += 4;
        addImageSafe(evidenciaData, 14, cursorY, pageWidth - 28, 0);
      }
    }

    doc.save(`Ficha-cumplimiento-${actividad.id}.pdf`);
  };

  return (
    <Layout>
      <div className="p-4 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0A2A47]">Portal de servicio</h1>
            <p className="text-sm text-gray-500 mt-1">
              Seguimiento en tiempo real del servicio contratado
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-wrap gap-2">
              {PERIODOS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setPeriodo(item.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold border transition ${
                    periodo === item.value
                      ? "bg-[#0A2A47] text-white border-[#0A2A47]"
                      : "bg-white text-[#0A2A47] border-[#e6f0f8] hover:bg-[#e6f0f8]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={abrirModalReporte}
              className="bg-[#0A2A47] text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-[#123b63] flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Descargar reporte
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <TarjetaResumen
            titulo="Actividades realizadas"
            valor={cargandoTarjetas ? "..." : actividadesRealizadas}
            detalle="Servicios marcados como completados en el período seleccionado."
            icono={<CheckCircle2 size={22} />}
            principal
          />
          <TarjetaResumen
            titulo="Seguimientos abiertos"
            valor={cargandoTarjetas ? "..." : seguimientosAbiertos}
            detalle="Casos del servicio que siguen pendientes de atención."
            icono={<ShieldCheck size={22} />}
          />
          <TarjetaResumen
            titulo="Seguimientos resueltos"
            valor={cargandoTarjetas ? "..." : seguimientosResueltos}
            detalle="Casos del servicio que ya fueron atendidos."
            icono={<Camera size={22} />}
          />
          <TarjetaResumen
            titulo="Tiempo de respuesta"
            valor={cargandoTarjetas ? "..." : formatearHoras(tiempoRespuestaHoras)}
            detalle="Promedio de tiempo para resolver seguimientos visibles."
            icono={<CalendarClock size={22} />}
          />
        </div>

        <Seccion
          titulo="Evidencia del servicio"
          subtitulo="Registro de actividades, comentarios y respaldo visual del servicio prestado."
        >
          {cargandoHistorial ? (
            <EmptyState mensaje="Cargando evidencia del servicio..." />
          ) : historial.length === 0 ? (
            <EmptyState mensaje="Aún no hay evidencia registrada para este período." />
          ) : (
            <div className="overflow-auto rounded-xl border border-[#e6f0f8]">
              <table className="w-full text-left text-[#0A2A47]">
                <thead className="bg-white border-b border-[#e6f0f8] sticky top-0 z-10">
                  <tr className="text-sm">
                    <th className="px-3 py-3">Fecha</th>
                    <th className="px-3 py-3">Locación</th>
                    <th className="px-3 py-3">Actividad</th>
                    <th className="px-3 py-3">Imagen</th>
                    <th className="px-3 py-3">Comentario</th>
                    <th className="px-3 py-3">Ficha</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {historial.map((item) => (
                    <tr key={item.id} className="border-b border-[#e6f0f8] hover:bg-[#e6f0f8] transition-colors align-top">
                      <td className="px-3 py-3 whitespace-nowrap">
                        {formatearFecha(item.hora_fin || item.hora_inicio)}
                      </td>
                      <td className="px-3 py-3">
                        {item.usuario?.area?.locacion?.nombre || "-"}
                      </td>
                      <td className="px-3 py-3 min-w-[240px]">
                        {obtenerNombreActividad(item)}
                      </td>
                      <td className="px-3 py-3">
                        {item.imagen ? (
                          <a href={item.imagen} target="_blank" rel="noreferrer">
                            <img
                              src={item.imagen}
                              alt="Evidencia del servicio"
                              className="h-16 w-16 object-cover rounded-md border border-[#e6f0f8] shadow-sm hover:opacity-85"
                            />
                          </a>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <ImageOff size={14} />
                            <span>Sin evidencia visual</span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 min-w-[240px]">
                        {item.comentario?.trim() || "Sin comentario"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setActividadFicha(item)}
                          className="inline-flex items-center gap-1 rounded-md bg-[#0A2A47] px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#123b63]"
                        >
                          <ScanSearch size={14} />
                          Ver ficha
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Seccion>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Seccion
            titulo="Áreas con seguimiento"
            subtitulo="Áreas y locaciones donde el servicio requirió atención adicional."
          >
            {cargandoObservaciones ? (
              <EmptyState mensaje="Cargando seguimiento del servicio..." />
            ) : areasConSeguimientoCliente.length === 0 ? (
              <EmptyState mensaje="No hay áreas con seguimiento para este período." />
            ) : (
              <div className="flex flex-col gap-3">
                {areasConSeguimientoCliente.map((item, index) => (
                  <div key={`${item.area_id || item.locacion_id || item.locacion_nombre}-${index}`} className="rounded-lg border border-[#e6f0f8] p-3 bg-[#f8fbfe]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#0A2A47]">
                          {item.area_nombre || item.locacion_nombre || "Ubicación no disponible"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.locacion_nombre && item.area_nombre ? item.locacion_nombre : "Servicio asignado"}
                        </p>
                      </div>
                      <MapPin size={16} className="text-[#0A2A47]" />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 rounded-full bg-white border border-[#d7e5f0] text-[#0A2A47]">
                        Seguimientos: {item.total_seguimientos}
                      </span>
                      <span className="px-2 py-1 rounded-full bg-white border border-[#d7e5f0] text-[#0A2A47]">
                        Abiertos: {item.seguimientos_abiertos}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Seccion>

          <Seccion
            titulo="Seguimientos recientes"
            subtitulo="Casos visibles del servicio con su estado y respuesta registrada."
          >
            {cargandoObservaciones ? (
              <EmptyState mensaje="Cargando seguimientos..." />
            ) : seguimientosRecientes.length === 0 ? (
              <EmptyState mensaje="No hay seguimientos recientes para este período." />
            ) : (
              <div className="flex flex-col gap-3">
                {seguimientosRecientes.map((item) => (
                  <div key={item.id} className="rounded-lg border border-[#e6f0f8] p-3 bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#0A2A47]">
                          {item.locacion_nombre || "Locación no disponible"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.area_nombre || "Área no disponible"}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#f8fbfe] px-2 py-1 text-xs font-semibold text-[#0A2A47]">
                        {item.estado}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 rounded-full bg-[#f8fbfe] border border-[#d7e5f0] text-[#0A2A47]">
                        {item.tipo_publico}
                      </span>
                      <span className="px-2 py-1 rounded-full bg-[#f8fbfe] border border-[#d7e5f0] text-[#0A2A47]">
                        Abierto: {formatearFecha(item.creado_en)}
                      </span>
                      {item.resuelto_en ? (
                        <span className="px-2 py-1 rounded-full bg-[#f8fbfe] border border-[#d7e5f0] text-[#0A2A47]">
                          Resuelto: {formatearFecha(item.resuelto_en)}
                        </span>
                      ) : null}
                      <span className="px-2 py-1 rounded-full bg-[#f8fbfe] border border-[#d7e5f0] text-[#0A2A47]">
                        Tiempo de respuesta: {item.tiempo_respuesta_horas != null ? formatearHoras(item.tiempo_respuesta_horas) : "Pendiente"}
                      </span>
                    </div>
                    {(item.evidencia_resolucion || item.foto_resolucion) ? (
                      <div className="mt-3 space-y-2">
                        {item.evidencia_resolucion ? (
                          <p className="text-sm text-[#0A2A47]">
                            {item.evidencia_resolucion}
                          </p>
                        ) : null}
                        {item.foto_resolucion ? (
                          <a href={item.foto_resolucion} target="_blank" rel="noreferrer" className="inline-flex">
                            <img
                              src={item.foto_resolucion}
                              alt="Evidencia de resolución"
                              className="h-16 w-16 object-cover rounded-md border border-[#e6f0f8] shadow-sm hover:opacity-85"
                            />
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Seccion>
        </div>

        <Seccion
          titulo="Feedback"
          subtitulo="Historial de valoraciones asociadas al servicio durante el período seleccionado."
        >
          {cargandoFeedback ? (
            <EmptyState mensaje="Cargando feedback..." />
          ) : feedback.length === 0 ? (
            <EmptyState mensaje="No hay feedback disponible para este período." />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {feedback.map((item) => (
                <div key={item.id} className="rounded-lg border border-[#e6f0f8] p-4 bg-white shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#0A2A47]">
                          {item.empresa}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Lugar evaluado: {item.contexto || item.direccion || "-"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.nombre?.trim() || "Anónimo"} · {formatearFecha(item.creado_en)}
                        </p>
                    </div>
                    <div className="flex items-center gap-1 text-[#3BAE3D] font-semibold">
                      <Star size={15} />
                      <span>{Number(item.calificacion).toFixed(1)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#0A2A47] mt-3">
                    {item.comentario?.trim() || "Sin comentario adicional"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Seccion>

        {modalReporteAbierto && (
          <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => {
              if (!generandoReporte) setModalReporteAbierto(false);
            }}
          >
            <div
              className="bg-white rounded-xl border border-[#0A2A47] shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-[#e6f0f8] p-4">
                <h2 className="text-xl font-bold text-[#0A2A47]">Generar reporte</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Selecciona la fecha de inicio y fin para generar el PDF del servicio.
                </p>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#0A2A47] mb-2">
                    Fecha de inicio
                  </label>
                  <input
                    type="date"
                    value={reporteConfig.desde}
                    onChange={(e) =>
                      setReporteConfig((prev) => ({ ...prev, desde: e.target.value }))
                    }
                    className="w-full rounded-lg border border-[#d7e5f0] px-3 py-2 text-sm text-[#0A2A47] focus:border-[#0A2A47] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#0A2A47] mb-2">
                    Fecha de fin
                  </label>
                  <input
                    type="date"
                    value={reporteConfig.hasta}
                    onChange={(e) =>
                      setReporteConfig((prev) => ({ ...prev, hasta: e.target.value }))
                    }
                    className="w-full rounded-lg border border-[#d7e5f0] px-3 py-2 text-sm text-[#0A2A47] focus:border-[#0A2A47] focus:outline-none"
                  />
                </div>

                {reporteConfig.desde && reporteConfig.hasta && reporteConfig.desde > reporteConfig.hasta ? (
                  <p className="text-sm text-red-600">
                    La fecha de inicio no puede ser mayor que la fecha de fin.
                  </p>
                ) : null}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={generarReporteConRango}
                    disabled={
                      generandoReporte ||
                      !reporteConfig.desde ||
                      !reporteConfig.hasta ||
                      reporteConfig.desde > reporteConfig.hasta
                    }
                    className="flex-1 rounded bg-[#0A2A47] py-2 text-white font-semibold shadow-sm hover:bg-[#123b63] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {generandoReporte ? "Generando..." : "Generar PDF"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalReporteAbierto(false)}
                    disabled={generandoReporte}
                    className="flex-1 rounded border border-[#0A2A47] py-2 text-[#0A2A47] font-semibold hover:bg-[#e6f0f8] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {imagenSeleccionada && (
          <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
            onClick={() => setImagenSeleccionada(null)}
          >
            <img
              src={imagenSeleccionada}
              alt="Vista ampliada"
              className="max-h-[90%] max-w-[90%] object-contain rounded-xl border border-[#0A2A47] bg-white p-2 shadow-xl"
            />
          </div>
        )}

        {actividadFicha && (
          <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setActividadFicha(null)}
          >
            <div
              className="bg-white rounded-xl border border-[#0A2A47] shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-[#e6f0f8] p-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#0A2A47]">Ficha de cumplimiento verificado</h2>
                  <p className="text-sm text-gray-500">{actividadFicha.lista?.nombre || "Sin lista"}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${obtenerEstiloEstado(actividadFicha.estado_verificacion)}`}
                >
                  <ScanSearch size={12} />
                  {formatearEstadoVerificacion(actividadFicha.estado_verificacion)}
                </span>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <DetalleVerificacion label="Locación" value={actividadFicha.usuario?.area?.locacion?.nombre} />
                  <DetalleVerificacion label="Área" value={actividadFicha.usuario?.area?.nombre} />
                  <DetalleVerificacion label="Lista / actividad" value={obtenerNombreActividad(actividadFicha)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <DetalleVerificacion label="Estado de verificación" value={formatearEstadoVerificacion(actividadFicha.estado_verificacion)} />
                  <DetalleVerificacion label="Fecha inicio" value={formatearFecha(actividadFicha.hora_inicio)} />
                  <DetalleVerificacion label="Fecha fin" value={formatearFecha(actividadFicha.hora_fin)} />
                  <DetalleVerificacion label="Duración" value={formatDuracion(actividadFicha.duracion_segundos)} />
                  <DetalleVerificacion label="GPS inicio" value={formatCoordenadas(actividadFicha.latitud_inicio, actividadFicha.longitud_inicio)} />
                  <DetalleVerificacion label="GPS cierre" value={formatCoordenadas(actividadFicha.latitud_fin, actividadFicha.longitud_fin)} />
                  <DetallePrecision
                    label="Precisión inicio"
                    value={actividadFicha.precision_inicio ? `${Number(actividadFicha.precision_inicio).toFixed(1)} m` : "-"}
                  />
                  <DetallePrecision
                    label="Precisión cierre"
                    value={actividadFicha.precision_fin ? `${Number(actividadFicha.precision_fin).toFixed(1)} m` : "-"}
                  />
                </div>

                <div className="border border-[#e6f0f8] rounded-md p-3 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Comentario</p>
                  <p className="text-sm text-[#0A2A47] whitespace-pre-wrap">{actividadFicha.comentario || "-"}</p>
                </div>

                {staticMapUrl(actividadFicha) ? (
                  <div className="border border-[#e6f0f8] rounded-md p-3 shadow-sm">
                    <p className="text-xs text-gray-500 mb-2">Snapshot / mapa</p>
                    <img
                      src={staticMapUrl(actividadFicha)}
                      alt="Mapa de verificación"
                      className="max-h-72 w-full object-contain rounded-md border border-[#e6f0f8] shadow-sm"
                    />
                  </div>
                ) : null}

                <div className="border border-[#e6f0f8] rounded-md p-3 shadow-sm">
                  <p className="text-xs text-gray-500 mb-2">Evidencia visual</p>
                  {actividadFicha.imagen ? (
                    <button
                      type="button"
                      onClick={() => setImagenSeleccionada(actividadFicha.imagen)}
                      className="w-full text-left"
                    >
                      <img
                        src={actividadFicha.imagen}
                        alt="Evidencia"
                        className="max-h-72 w-full object-contain rounded-md border border-[#e6f0f8] shadow-sm hover:opacity-90"
                      />
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#0A2A47]">
                        <ImageIcon size={13} />
                        Ampliar evidencia
                      </span>
                    </button>
                  ) : (
                    <p className="text-sm text-[#0A2A47]">Sin imagen</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => exportarFichaPDF(actividadFicha)}
                  className="w-full rounded bg-[#0A2A47] py-2 text-white font-semibold shadow-sm hover:bg-[#123b63]"
                >
                  Descargar ficha PDF
                </button>

                <button
                  type="button"
                  onClick={() => setActividadFicha(null)}
                  className="w-full rounded border border-[#0A2A47] py-2 text-[#0A2A47] font-semibold hover:bg-[#e6f0f8]"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

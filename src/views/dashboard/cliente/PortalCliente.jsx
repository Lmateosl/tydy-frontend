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
import { useObtenerMiCompaniaQuery } from "../../../redux/api/userApi";
import tydyLogoSidebar from "../../../assets/imgs/Logo_fondo_azul.png";
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
import {
  formatBackendDateTime,
  formatBusinessDateInput,
  getBusinessPeriodRange,
  parseBusinessDateInput,
} from "../../../utils/dateTime";

const PERIODOS = [
  { value: "hoy", label: "Hoy" },
  { value: "7dias", label: "7 días" },
  { value: "1mes", label: "1 mes" },
  { value: "6meses", label: "6 meses" },
  { value: "1anio", label: "1 año" },
];

function formatearFecha(valorFecha) {
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
}

function formatearHoras(valor) {
  const numero = Number(valor ?? 0);
  if (!Number.isFinite(numero)) return "0.0 h";
  return `${numero.toFixed(1)} h`;
}

async function cargarDataUrl(url) {
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
}

function agregarFooterByTydy(doc, pageWidth, pageHeight, logoData) {
  const chipWidth = 18;
  const chipHeight = 8;
  const gap = 2;
  let logoWidth = 0;
  let logoHeight = 0;

  if (logoData) {
    try {
      const props = doc.getImageProperties(logoData);
      logoWidth = 12;
      logoHeight = logoWidth * (props.height / props.width);
    } catch {
      logoWidth = 11;
      logoHeight = 4;
    }
  }

  doc.setFont(undefined, "bold");
  doc.setFontSize(8);
  const poweredText = "Powered by";
  const textWidth = doc.getTextWidth(poweredText);
  const totalWidth = textWidth + gap + chipWidth;
  const x = (pageWidth - totalWidth) / 2;
  const y = pageHeight - 9;

  doc.setTextColor(10, 42, 71);
  doc.text(poweredText, x, y + 5.5);

  const chipX = x + textWidth + gap;
  doc.setFillColor(10, 42, 71);
  doc.roundedRect(chipX, y, chipWidth, chipHeight, 4, 4, "F");

  if (logoData) {
    try {
      const format = logoData.startsWith("data:image/png") ? "PNG" : "JPEG";
      doc.addImage(
        logoData,
        format,
        chipX + (chipWidth - logoWidth) / 2,
        y + (chipHeight - logoHeight) / 2,
        logoWidth,
        logoHeight
      );
    } catch {
      doc.setTextColor(255, 255, 255);
      doc.text("TYDY", chipX + 3.5, y + 5.3);
    }
  } else {
    doc.setTextColor(255, 255, 255);
    doc.text("TYDY", chipX + 3.5, y + 5.3);
  }
}

async function agregarFooterByTydyATodasLasPaginas(doc, pageWidth, pageHeight) {
  const logoData = await cargarDataUrl(tydyLogoSidebar);
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    agregarFooterByTydy(doc, pageWidth, pageHeight, logoData);
  }
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
      <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#071f35] p-4 text-white shadow-xl shadow-[#0A2A47]/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.2),_transparent_38%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.08),_transparent_45%)]" />
        <div className="relative flex h-full flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-sm text-white/75">{titulo}</span>
              <div className="mt-3 text-3xl font-bold">{valor}</div>
            </div>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-[#b7f7ba]">
              {icono}
            </div>
          </div>
          <p className="text-xs leading-relaxed text-white/75">{detalle}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-[#e6f0f8] bg-white/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[#6b7b88]">{titulo}</p>
          <p className="mt-2 text-3xl font-bold text-[#0A2A47]">{valor}</p>
        </div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#e6f0f8] bg-[#f4f8fb] text-[#0A2A47]">
          {icono}
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-[#7b8a97]">{detalle}</p>
    </div>
  );
}

function EmptyState({ mensaje }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#dbe8f2] bg-[#f8fbfd] px-5 py-10 text-center text-sm font-medium text-[#6b7b88]">
      {mensaje}
    </div>
  );
}

function Seccion({ titulo, subtitulo, children, scrollable = false, maxHeight = "max-h-[420px]" }) {
  return (
    <section className="flex flex-col overflow-hidden rounded-[28px] border border-[#e6f0f8] bg-white shadow-sm">
      <div className="border-b border-[#edf3f8] px-5 py-5 md:px-6">
        <h2 className="text-2xl font-bold tracking-tight text-[#0A2A47]">{titulo}</h2>
        {subtitulo && <p className="mt-1 text-sm text-[#5b6b79]">{subtitulo}</p>}
      </div>
      <div className={`p-5 md:p-6 ${scrollable ? `${maxHeight} min-h-0 overflow-y-auto` : ""}`}>
        {children}
      </div>
    </section>
  );
}

function DetalleVerificacion({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#e6f0f8] bg-[#fbfdff] p-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-[#0A2A47]">{value || "-"}</p>
    </div>
  );
}

function DetallePrecision({ label, value }) {
  const tooltip = "Precisión GPS aproximada: 8 m = ubicación bastante buena; 25 m = razonable; 120 m = ubicación floja; 500 m = muy poco confiable.";

  return (
    <div className="rounded-2xl border border-[#e6f0f8] bg-[#fbfdff] p-3 shadow-sm">
      <div className="flex items-center gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">{label}</p>
        <span title={tooltip} className="inline-flex cursor-help text-[#0A2A47]">
          <Info size={13} />
        </span>
      </div>
      <p className="mt-2 break-words text-sm font-semibold text-[#0A2A47]">{value || "-"}</p>
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
    const { desde, hasta } = getBusinessPeriodRange(periodo);
    return {
      desde,
      hasta,
      params: {
        desde: formatBackendDateTime(desde),
        hasta: formatBackendDateTime(hasta),
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
  const { data: compania } = useObtenerMiCompaniaQuery();
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

  const exportarReporteGeneralPDF = async ({
    resumenReporte,
    historialReporte,
    feedbackReporte,
    observacionesReporte,
    desdeReporte,
    hastaReporte,
  }) => {
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const fechaArchivo = formatBusinessDateInput(new Date());
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

    const urlToDataURL = cargarDataUrl;

    if (compania?.logo) {
      const imgData = await urlToDataURL(compania.logo);
      if (imgData) {
        const imgWidth = pageWidth * 0.3;
        const imgX = (pageWidth - imgWidth) / 2;
        doc.addImage(imgData, "PNG", imgX, cursorY, imgWidth, 0);
        cursorY += imgWidth * 0.35 + 6;
      }
    }

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

    await agregarFooterByTydyATodasLasPaginas(doc, pageWidth, doc.internal.pageSize.getHeight());
    doc.save(`reporte-cumplimiento-servicio-${fechaArchivo}.pdf`);
  };

  const abrirModalReporte = () => {
    setReporteConfig({
      desde: formatBusinessDateInput(rango.desde),
      hasta: formatBusinessDateInput(rango.hasta),
    });
    setModalReporteAbierto(true);
  };

  const generarReporteConRango = async () => {
    if (!reporteConfig.desde || !reporteConfig.hasta) return;
    if (reporteConfig.desde > reporteConfig.hasta) return;

    const rangoDesde = parseBusinessDateInput(reporteConfig.desde);
    const rangoHasta = parseBusinessDateInput(reporteConfig.hasta);
    if (!rangoDesde || !rangoHasta) return;

    const desdeReporte = formatBackendDateTime(rangoDesde.desde);
    const hastaReporte = formatBackendDateTime(rangoHasta.hasta);
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

    const urlToDataURL = cargarDataUrl;

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

    if (compania?.logo) {
      const imgData = await urlToDataURL(compania.logo);
      if (imgData) {
        const imgWidth = pageWidth * 0.32;
        if (addImageSafe(imgData, (pageWidth - imgWidth) / 2, cursorY, imgWidth, 0)) {
          cursorY += imgWidth * 0.35 + 6;
        }
      }
    }

    doc.setFontSize(18);
    doc.setTextColor(10, 42, 71);
    doc.text("Ficha de cumplimiento verificado", pageWidth / 2, cursorY, { align: "center" });
    cursorY += 8;

    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text(`Fecha de generación: ${formatearFecha(new Date())}`, pageWidth / 2, cursorY, { align: "center" });
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

    await agregarFooterByTydyATodasLasPaginas(doc, pageWidth, pageHeight);
    doc.save(`Ficha-cumplimiento-${actividad.id}.pdf`);
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6 px-4 py-5 md:px-6">
        <section className="relative overflow-hidden rounded-[28px] border border-[#e6f0f8] bg-white p-5 shadow-xl shadow-[#0A2A47]/5 md:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.16),_transparent_38%),radial-gradient(circle_at_bottom_left,_rgba(10,42,71,0.1),_transparent_42%)]" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#3BAE3D]">
                Portal cliente
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#0A2A47] md:text-4xl">
                Seguimiento verificado del servicio
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[#5b6b79]">
                Consulta ejecuciones, evidencia, seguimiento y feedback del servicio en una vista
                clara y auditable.
              </p>
            </div>

            <div className="flex flex-col gap-3 xl:min-w-[420px] xl:max-w-[520px] xl:items-end">
              <div className="flex flex-wrap gap-2">
                {PERIODOS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setPeriodo(item.value)}
                    className={`rounded-2xl border px-3.5 py-2 text-sm font-semibold transition ${
                      periodo === item.value
                        ? "border-[#071f35] bg-[#071f35] text-white shadow-lg shadow-[#071f35]/10"
                        : "border-[#dbe8f2] bg-white text-[#0A2A47] hover:border-[#0A2A47] hover:bg-[#f8fbfd]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={abrirModalReporte}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#071f35] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#071f35]/10 transition hover:-translate-y-0.5 hover:bg-[#0c2a47]"
              >
                <Download size={16} />
                Descargar reporte
              </button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            <div className="overflow-hidden rounded-[24px] border border-[#e6f0f8] bg-white shadow-sm">
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full min-w-[860px] text-left text-[#0A2A47]">
                  <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                    <tr>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Fecha</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Locación</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Actividad</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Imagen</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Comentario</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Ficha</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {historial.map((item) => (
                      <tr key={item.id} className="border-t border-[#edf3f8] align-top transition hover:bg-[#fbfdff]">
                        <td className="whitespace-nowrap px-4 py-3">
                          {formatearFecha(item.hora_fin || item.hora_inicio)}
                        </td>
                        <td className="px-4 py-3">
                          {item.usuario?.area?.locacion?.nombre || "-"}
                        </td>
                        <td className="min-w-[240px] px-4 py-3">
                          {obtenerNombreActividad(item)}
                        </td>
                        <td className="px-4 py-3">
                          {item.imagen ? (
                            <a href={item.imagen} target="_blank" rel="noreferrer">
                              <img
                                src={item.imagen}
                                alt="Evidencia del servicio"
                                className="h-16 w-16 rounded-2xl border border-[#e6f0f8] object-cover shadow-sm transition hover:opacity-85"
                              />
                            </a>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-[#7b8a97]">
                              <ImageOff size={14} />
                              <span>Sin evidencia visual</span>
                            </div>
                          )}
                        </td>
                        <td className="min-w-[240px] px-4 py-3">
                          {item.comentario?.trim() || "Sin comentario"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setActividadFicha(item)}
                            className="inline-flex items-center gap-2 rounded-xl border border-[#dbe8f2] bg-[#f8fbfd] px-3 py-2 text-xs font-semibold text-[#0A2A47] transition hover:border-[#0A2A47] hover:bg-white"
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
            </div>
          )}
        </Seccion>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Seccion
            titulo="Áreas con seguimiento"
            subtitulo="Áreas y locaciones donde el servicio requirió atención adicional."
            scrollable
          >
            {cargandoObservaciones ? (
              <EmptyState mensaje="Cargando seguimiento del servicio..." />
            ) : areasConSeguimientoCliente.length === 0 ? (
              <EmptyState mensaje="No hay áreas con seguimiento para este período." />
            ) : (
              <div className="flex flex-col gap-3">
                {areasConSeguimientoCliente.map((item, index) => (
                  <div key={`${item.area_id || item.locacion_id || item.locacion_nombre}-${index}`} className="rounded-[22px] border border-[#e6f0f8] bg-[#fbfdff] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#0A2A47]">
                          {item.area_nombre || item.locacion_nombre || "Ubicación no disponible"}
                        </p>
                        <p className="mt-1 text-xs text-[#7b8a97]">
                          {item.locacion_nombre && item.area_nombre ? item.locacion_nombre : "Servicio asignado"}
                        </p>
                      </div>
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-[#dbe8f2] bg-white text-[#0A2A47]">
                        <MapPin size={16} />
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-[#dbe8f2] bg-white px-2.5 py-1 text-[#0A2A47]">
                        Seguimientos: {item.total_seguimientos}
                      </span>
                      <span className="rounded-full border border-[#dbe8f2] bg-white px-2.5 py-1 text-[#0A2A47]">
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
            scrollable
          >
            {cargandoObservaciones ? (
              <EmptyState mensaje="Cargando seguimientos..." />
            ) : seguimientosRecientes.length === 0 ? (
              <EmptyState mensaje="No hay seguimientos recientes para este período." />
            ) : (
              <div className="flex flex-col gap-3">
                {seguimientosRecientes.map((item) => (
                  <div key={item.id} className="rounded-[22px] border border-[#e6f0f8] bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#0A2A47]">
                          {item.locacion_nombre || "Locación no disponible"}
                        </p>
                        <p className="mt-1 text-xs text-[#7b8a97]">
                          {item.area_nombre || "Área no disponible"}
                        </p>
                      </div>
                      <span className="rounded-full border border-[#dbe8f2] bg-[#f8fbfd] px-2.5 py-1 text-xs font-semibold text-[#0A2A47]">
                        {item.estado}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-[#dbe8f2] bg-[#f8fbfd] px-2.5 py-1 text-[#0A2A47]">
                        {item.tipo_publico}
                      </span>
                      <span className="rounded-full border border-[#dbe8f2] bg-[#f8fbfd] px-2.5 py-1 text-[#0A2A47]">
                        Abierto: {formatearFecha(item.creado_en)}
                      </span>
                      {item.resuelto_en ? (
                        <span className="rounded-full border border-[#dbe8f2] bg-[#f8fbfd] px-2.5 py-1 text-[#0A2A47]">
                          Resuelto: {formatearFecha(item.resuelto_en)}
                        </span>
                      ) : null}
                      <span className="rounded-full border border-[#dbe8f2] bg-[#f8fbfd] px-2.5 py-1 text-[#0A2A47]">
                        Tiempo de respuesta: {item.tiempo_respuesta_horas != null ? formatearHoras(item.tiempo_respuesta_horas) : "Pendiente"}
                      </span>
                    </div>
                    {(item.evidencia_resolucion || item.foto_resolucion) ? (
                      <div className="mt-4 space-y-2">
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
                              className="h-16 w-16 rounded-2xl border border-[#e6f0f8] object-cover shadow-sm transition hover:opacity-85"
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
          scrollable
          maxHeight="max-h-[480px]"
        >
          {cargandoFeedback ? (
            <EmptyState mensaje="Cargando feedback..." />
          ) : feedback.length === 0 ? (
            <EmptyState mensaje="No hay feedback disponible para este período." />
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {feedback.map((item) => (
                <div key={item.id} className="rounded-[22px] border border-[#e6f0f8] bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#0A2A47]">
                        {item.empresa}
                      </p>
                      <p className="mt-1 text-xs text-[#7b8a97]">
                        Lugar evaluado: {item.contexto || item.direccion || "-"}
                      </p>
                      <p className="mt-1 text-xs text-[#7b8a97]">
                        {item.nombre?.trim() || "Anónimo"} · {formatearFecha(item.creado_en)}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full border border-[#dbe8f2] bg-[#f8fbfd] px-2.5 py-1 text-sm font-semibold text-[#3BAE3D]">
                      <Star size={15} />
                      <span>{Number(item.calificacion).toFixed(1)}</span>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-[#0A2A47]">
                    {item.comentario?.trim() || "Sin comentario adicional"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Seccion>

        {modalReporteAbierto && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
            onClick={() => {
              if (!generandoReporte) setModalReporteAbierto(false);
            }}
          >
            <div
              className="w-full max-w-md rounded-[28px] border border-[#e6f0f8] bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-[#edf3f8] px-5 py-5">
                <h2 className="text-2xl font-bold tracking-tight text-[#0A2A47]">Generar reporte</h2>
                <p className="mt-1 text-sm text-[#5b6b79]">
                  Selecciona la fecha de inicio y fin para generar el PDF del servicio.
                </p>
              </div>

              <div className="space-y-4 px-5 py-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#0A2A47]">
                    Fecha de inicio
                  </label>
                  <input
                    type="date"
                    value={reporteConfig.desde}
                    onChange={(e) =>
                      setReporteConfig((prev) => ({ ...prev, desde: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-sm text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#0A2A47]">
                    Fecha de fin
                  </label>
                  <input
                    type="date"
                    value={reporteConfig.hasta}
                    onChange={(e) =>
                      setReporteConfig((prev) => ({ ...prev, hasta: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-sm text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                  />
                </div>

                {reporteConfig.desde && reporteConfig.hasta && reporteConfig.desde > reporteConfig.hasta ? (
                  <p className="text-sm text-red-600">
                    La fecha de inicio no puede ser mayor que la fecha de fin.
                  </p>
                ) : null}

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={generarReporteConRango}
                    disabled={
                      generandoReporte ||
                      !reporteConfig.desde ||
                      !reporteConfig.hasta ||
                      reporteConfig.desde > reporteConfig.hasta
                    }
                    className="flex-1 rounded-2xl bg-[#071f35] py-3 text-sm font-semibold text-white shadow-lg shadow-[#071f35]/10 transition hover:-translate-y-0.5 hover:bg-[#0c2a47] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {generandoReporte ? "Generando..." : "Generar PDF"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalReporteAbierto(false)}
                    disabled={generandoReporte}
                    className="flex-1 rounded-2xl border border-[#dbe8f2] py-3 text-sm font-semibold text-[#0A2A47] transition hover:border-[#0A2A47] hover:bg-[#f8fbfd] disabled:cursor-not-allowed disabled:opacity-60"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
            onClick={() => setImagenSeleccionada(null)}
          >
            <img
              src={imagenSeleccionada}
              alt="Vista ampliada"
              className="max-h-[90%] max-w-[90%] rounded-[28px] border border-[#e6f0f8] bg-white p-2 object-contain shadow-2xl"
            />
          </div>
        )}

        {actividadFicha && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
            onClick={() => setActividadFicha(null)}
          >
            <div
              className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-[28px] border border-[#e6f0f8] bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 flex items-center justify-between gap-4 border-b border-[#edf3f8] bg-white/95 px-5 py-5 backdrop-blur">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#0A2A47]">Ficha de cumplimiento verificado</h2>
                  <p className="text-sm text-[#5b6b79]">{actividadFicha.lista?.nombre || "Sin lista"}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${obtenerEstiloEstado(actividadFicha.estado_verificacion)}`}
                >
                  <ScanSearch size={12} />
                  {formatearEstadoVerificacion(actividadFicha.estado_verificacion)}
                </span>
              </div>

              <div className="space-y-4 p-5 md:p-6">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <DetalleVerificacion label="Locación" value={actividadFicha.usuario?.area?.locacion?.nombre} />
                  <DetalleVerificacion label="Área" value={actividadFicha.usuario?.area?.nombre} />
                  <DetalleVerificacion label="Lista / actividad" value={obtenerNombreActividad(actividadFicha)} />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
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

                <div className="rounded-2xl border border-[#e6f0f8] bg-[#fbfdff] p-4 shadow-sm">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Comentario</p>
                  <p className="whitespace-pre-wrap text-sm text-[#0A2A47]">{actividadFicha.comentario || "-"}</p>
                </div>

                {staticMapUrl(actividadFicha) ? (
                  <div className="rounded-2xl border border-[#e6f0f8] bg-[#fbfdff] p-4 shadow-sm">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Snapshot / mapa</p>
                    <img
                      src={staticMapUrl(actividadFicha)}
                      alt="Mapa de verificación"
                      className="max-h-72 w-full rounded-2xl border border-[#e6f0f8] object-contain shadow-sm"
                    />
                  </div>
                ) : null}

                <div className="rounded-2xl border border-[#e6f0f8] bg-[#fbfdff] p-4 shadow-sm">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Evidencia visual</p>
                  {actividadFicha.imagen ? (
                    <button
                      type="button"
                      onClick={() => setImagenSeleccionada(actividadFicha.imagen)}
                      className="w-full text-left"
                    >
                      <img
                        src={actividadFicha.imagen}
                        alt="Evidencia"
                        className="max-h-72 w-full rounded-2xl border border-[#e6f0f8] object-contain shadow-sm hover:opacity-90"
                      />
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#0A2A47]">
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
                  className="w-full rounded-2xl bg-[#071f35] py-3 text-sm font-semibold text-white shadow-lg shadow-[#071f35]/10 transition hover:-translate-y-0.5 hover:bg-[#0c2a47]"
                >
                  Descargar ficha PDF
                </button>

                <button
                  type="button"
                  onClick={() => setActividadFicha(null)}
                  className="w-full rounded-2xl border border-[#dbe8f2] py-3 text-sm font-semibold text-[#0A2A47] transition hover:border-[#0A2A47] hover:bg-[#f8fbfd]"
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

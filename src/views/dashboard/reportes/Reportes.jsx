import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useObtenerUsuariosQuery } from "../../../redux/api/userApi";
import Layout from "../../../components/Layout";
import { useObtenerActividadesUsuarioQuery } from "../../../redux/api/historialApi";
import { useObtenerIncidentesQuery } from "../../../redux/api/incidentesApi";
import tydyLogoSidebar from "../../../assets/imgs/Logo_fondo_azul.png";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useObtenerMiCompaniaQuery } from "../../../redux/api/userApi";
import {
  AlertTriangle,
  CheckCheck,
  ClipboardList,
  ImageIcon,
  Info,
  MapPin,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  formatBackendDateTime,
  parseBusinessDateTimeInput,
} from "../../../utils/dateTime";

const formatFecha = (valor) => {
  if (!valor) return "-";
  const fecha = new Date(valor);
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

const formatDuracion = (segundos) => {
  if (!Number.isFinite(Number(segundos))) return "-";
  const total = Number(segundos);
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const seg = total % 60;
  if (horas > 0) return `${horas}h ${minutos}m`;
  if (minutos > 0) return `${minutos}m ${seg}s`;
  return `${seg}s`;
};

const formatCoordenadas = (latitud, longitud) => {
  if (!latitud || !longitud) return "-";
  return `${Number(latitud).toFixed(6)}, ${Number(longitud).toFixed(6)}`;
};

const mapaUrl = (latitud, longitud) => {
  if (!latitud || !longitud) return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(`${latitud},${longitud}`)}`;
};

const staticMapUrl = (actividad) => {
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
};

const estadosAprobados = new Set(["verificada", "verificado", "aprobada", "aprobado", "ok"]);

const normalizarEstado = (estado) => (estado || "").trim().toLowerCase();

const estadosVerificacionOpciones = [
  { value: "", label: "Todos los estados" },
  { value: "verificada", label: "Verificada" },
  { value: "verificada_con_baja_precision", label: "Verificada con baja precisión" },
  { value: "requiere_revision", label: "Requiere revisión" },
  { value: "iniciada", label: "Iniciada" },
];

const obtenerEstiloEstado = (estado) => {
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
};

const formatearEstadoVerificacion = (estado) => {
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
};

const cargarDataUrl = async (url) => {
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

const agregarFooterByTydy = (doc, pageWidth, pageHeight, logoData) => {
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
};

const agregarFooterByTydyATodasLasPaginas = async (doc, pageWidth, pageHeight) => {
  const logoData = await cargarDataUrl(tydyLogoSidebar);
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    agregarFooterByTydy(doc, pageWidth, pageHeight, logoData);
  }
};

function TarjetaResumen({ titulo, valor, detalle, icono, variante = "claro" }) {
  const estilos =
    variante === "principal"
      ? "bg-[#0A2A47] text-white border border-[#0A2A47]"
      : "bg-white text-[#0A2A47] border border-[#e6f0f8]";

  const colorDetalle = variante === "principal" ? "text-white/75" : "text-gray-500";
  const colorIcono = variante === "principal" ? "text-[#3BAE3D]" : "text-[#0A2A47]";

  return (
    <div className={`rounded-xl p-4 shadow-sm ${estilos}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-sm font-medium ${colorDetalle}`}>{titulo}</p>
          <p className="mt-2 text-3xl font-bold leading-none">{valor}</p>
        </div>
        <div className={colorIcono}>{icono}</div>
      </div>
      <p className={`mt-3 text-xs ${colorDetalle}`}>{detalle}</p>
    </div>
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

export default function Reportes() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [usuarioId, setUsuarioId] = useState("");
  const [finalizada, setFinalizada] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [empresaFiltro, setEmpresaFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [actividadVerificacion, setActividadVerificacion] = useState(null);
  const [highlightedActividadId, setHighlightedActividadId] = useState(null);
  const actividadRowRefs = useRef({});
  const deepLinkHandledRef = useRef(null);
  const deepLinkMissingRef = useRef(null);
  const highlightTimeoutRef = useRef(null);

  const { data: usuarios = [] } = useObtenerUsuariosQuery();
  const { data: compania } = useObtenerMiCompaniaQuery();
  const { data: incidentes = [] } = useObtenerIncidentesQuery();
  const desdeDate = useMemo(() => parseBusinessDateTimeInput(desde), [desde]);
  const hastaDate = useMemo(() => parseBusinessDateTimeInput(hasta), [hasta]);

  const { data = [], isLoading: isLoadingActividades } = useObtenerActividadesUsuarioQuery({
    usuario_id: usuarioId || undefined,
    finalizada: finalizada === "" ? undefined : finalizada === "true",
    empresa: empresaFiltro || undefined,
    estado_verificacion: estadoFiltro || undefined,
    desde: desdeDate ? formatBackendDateTime(desdeDate) : undefined,
    hasta: hastaDate ? formatBackendDateTime(hastaDate) : undefined,
  });

  const usuariosPorId = useMemo(() => {
    return usuarios.reduce((acc, usuario) => {
      acc[usuario.id] = usuario;
      return acc;
    }, {});
  }, [usuarios]);

  const empresas = Array.from(new Set(data.map(a => a.usuario?.area?.locacion?.empresa?.nombre).filter(Boolean)));

  const dataFiltrada = useMemo(() => data, [data]);
  const actividadDeepLinkId = searchParams.get("actividad");
  const incidentesPorActividadId = useMemo(() => {
    return incidentes.reduce((acc, incidente) => {
      if (!incidente.actividad_usuario_id || acc[incidente.actividad_usuario_id]) return acc;
      acc[incidente.actividad_usuario_id] = incidente;
      return acc;
    }, {});
  }, [incidentes]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!actividadDeepLinkId || isLoadingActividades) return;

    const actividadObjetivo = dataFiltrada.find((actividad) => actividad.id === actividadDeepLinkId);

    if (actividadObjetivo) {
      if (deepLinkHandledRef.current === actividadDeepLinkId) return;
      deepLinkHandledRef.current = actividadDeepLinkId;
      deepLinkMissingRef.current = null;

      setHighlightedActividadId(actividadDeepLinkId);
      setActividadVerificacion(actividadObjetivo);

      requestAnimationFrame(() => {
        actividadRowRefs.current[actividadDeepLinkId]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });

      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedActividadId((current) => (current === actividadDeepLinkId ? null : current));
      }, 4000);

      return;
    }

    if (dataFiltrada.length > 0 && deepLinkMissingRef.current !== actividadDeepLinkId) {
      deepLinkMissingRef.current = actividadDeepLinkId;
      toast.info("La actividad enlazada no está visible con los registros cargados.");
    }
  }, [actividadDeepLinkId, dataFiltrada, isLoadingActividades]);

  const resumen = useMemo(() => {
    const total = dataFiltrada.length;
    const finalizadasCount = dataFiltrada.filter((a) => a.finalizada).length;
    const evidenciaCount = dataFiltrada.filter(
      (a) => a.evidencia_entregada || (a.imagen && a.imagen !== "string")
    ).length;
    const locacionesCount = new Set(
      dataFiltrada.map((a) => a.usuario?.area?.locacion?.id || a.usuario?.area?.locacion?.nombre).filter(Boolean)
    ).size;
    const empleadosCount = new Set(dataFiltrada.map((a) => a.usuario?.id).filter(Boolean)).size;
    const revisionCount = dataFiltrada.filter((a) => {
      const estado = normalizarEstado(a.estado_verificacion);
      if (!estado) return false;
      return !estadosAprobados.has(estado);
    }).length;

    return {
      total,
      finalizadasCount,
      evidenciaCount,
      locacionesCount,
      empleadosCount,
      revisionCount,
    };
  }, [dataFiltrada]);

  const descargarExcel = () => {
    const filas = dataFiltrada.map(a => ({
      "Hora Inicio": formatFecha(a.hora_inicio),
      "Hora Fin": formatFecha(a.hora_fin),
      "Lista": a.lista?.nombre || "-",
      "Actividades Lista": a.lista?.actividades?.map(act => act.nombre).join(", ") || "-",
      "Finalizada": a.finalizada ? "Sí" : "No",
      "Comentario": a.comentario || "-",
      "Encargado": a.usuario?.nombre || "-",
      "ID Encargado": a.usuario?.identificacion || "-",
      "Empresa": a.usuario?.area?.locacion?.empresa?.nombre || "-",
      "Locación": a.usuario?.area?.locacion?.nombre || "-",
      "Área": a.usuario?.area?.nombre || "-",
      "Imagen": a.imagen || "-",
      "Estado Verificación": a.estado_verificacion || "-",
      "Método Inicio": a.metodo_inicio || "-",
      "Método Fin": a.metodo_fin || "-",
      "Duración": formatDuracion(a.duracion_segundos),
      "GPS Inicio": formatCoordenadas(a.latitud_inicio, a.longitud_inicio),
      "GPS Cierre": formatCoordenadas(a.latitud_fin, a.longitud_fin),
      "Precisión Inicio (m)": a.precision_inicio ? Number(a.precision_inicio).toFixed(1) : "-",
      "Precisión Cierre (m)": a.precision_fin ? Number(a.precision_fin).toFixed(1) : "-",
      "Distancia Inicio (m)": a.distancia_validacion ? Number(a.distancia_validacion).toFixed(1) : "-",
      "Distancia Cierre (m)": a.distancia_fin ? Number(a.distancia_fin).toFixed(1) : "-",
      "Supervisor": usuariosPorId[a.supervisor_id]?.nombre || a.supervisor_id || "Sin supervisor asignado",
      "Evidencia Obligatoria": a.evidencia_obligatoria ? "Sí" : "No",
      "Evidencia Entregada": a.evidencia_entregada ? "Sí" : "No",
      "Evidencia Subida En": formatFecha(a.evidencia_subida_en),
      "Usuario Evidencia": usuariosPorId[a.evidencia_usuario_id]?.nombre || a.evidencia_usuario_id || "-",
      "Tipo Evidencia": a.evidencia_tipo || "-",
      "Archivo Evidencia": a.evidencia_nombre_archivo || "-",
      "Mapa Inicio": mapaUrl(a.latitud_inicio, a.longitud_inicio) || "-",
      "Mapa Cierre": mapaUrl(a.latitud_fin, a.longitud_fin) || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Actividades");

    const blob = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([blob], { type: "application/octet-stream" }), "actividades.xlsx");
  };

  const exportarPDFReportes = async () => {
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let cursorY = 12;

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

    const fecha = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
    doc.setFontSize(11);
    const lines = [
      compania?.nombre ? `Empresa: ${compania.nombre}` : null,
      compania?.ruc ? `RUC: ${compania.ruc}` : null,
      compania?.direccion ? `Dirección: ${compania.direccion}` : null,
      compania?.telefono ? `Teléfono: ${compania.telefono}` : null,
      `Fecha de generación: ${fecha}`,
    ].filter(Boolean);

    lines.forEach((txt, idx) => {
      doc.text(txt, 14, cursorY + idx * 6);
    });

    cursorY += lines.length * 6 + 8;
    doc.setFontSize(16);
    doc.setTextColor(10, 42, 71);
    doc.text("Reporte General de Verificación Operativa", pageWidth / 2, cursorY, { align: "center" });
    cursorY += 8;

    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(
      "Resumen consolidado de cumplimiento, evidencia y estado de verificación para los filtros aplicados.",
      pageWidth / 2,
      cursorY,
      { align: "center" }
    );
    cursorY += 10;

    const filtrosActivos = [
      usuarioId
        ? `Usuario: ${usuarios.find((u) => u.id === usuarioId)?.nombre || "Seleccionado"}`
        : "Usuario: Todos",
      finalizada === ""
        ? "Estado finalización: Todas"
        : `Estado finalización: ${finalizada === "true" ? "Finalizadas" : "Pendientes"}`,
      empresaFiltro ? `Empresa: ${empresaFiltro}` : "Empresa: Todas",
      estadoFiltro
        ? `Estado verificación: ${formatearEstadoVerificacion(estadoFiltro)}`
        : "Estado verificación: Todos",
      desdeDate ? `Desde: ${formatFecha(desdeDate)}` : null,
      hastaDate ? `Hasta: ${formatFecha(hastaDate)}` : null,
    ].filter(Boolean);

    autoTable(doc, {
      startY: cursorY,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2.5, textColor: [10, 42, 71] },
      headStyles: { fillColor: [10, 42, 71], textColor: 255 },
      margin: { left: 14, right: 14 },
      head: [["Indicador", "Valor", "Indicador", "Valor"]],
      body: [
        ["Registros", String(resumen.total), "Finalizadas", String(resumen.finalizadasCount)],
        ["Con evidencia", String(resumen.evidenciaCount), "Empleados", String(resumen.empleadosCount)],
        ["Locaciones", String(resumen.locacionesCount), "En revisión", String(resumen.revisionCount)],
      ],
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 42 },
        1: { cellWidth: 28 },
        2: { fontStyle: "bold", cellWidth: 42 },
        3: { cellWidth: 28 },
      },
    });

    cursorY = doc.lastAutoTable.finalY + 5;
    doc.setFontSize(10);
    doc.setTextColor(10, 42, 71);
    doc.text("Filtros aplicados", 14, cursorY);
    cursorY += 2;

    autoTable(doc, {
      startY: cursorY,
      theme: "plain",
      styles: { fontSize: 8.5, cellPadding: 1.5, textColor: [80, 80, 80] },
      margin: { left: 14, right: 14 },
      body: filtrosActivos.map((filtro) => [filtro]),
    });

    cursorY = doc.lastAutoTable.finalY + 5;
    const headers = [[
      "Estado",
      "Inicio",
      "Fin",
      "Duración",
      "Empleado",
      "Empresa",
      "Locación",
      "Área",
      "Checklist",
      "Métodos",
      "GPS",
      "Evidencia",
      "Comentario",
    ]];

    const body = dataFiltrada.map((a) => [
      formatearEstadoVerificacion(a.estado_verificacion),
      formatFecha(a.hora_inicio),
      formatFecha(a.hora_fin),
      formatDuracion(a.duracion_segundos),
      a.usuario?.nombre
        ? `${a.usuario.nombre}${a.usuario?.identificacion ? ` (${a.usuario.identificacion})` : ""}`
        : "-",
      a.usuario?.area?.locacion?.empresa?.nombre || "-",
      a.usuario?.area?.locacion?.nombre || "-",
      a.usuario?.area?.nombre || "-",
      a.lista?.nombre || "-",
      `${a.metodo_inicio || "-"} / ${a.metodo_fin || "-"}`,
      [
        a.distancia_validacion ? `Inicio ${Number(a.distancia_validacion).toFixed(0)} m` : null,
        a.distancia_fin ? `Cierre ${Number(a.distancia_fin).toFixed(0)} m` : null,
      ].filter(Boolean).join(" | ") || "-",
      a.evidencia_entregada ? "Entregada" : a.evidencia_obligatoria ? "Faltante" : "No requerida",
      a.comentario && a.comentario !== "string" ? a.comentario : "-",
    ]);

    autoTable(doc, {
      head: headers,
      body,
      startY: cursorY,
      styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak", valign: "top" },
      headStyles: { fillColor: [10, 42, 71], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 12 },
        4: { cellWidth: 24 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
        7: { cellWidth: 18 },
        8: { cellWidth: 22 },
        9: { cellWidth: 14 },
        10: { cellWidth: 24 },
        11: { cellWidth: 16 },
        12: { cellWidth: 41 },
      },
      didDrawPage: () => {
        const page = doc.getNumberOfPages();
        doc.setFontSize(9);
        doc.setTextColor(90, 90, 90);
        doc.text(`Página ${page}`, pageWidth - 22, pageHeight - 8);
      },
    });

    await agregarFooterByTydyATodasLasPaginas(doc, pageWidth, pageHeight);
    doc.save(`Reporte-Actividades-${Date.now()}.pdf`);
  };

  const exportarPDFVerificacion = async (actividad) => {
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let cursorY = 14;

    const urlToDataURL = cargarDataUrl;

    if (compania?.logo) {
      const imgData = await urlToDataURL(compania.logo);
      if (imgData) {
        const imgWidth = 48;
        doc.addImage(imgData, "PNG", (pageWidth - imgWidth) / 2, cursorY, imgWidth, 0);
        cursorY += 24;
      }
    }

    doc.setFontSize(16);
    doc.setTextColor(10, 42, 71);
    doc.text("Reporte de Cumplimiento Verificado", pageWidth / 2, cursorY, { align: "center" });
    cursorY += 8;

    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Generado: ${formatFecha(new Date())}`, pageWidth / 2, cursorY, { align: "center" });
    cursorY += 8;

    const inicioMapa = mapaUrl(actividad.latitud_inicio, actividad.longitud_inicio);
    const cierreMapa = mapaUrl(actividad.latitud_fin, actividad.longitud_fin);

    autoTable(doc, {
      startY: cursorY,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [10, 42, 71], textColor: 255 },
      head: [["Campo", "Valor"]],
      body: [
        ["Estado verificación", actividad.estado_verificacion || "-"],
        ["Empleado", actividad.usuario?.nombre || "-"],
        ["Identificación", actividad.usuario?.identificacion || "-"],
        ["Supervisor", usuariosPorId[actividad.supervisor_id]?.nombre || actividad.supervisor_id || "Sin supervisor asignado"],
        ["Empresa cliente", actividad.usuario?.area?.locacion?.empresa?.nombre || "-"],
        ["Locación", actividad.usuario?.area?.locacion?.nombre || "-"],
        ["Área", actividad.usuario?.area?.nombre || "-"],
        ["Checklist", actividad.lista?.nombre || "-"],
        ["Hora inicio", formatFecha(actividad.hora_inicio)],
        ["Hora fin", formatFecha(actividad.hora_fin)],
        ["Duración", formatDuracion(actividad.duracion_segundos)],
        ["Método inicio", actividad.metodo_inicio || "-"],
        ["Método cierre", actividad.metodo_fin || "-"],
        ["GPS inicio", formatCoordenadas(actividad.latitud_inicio, actividad.longitud_inicio)],
        ["GPS cierre", formatCoordenadas(actividad.latitud_fin, actividad.longitud_fin)],
        ["Precisión inicio", actividad.precision_inicio ? `${Number(actividad.precision_inicio).toFixed(1)} m` : "-"],
        ["Precisión cierre", actividad.precision_fin ? `${Number(actividad.precision_fin).toFixed(1)} m` : "-"],
        ["Distancia inicio", actividad.distancia_validacion ? `${Number(actividad.distancia_validacion).toFixed(1)} m` : "-"],
        ["Distancia cierre", actividad.distancia_fin ? `${Number(actividad.distancia_fin).toFixed(1)} m` : "-"],
        ["Evidencia obligatoria", actividad.evidencia_obligatoria ? "Sí" : "No"],
        ["Evidencia entregada", actividad.evidencia_entregada ? "Sí" : "No"],
        ["Evidencia subida en", formatFecha(actividad.evidencia_subida_en)],
        ["Usuario evidencia", usuariosPorId[actividad.evidencia_usuario_id]?.nombre || actividad.evidencia_usuario_id || "-"],
        ["Tipo evidencia", actividad.evidencia_tipo || "-"],
        ["Archivo evidencia", actividad.evidencia_nombre_archivo || "-"],
      ],
      columnStyles: {
        0: { cellWidth: 48, fontStyle: "bold" },
        1: { cellWidth: 132 },
      },
    });

    cursorY = doc.lastAutoTable.finalY + 8;

    const actividadesChecklist = actividad.lista?.actividades?.length
      ? actividad.lista.actividades.map((act) => [act.nombre || "-"])
      : [["Sin actividades registradas"]];

    autoTable(doc, {
      startY: cursorY,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [59, 174, 61], textColor: 255 },
      head: [["Actividades del checklist"]],
      body: actividadesChecklist,
    });

    cursorY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.setTextColor(10, 42, 71);
    doc.text("Comentario", 14, cursorY);
    cursorY += 5;
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(doc.splitTextToSize(actividad.comentario || "-", pageWidth - 28), 14, cursorY);
    cursorY += 14;

    if (inicioMapa || cierreMapa) {
      doc.setFontSize(10);
      doc.setTextColor(10, 42, 71);
      doc.text("Links de ubicación", 14, cursorY);
      cursorY += 6;
      doc.setFontSize(9);
      if (inicioMapa) {
        doc.setTextColor(0, 80, 180);
        doc.textWithLink("Abrir punto de inicio en mapa", 14, cursorY, { url: inicioMapa });
        cursorY += 6;
      }
      if (cierreMapa) {
        doc.setTextColor(0, 80, 180);
        doc.textWithLink("Abrir punto de cierre en mapa", 14, cursorY, { url: cierreMapa });
        cursorY += 8;
      }
    }

    const mapaEstaticoUrl = staticMapUrl(actividad);
    if (mapaEstaticoUrl) {
      const mapaData = await urlToDataURL(mapaEstaticoUrl);
      if (mapaData) {
        if (cursorY > 170) {
          doc.addPage();
          cursorY = 14;
        }
        doc.setFontSize(10);
        doc.setTextColor(10, 42, 71);
        doc.text("Mapa de verificación", 14, cursorY);
        cursorY += 6;
        doc.addImage(mapaData, "JPEG", 14, cursorY, pageWidth - 28, 78);
        cursorY += 84;
        doc.setFontSize(8);
        doc.setTextColor(90, 90, 90);
        doc.text("Inicio: marcador verde. Cierre: marcador rojo. Map data by LocationIQ/OpenStreetMap.", 14, cursorY);
        cursorY += 8;
      }
    }

    if (actividad.imagen && actividad.imagen !== "string") {
      const evidenciaData = await urlToDataURL(actividad.imagen);
      if (evidenciaData) {
        if (cursorY > 210) {
          doc.addPage();
          cursorY = 14;
        }
        doc.setFontSize(10);
        doc.setTextColor(10, 42, 71);
        doc.text("Evidencia visual", 14, cursorY);
        cursorY += 6;
        doc.addImage(evidenciaData, "JPEG", 14, cursorY, pageWidth - 28, 0);
      }
    }

    await agregarFooterByTydyATodasLasPaginas(doc, pageWidth, pageHeight);
    doc.save(`Cumplimiento-Verificado-${actividad.id}.pdf`);
  };


  return (
    <Layout>
      <div className="bg-white p-4">
        <h1 className="text-3xl font-extrabold text-[#0A2A47] mb-4">Reportes</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 mb-6">
          <TarjetaResumen
            titulo="Reportes"
            valor={resumen.total}
            detalle="Registros visibles con los filtros actuales."
            icono={<ClipboardList size={20} />}
            variante="principal"
          />
          <TarjetaResumen
            titulo="Finalizadas"
            valor={resumen.finalizadasCount}
            detalle={`${resumen.total ? Math.round((resumen.finalizadasCount / resumen.total) * 100) : 0}% del total filtrado.`}
            icono={<CheckCheck size={20} />}
          />
          <TarjetaResumen
            titulo="Con evidencia"
            valor={resumen.evidenciaCount}
            detalle="Actividades con soporte visual o evidencia entregada."
            icono={<ImageIcon size={20} />}
          />
          <TarjetaResumen
            titulo="Empleados"
            valor={resumen.empleadosCount}
            detalle={`${resumen.locacionesCount} locaciones cubiertas en este corte.`}
            icono={<MapPin size={20} />}
          />
          <TarjetaResumen
            titulo="En revisión"
            valor={resumen.revisionCount}
            detalle="Casos con estado de verificación distinto de aprobado."
            icono={<AlertTriangle size={20} />}
          />
        </div>

        <div className="bg-white border border-[#e6f0f8] rounded-xl p-4 mb-6 flex flex-wrap gap-3 shadow-sm">
          <select
            value={usuarioId}
            onChange={e => setUsuarioId(e.target.value)}
            className="border border-[#0A2A47] px-3 py-2 rounded-md w-full sm:w-auto text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
          >
            <option value="">Todos los usuarios</option>
            {usuarios.map(u => (
              <option key={u.id} value={u.id}>
                {u.nombre} ({u.identificacion})
              </option>
            ))}
          </select>
          <select
            value={finalizada}
            onChange={e => setFinalizada(e.target.value)}
            className="border border-[#0A2A47] px-3 py-2 rounded-md w-full sm:w-auto text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
          >
            <option value="">Todas</option>
            <option value="true">Finalizadas</option>
            <option value="false">Pendientes</option>
          </select>
          <select
            value={empresaFiltro}
            onChange={e => setEmpresaFiltro(e.target.value)}
            className="border border-[#0A2A47] px-3 py-2 rounded-md w-full sm:w-auto text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
          >
            <option value="">Todas las empresas</option>
            {empresas.map((emp, i) => (
              <option key={i} value={emp}>{emp}</option>
            ))}
          </select>
          <select
            value={estadoFiltro}
            onChange={e => setEstadoFiltro(e.target.value)}
            className="border border-[#0A2A47] px-3 py-2 rounded-md w-full sm:w-auto text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
          >
            {estadosVerificacionOpciones.map((estado) => (
              <option key={estado.value || "all"} value={estado.value}>
                {estado.label}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={desde}
            onChange={e => setDesde(e.target.value)}
            className="border border-[#0A2A47] px-3 py-2 rounded-md w-full sm:w-auto text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
          />
          <input
            type="datetime-local"
            value={hasta}
            onChange={e => setHasta(e.target.value)}
            className="border border-[#0A2A47] px-3 py-2 rounded-md w-full sm:w-auto text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
          />
          <button
            className="bg-[#0A2A47] text-white px-6 py-2 rounded font-semibold shadow-sm hover:bg-[#123b63]"
            onClick={descargarExcel}
          >
            Descargar Excel
          </button>
          <button
            className="bg-[#0A2A47] text-white px-6 py-2 rounded font-semibold shadow-sm hover:bg-[#123b63]"
            onClick={exportarPDFReportes}
          >
            Exportar PDF
          </button>
          <button
            className="border border-[#0A2A47] text-[#0A2A47] px-6 py-2 rounded font-semibold hover:bg-[#e6f0f8]"
            onClick={() => {
              setUsuarioId("");
              setFinalizada("");
              setEmpresaFiltro("");
              setEstadoFiltro("");
              setDesde("");
              setHasta("");
            }}
          >
            Limpiar Filtros
          </button>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-[#0A2A47]">Historial de actividades verificadas</h2>
            <p className="text-sm text-gray-500">Consulta, filtra y exporta la evidencia operativa registrada.</p>
          </div>
          <span className="text-sm font-semibold text-[#0A2A47]">
            {dataFiltrada.length} registros
          </span>
        </div>

        <div className="rounded-xl border border-[#e6f0f8] bg-white shadow-sm">
          <div className="max-h-[50vh] overflow-x-auto overflow-y-auto rounded-xl">
            <table className="min-w-full text-sm text-[#0A2A47]">
              <thead className="bg-white text-[#0A2A47] border-b border-[#e6f0f8] sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-3">Estado</th>
                  <th className="py-2 px-3">Hora Inicio</th>
                  <th className="py-2 px-3">Hora Fin</th>
                  <th className="py-2 px-3">Lista</th>
                  <th className="py-2 px-3">Actividades Lista</th>
                  <th className="py-2 px-3">Finalizada</th>
                  <th className="py-2 px-3">Comentario</th>
                  <th className="py-2 px-3">Encargado</th>
                  <th className="py-2 px-3">ID Encargado</th>
                  <th className="py-2 px-3">Empresa</th>
                  <th className="py-2 px-3">Locación</th>
                  <th className="py-2 px-3">Área</th>
                  <th className="py-2 px-3">Imagen</th>
                  <th className="py-2 px-3">Verificación</th>
                  <th className="py-2 px-3">Incidente</th>
                </tr>
              </thead>
              <tbody>
                {dataFiltrada.map(a => (
                  (() => {
                    const incidenteAsociado = incidentesPorActividadId[a.id];

                    return (
                  <tr
                    key={a.id}
                    ref={(node) => {
                      if (node) {
                        actividadRowRefs.current[a.id] = node;
                      }
                    }}
                    className={`transition-colors border-b border-[#e6f0f8] hover:bg-[#e6f0f8] ${
                      highlightedActividadId === a.id ? "bg-[#eef6ff] border-l-4 border-l-[#0A2A47]" : ""
                    }`}
                  >
                  <td className="py-2 px-3 align-top">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${obtenerEstiloEstado(a.estado_verificacion)}`}
                    >
                      <ScanSearch size={12} />
                      {formatearEstadoVerificacion(a.estado_verificacion)}
                    </span>
                  </td>
                  <td className="py-2 px-3 align-top">{formatFecha(a.hora_inicio)}</td>
                  <td className="py-2 px-3 align-top">{formatFecha(a.hora_fin)}</td>
                  <td className="py-2 px-3 align-top">{a.lista?.nombre || "-"}</td>
                  <td className="py-2 px-3 align-top">
                    <ul className="list-disc list-inside space-y-1 text-left">
                      {a.lista?.actividades?.length ? a.lista.actividades.map((act, i) => (
                        <li key={i}>{act.nombre || "-"}</li>
                      )) : "-"}
                    </ul>
                  </td>
                  <td className="py-2 px-3 align-top">{a.finalizada ? "Sí" : "No"}</td>
                  <td className="py-2 px-3 align-top">{a.comentario || "-"}</td>
                  <td className="py-2 px-3 align-top">{a.usuario?.nombre || "-"}</td>
                  <td className="py-2 px-3 align-top">{a.usuario?.identificacion || "-"}</td>
                  <td className="py-2 px-3 align-top">{a.usuario?.area?.locacion?.empresa?.nombre || "-"}</td>
                  <td className="py-2 px-3 align-top">{a.usuario?.area?.locacion?.nombre || "-"}</td>
                  <td className="py-2 px-3 align-top">{a.usuario?.area?.nombre || "-"}</td>
                  <td className="py-2 px-3 align-top">
                    {a.imagen && a.imagen !== "string" ? (
                      <img
                        src={a.imagen}
                        alt="Evidencia"
                        className="h-16 w-16 object-cover cursor-pointer rounded-md border border-[#e6f0f8] shadow-sm hover:opacity-80"
                        onClick={() => setImagenSeleccionada(a.imagen)}
                      />
                    ) : "-"}
                  </td>
                  <td className="py-2 px-3 align-top">
                    <button
                      type="button"
                      onClick={() => setActividadVerificacion(a)}
                      className="inline-flex items-center gap-1 rounded-md border border-[#0A2A47] px-2 py-1 text-xs font-semibold text-[#0A2A47] hover:bg-[#e6f0f8]"
                    >
                      <ShieldCheck size={14} />
                      Ver
                    </button>
                  </td>
                  <td className="py-2 px-3 align-top">
                    {incidenteAsociado ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/incidentes?actividad=${a.id}`)}
                        className="inline-flex items-center gap-1 rounded-md border border-[#0A2A47] px-2 py-1 text-xs font-semibold text-[#0A2A47] hover:bg-[#e6f0f8]"
                      >
                        <AlertTriangle size={14} />
                        Ver incidente
                      </button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  </tr>
                    );
                  })()
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
        {actividadVerificacion && (
          <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setActividadVerificacion(null)}
          >
            <div
              className="bg-white rounded-xl border border-[#0A2A47] shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-[#e6f0f8] p-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#0A2A47]">Ficha de verificación</h2>
                  <p className="text-sm text-gray-500">{actividadVerificacion.lista?.nombre || "Sin lista"}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${obtenerEstiloEstado(actividadVerificacion.estado_verificacion)}`}
                >
                  <ScanSearch size={12} />
                  {formatearEstadoVerificacion(actividadVerificacion.estado_verificacion)}
                </span>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <DetalleVerificacion label="Empleado" value={actividadVerificacion.usuario?.nombre} />
                  <DetalleVerificacion label="Identificación" value={actividadVerificacion.usuario?.identificacion} />
                  <DetalleVerificacion
                    label="Supervisor"
                    value={usuariosPorId[actividadVerificacion.supervisor_id]?.nombre || actividadVerificacion.supervisor_id || "Sin supervisor asignado"}
                  />
                  <DetalleVerificacion label="Empresa cliente" value={actividadVerificacion.usuario?.area?.locacion?.empresa?.nombre} />
                  <DetalleVerificacion label="Locación" value={actividadVerificacion.usuario?.area?.locacion?.nombre} />
                  <DetalleVerificacion label="Área" value={actividadVerificacion.usuario?.area?.nombre} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <DetalleVerificacion label="Hora inicio" value={formatFecha(actividadVerificacion.hora_inicio)} />
                  <DetalleVerificacion label="Hora fin" value={formatFecha(actividadVerificacion.hora_fin)} />
                  <DetalleVerificacion label="Duración" value={formatDuracion(actividadVerificacion.duracion_segundos)} />
                  <DetalleVerificacion label="Finalizada" value={actividadVerificacion.finalizada ? "Sí" : "No"} />
                  <DetalleVerificacion label="Método inicio" value={actividadVerificacion.metodo_inicio} />
                  <DetalleVerificacion label="Método cierre" value={actividadVerificacion.metodo_fin} />
                  <DetalleVerificacion label="GPS inicio" value={formatCoordenadas(actividadVerificacion.latitud_inicio, actividadVerificacion.longitud_inicio)} />
                  <DetalleVerificacion label="GPS cierre" value={formatCoordenadas(actividadVerificacion.latitud_fin, actividadVerificacion.longitud_fin)} />
                  <DetallePrecision
                    label="Precisión inicio"
                    value={actividadVerificacion.precision_inicio ? `${Number(actividadVerificacion.precision_inicio).toFixed(1)} m` : "-"}
                  />
                  <DetallePrecision
                    label="Precisión cierre"
                    value={actividadVerificacion.precision_fin ? `${Number(actividadVerificacion.precision_fin).toFixed(1)} m` : "-"}
                  />
                  <DetalleVerificacion
                    label="Distancia inicio"
                    value={actividadVerificacion.distancia_validacion ? `${Number(actividadVerificacion.distancia_validacion).toFixed(1)} m` : "-"}
                  />
                  <DetalleVerificacion
                    label="Distancia cierre"
                    value={actividadVerificacion.distancia_fin ? `${Number(actividadVerificacion.distancia_fin).toFixed(1)} m` : "-"}
                  />
                  <DetalleVerificacion label="Evidencia obligatoria" value={actividadVerificacion.evidencia_obligatoria ? "Sí" : "No"} />
                  <DetalleVerificacion label="Evidencia entregada" value={actividadVerificacion.evidencia_entregada ? "Sí" : "No"} />
                  <DetalleVerificacion label="Evidencia subida en" value={formatFecha(actividadVerificacion.evidencia_subida_en)} />
                  <DetalleVerificacion label="Tipo evidencia" value={actividadVerificacion.evidencia_tipo} />
                  <DetalleVerificacion label="Archivo evidencia" value={actividadVerificacion.evidencia_nombre_archivo} />
                  <DetalleVerificacion
                    label="Usuario evidencia"
                    value={usuariosPorId[actividadVerificacion.evidencia_usuario_id]?.nombre || actividadVerificacion.evidencia_usuario_id}
                  />
                </div>

                <div className="border border-[#e6f0f8] rounded-md p-3 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Actividades del checklist</p>
                  <ul className="list-disc list-inside space-y-1 text-left text-sm text-[#0A2A47]">
                    {actividadVerificacion.lista?.actividades?.length ? actividadVerificacion.lista.actividades.map((act) => (
                      <li key={act.id}>{act.nombre}</li>
                    )) : <li>Sin actividades registradas</li>}
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border border-[#e6f0f8] rounded-md p-3 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Comentario</p>
                    <p className="text-sm text-[#0A2A47] whitespace-pre-wrap">{actividadVerificacion.comentario || "-"}</p>
                  </div>
                  <div className="border border-[#e6f0f8] rounded-md p-3 shadow-sm">
                    <p className="text-xs text-gray-500 mb-2">Evidencia visual</p>
                    {actividadVerificacion.imagen && actividadVerificacion.imagen !== "string" ? (
                      <img
                        src={actividadVerificacion.imagen}
                        alt="Evidencia"
                        className="max-h-64 w-full object-contain rounded-md border border-[#e6f0f8] shadow-sm"
                      />
                    ) : (
                      <p className="text-sm text-[#0A2A47]">Sin imagen</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => exportarPDFVerificacion(actividadVerificacion)}
                  className="w-full rounded bg-[#0A2A47] py-2 text-white font-semibold shadow-sm hover:bg-[#123b63]"
                >
                  Descargar PDF verificable
                </button>

                <button
                  type="button"
                  onClick={() => setActividadVerificacion(null)}
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

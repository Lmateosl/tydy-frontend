import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../../../components/Layout";
import { useObtenerFeedbackUserQuery } from "../../../redux/api/listasApi";
import { useObtenerIncidentesQuery } from "../../../redux/api/incidentesApi";
import { Search, Calendar, Star, Image as ImageIcon } from "lucide-react";
import { toast } from "react-toastify";
import { parseBusinessDateInput } from "../../../utils/dateTime";

const ReporteFeedback = () => {
  const [searchParams] = useSearchParams();
  const {
    data: feedbacks = [],
    isLoading,
    isFetching,
    refetch,
  } = useObtenerFeedbackUserQuery();
  const { data: incidentesFeedback = [] } = useObtenerIncidentesQuery({
    tipo: "feedback_negativo",
  });

  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [zoomUrl, setZoomUrl] = useState(null);
  const [highlightedFeedbackId, setHighlightedFeedbackId] = useState(null);
  const feedbackRowRefs = useRef({});
  const deepLinkHandledRef = useRef(null);
  const deepLinkMissingRef = useRef(null);
  const highlightTimeoutRef = useRef(null);
  const feedbackDeepLinkId = searchParams.get("feedback");

  const stats = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbacks.forEach((f) => {
      const r = Math.round(Number(f.calificacion));
      if (r >= 1 && r <= 5) {
        counts[r] += 1;
      }
    });
    return {
      total: feedbacks.length,
      counts,
    };
  }, [feedbacks]);

  const feedbacksFiltrados = useMemo(() => {
    return feedbacks.filter((f) => {
      const empresaOk = filtroEmpresa
        ? f.empresa
            ?.toLowerCase()
            .includes(filtroEmpresa.trim().toLowerCase())
        : true;

      let fechaOk = true;
      const fecha = f.creado_en ? new Date(f.creado_en) : null;
      const rangoDesde = fechaDesde ? parseBusinessDateInput(fechaDesde) : null;
      const rangoHasta = fechaHasta ? parseBusinessDateInput(fechaHasta) : null;

      if (fecha && rangoDesde) {
        if (fecha < rangoDesde.desde) fechaOk = false;
      }

      if (fecha && rangoHasta) {
        if (fecha > rangoHasta.hasta) fechaOk = false;
      }

      return empresaOk && fechaOk;
    });
  }, [feedbacks, filtroEmpresa, fechaDesde, fechaHasta]);

  const incidentesPorFeedbackId = useMemo(() => {
    return incidentesFeedback.reduce((acc, incidente) => {
      if (incidente.feedback_id) {
        acc[incidente.feedback_id] = incidente;
      }
      return acc;
    }, {});
  }, [incidentesFeedback]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!feedbackDeepLinkId || isLoading) return;

    const feedbackObjetivo = feedbacksFiltrados.find((feedback) => feedback.id === feedbackDeepLinkId);

    if (feedbackObjetivo) {
      if (deepLinkHandledRef.current === feedbackDeepLinkId) return;
      deepLinkHandledRef.current = feedbackDeepLinkId;
      deepLinkMissingRef.current = null;

      setHighlightedFeedbackId(feedbackDeepLinkId);

      requestAnimationFrame(() => {
        feedbackRowRefs.current[feedbackDeepLinkId]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });

      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedFeedbackId((current) => (current === feedbackDeepLinkId ? null : current));
      }, 4000);

      return;
    }

    if (feedbacksFiltrados.length > 0 && deepLinkMissingRef.current !== feedbackDeepLinkId) {
      deepLinkMissingRef.current = feedbackDeepLinkId;
      toast.info("El feedback enlazado no está visible con los registros cargados.");
    }
  }, [feedbackDeepLinkId, feedbacksFiltrados, isLoading]);

  const formatearFecha = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("es-ES", {
      timeZone: "America/Guayaquil",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const labelCalificacion = (valor) => {
    const r = Math.round(Number(valor));
    switch (r) {
      case 1:
        return "Muy sucio";
      case 2:
        return "Sucio";
      case 3:
        return "Aceptable";
      case 4:
        return "Limpio";
      case 5:
        return "Muy limpio";
      default:
        return "-";
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 bg-[#f4f8fb] min-h-full">
        <div className="relative overflow-hidden mb-6 rounded-[28px] bg-white border border-[#e6f0f8] shadow-xl shadow-[#0A2A47]/5 p-5 md:p-6">
          <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.12),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(10,42,71,0.08),_transparent_35%)]" />
          <div className="relative flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#0A2A47] tracking-tight">
                Reporte de Feedbacks
              </h1>
              <p className="mt-2 text-sm text-[#5b6b79] max-w-2xl">
                Analiza satisfacción, comentarios, evidencia y casos negativos vinculados a puntos de servicio.
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#dbe8f2] bg-white px-4 py-3 text-sm font-semibold text-[#0A2A47] transition hover:border-[#0A2A47] hover:bg-[#f8fbfd]"
            >
              <Calendar size={16} />
              Actualizar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="relative overflow-hidden bg-[#071f35] text-white rounded-2xl p-4 flex flex-col justify-between shadow-xl shadow-[#071f35]/15 border border-white/10 min-h-[118px]">
            <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.24),_transparent_38%)]" />
            <div className="relative flex items-start justify-between gap-3">
              <span className="text-sm text-white/70 font-medium">Total feedbacks</span>
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 text-[#b7f7ba] flex items-center justify-center">
                <Star size={20} />
              </div>
            </div>
            <div className="relative mt-4">
              <span className="text-3xl font-extrabold tracking-tight">
                {isLoading || isFetching ? "..." : stats.total}
              </span>
            </div>
          </div>

          <div className="bg-white/95 border border-[#e6f0f8] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Muy sucio (1)</p>
            <p className="text-2xl font-extrabold text-[#0A2A47] tracking-tight">{stats.counts[1] || 0}</p>
          </div>

          <div className="bg-white/95 border border-[#e6f0f8] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Sucio (2)</p>
            <p className="text-2xl font-extrabold text-[#0A2A47] tracking-tight">{stats.counts[2] || 0}</p>
          </div>

          <div className="bg-white/95 border border-[#e6f0f8] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Aceptable (3)</p>
            <p className="text-2xl font-extrabold text-[#0A2A47] tracking-tight">{stats.counts[3] || 0}</p>
          </div>

          <div className="bg-white/95 border border-[#e6f0f8] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">
              <span>Limpio (4)</span>
              <span>Muy limpio (5)</span>
            </div>
            <div className="flex justify-between items-end gap-4">
              <span className="text-2xl font-extrabold text-[#0A2A47] tracking-tight">{stats.counts[4] || 0}</span>
              <span className="text-2xl font-extrabold text-[#0A2A47] tracking-tight">{stats.counts[5] || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#e6f0f8] rounded-2xl p-4 mb-4 flex flex-col md:flex-row gap-3 items-center shadow-sm">
          <div className="relative w-full md:w-1/3">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7b8a97]" size={18} />
            <input
              type="text"
              className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] py-3 pl-10 pr-4 text-sm text-[#0A2A47] outline-none transition placeholder:text-[#8a99a8] focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
              placeholder="Filtrar por nombre de empresa"
              value={filtroEmpresa}
              onChange={(e) => setFiltroEmpresa(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-1/3">
            <span className="text-sm text-[#0A2A47] font-semibold whitespace-nowrap">
              Desde:
            </span>
            <input
              type="date"
              className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-sm text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-1/3">
            <span className="text-sm text-[#0A2A47] font-semibold whitespace-nowrap">
              Hasta:
            </span>
            <input
              type="date"
              className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-sm text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>
        </div>

        {/* Tabla de resultados */}
        <div className="max-h-[60vh] overflow-auto rounded-3xl border border-[#e6f0f8] bg-white shadow-sm">
          <table className="w-full text-left text-[#0A2A47]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-white/95 backdrop-blur text-[#0A2A47] border-b border-[#e6f0f8] text-sm">
                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Fecha</th>
                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Nombre</th>
                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Empresa</th>
                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Lugar evaluado</th>
                <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Calificación</th>
                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Comentario</th>
                <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Foto</th>
                <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Incidente</th>
              </tr>
            </thead>
            <tbody className="text-sm text-[#0A2A47]">
              {feedbacksFiltrados.map((f) => (
                (() => {
                  const esFeedbackNegativo = Number(f.calificacion) <= 2;
                  const incidenteAsociado = esFeedbackNegativo ? incidentesPorFeedbackId[f.id] : null;

                  return (
                <tr
                  key={f.id}
                  ref={(node) => {
                    if (node) {
                      feedbackRowRefs.current[f.id] = node;
                    }
                  }}
                  className={`transition-colors border-b border-[#edf3f8] hover:bg-[#fbfdff] ${
                    highlightedFeedbackId === f.id ? "bg-[#eef6ff] border-l-4 border-l-[#0A2A47]" : ""
                  }`}
                >
                  <td className="py-4 px-4 align-top">
                    {formatearFecha(f.creado_en)}
                  </td>
                  <td className="py-4 px-4 align-top">
                    {f.nombre && f.nombre.trim()
                      ? f.nombre
                      : "Anónimo"}
                  </td>
                  <td className="py-4 px-4 align-top">{f.empresa}</td>
                  <td className="py-4 px-4 align-top">{f.contexto || f.direccion || "-"}</td>
                  <td className="py-4 px-4 align-top text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">
                        {Number(f.calificacion).toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {labelCalificacion(f.calificacion)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 align-top max-w-xs">
                    <p className="line-clamp-3 break-words">
                      {f.comentario || "-"}
                    </p>
                  </td>
                  <td className="py-4 px-4 align-top text-center">
                    {f.foto ? (
                      <button
                        type="button"
                        onClick={() => setZoomUrl(f.foto)}
                        className="inline-flex flex-col items-center text-xs text-[#0A2A47] hover:text-[#123b63]"
                      >
                        <img
                          src={f.foto}
                          alt="Foto de feedback"
                          className="h-12 w-12 object-cover rounded-xl border border-[#e6f0f8] mb-1 shadow-sm"
                        />
                        <span className="flex items-center gap-1">
                          <ImageIcon size={12} />
                          Ver
                        </span>
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Sin foto</span>
                    )}
                  </td>
                  <td className="py-4 px-4 align-top text-center">
                    {incidenteAsociado ? (
                      <button
                        type="button"
                        onClick={() => window.location.assign(`/incidentes?feedback=${f.id}`)}
                        className="text-[#0A2A47] font-semibold hover:text-[#123b63] hover:underline"
                      >
                        Ver incidente
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                </tr>
                  );
                })()
              ))}

              {feedbacksFiltrados.length === 0 && !isLoading && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-4 text-center text-gray-500 text-sm"
                  >
                    No hay feedbacks que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              )}

              {isLoading && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-4 text-center text-gray-500 text-sm"
                  >
                    Cargando feedbacks...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal de zoom de foto */}
        {zoomUrl && (
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={() => setZoomUrl(null)}
          >
            <div
              className="bg-white p-5 rounded-[28px] max-w-md w-full border border-[#e6f0f8] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={zoomUrl}
                alt="Foto ampliada"
                className="w-full h-auto rounded-xl mb-3"
              />
              <button
                onClick={() => setZoomUrl(null)}
                className="w-full border border-[#dbe8f2] text-[#0A2A47] py-3 rounded-2xl hover:border-[#0A2A47] hover:bg-[#f8fbfd] text-sm font-semibold transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ReporteFeedback;

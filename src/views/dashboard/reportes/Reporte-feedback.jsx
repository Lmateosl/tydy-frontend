import React, { useMemo, useState } from "react";
import Layout from "../../../components/Layout";
import { useObtenerFeedbackUserQuery } from "../../../redux/api/listasApi";
import { Search, Calendar, Star, Image as ImageIcon } from "lucide-react";

const ReporteFeedback = () => {
  const {
    data: feedbacks = [],
    isLoading,
    isFetching,
    refetch,
  } = useObtenerFeedbackUserQuery();

  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [zoomUrl, setZoomUrl] = useState(null);

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

      if (fecha && fechaDesde) {
        const dDesde = new Date(`${fechaDesde}T00:00:00`);
        if (fecha < dDesde) fechaOk = false;
      }

      if (fecha && fechaHasta) {
        const dHasta = new Date(`${fechaHasta}T23:59:59`);
        if (fecha > dHasta) fechaOk = false;
      }

      return empresaOk && fechaOk;
    });
  }, [feedbacks, filtroEmpresa, fechaDesde, fechaHasta]);

  const formatearFecha = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString();
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
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <h1 className="text-3xl font-extrabold text-[#0A2A47]">
            Reporte de Feedbacks
          </h1>
          <button
            onClick={() => refetch()}
            className="text-sm px-3 py-1 border rounded-md text-[#0A2A47] hover:bg-gray-100 flex items-center gap-1"
          >
            <Calendar size={16} />
            Actualizar
          </button>
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-[#0A2A47] text-white rounded-xl p-4 flex flex-col justify-between">
            <span className="text-sm opacity-80">Total feedbacks</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-bold">
                {isLoading || isFetching ? "..." : stats.total}
              </span>
              <Star className="text-[#3BAE3D]" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Muy sucio (1)</p>
            <p className="text-2xl font-bold text-[#0A2A47]">
              {stats.counts[1] || 0}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Sucio (2)</p>
            <p className="text-2xl font-bold text-[#0A2A47]">
              {stats.counts[2] || 0}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Aceptable (3)</p>
            <p className="text-2xl font-bold text-[#0A2A47]">
              {stats.counts[3] || 0}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Limpio (4)</span>
              <span className="text-xs text-gray-500">Muy limpio (5)</span>
            </div>
            <div className="flex justify-between items-end gap-4 mt-1">
              <span className="text-2xl font-bold text-[#0A2A47]">
                {stats.counts[4] || 0}
              </span>
              <span className="text-2xl font-bold text-[#0A2A47]">
                {stats.counts[5] || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-col md:flex-row gap-3 items-center">
          <div className="flex items-center gap-2 w-full md:w-1/3">
            <Search className="text-gray-500" size={18} />
            <input
              type="text"
              className="border px-2 py-1 rounded-md w-full"
              placeholder="Filtrar por nombre de empresa"
              value={filtroEmpresa}
              onChange={(e) => setFiltroEmpresa(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-1/3">
            <span className="text-sm text-gray-600 whitespace-nowrap">
              Desde:
            </span>
            <input
              type="date"
              className="border px-2 py-1 rounded-md w-full"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-1/3">
            <span className="text-sm text-gray-600 whitespace-nowrap">
              Hasta:
            </span>
            <input
              type="date"
              className="border px-2 py-1 rounded-md w-full"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>
        </div>

        {/* Tabla de resultados */}
        <div className="max-h-[60vh] overflow-auto border rounded-xl bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#0A2A47] text-white text-sm">
                <th className="p-2">Fecha</th>
                <th className="p-2">Nombre</th>
                <th className="p-2">Empresa</th>
                <th className="p-2">Dirección</th>
                <th className="p-2 text-center">Calificación</th>
                <th className="p-2">Comentario</th>
                <th className="p-2 text-center">Foto</th>
              </tr>
            </thead>
            <tbody className="text-sm text-[#333333]">
              {feedbacksFiltrados.map((f) => (
                <tr
                  key={f.id}
                  className="border-t border-gray-200 hover:bg-gray-50"
                >
                  <td className="p-2 align-top">
                    {formatearFecha(f.creado_en)}
                  </td>
                  <td className="p-2 align-top">
                    {f.nombre && f.nombre.trim()
                      ? f.nombre
                      : "Anónimo"}
                  </td>
                  <td className="p-2 align-top">{f.empresa}</td>
                  <td className="p-2 align-top">{f.direccion}</td>
                  <td className="p-2 align-top text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">
                        {Number(f.calificacion).toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {labelCalificacion(f.calificacion)}
                      </span>
                    </div>
                  </td>
                  <td className="p-2 align-top max-w-xs">
                    <p className="line-clamp-3 break-words">
                      {f.comentario || "-"}
                    </p>
                  </td>
                  <td className="p-2 align-top text-center">
                    {f.foto ? (
                      <button
                        type="button"
                        onClick={() => setZoomUrl(f.foto)}
                        className="inline-flex flex-col items-center text-xs text-[#3BAE3D] hover:text-[#2c8c30]"
                      >
                        <img
                          src={f.foto}
                          alt="Foto de feedback"
                          className="h-12 w-12 object-cover rounded-md border mb-1"
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
                </tr>
              ))}

              {feedbacksFiltrados.length === 0 && !isLoading && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-4 text-center text-gray-500 text-sm"
                  >
                    No hay feedbacks que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              )}

              {isLoading && (
                <tr>
                  <td
                    colSpan={7}
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
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            onClick={() => setZoomUrl(null)}
          >
            <div
              className="bg-white p-4 rounded-xl max-w-md w-[90%]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={zoomUrl}
                alt="Foto ampliada"
                className="w-full h-auto rounded-md mb-3"
              />
              <button
                onClick={() => setZoomUrl(null)}
                className="w-full border py-1 rounded-md hover:bg-gray-100 text-sm"
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
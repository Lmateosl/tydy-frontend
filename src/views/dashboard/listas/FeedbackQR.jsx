import React, { useMemo, useState } from "react";
import Layout from "../../../components/Layout";
import {
  useCrearFeedbackListMutation,
  useObtenerFeedbackQrQuery,
  useEliminarFeedbackQrMutation,
  useActualizarFeedbackQrMutation,
} from "../../../redux/api/listasApi";
import {
  useObtenerEmpresasQuery,
  useObtenerLocacionesQuery,
  useObtenerAreasUsuarioQuery,
} from "../../../redux/api/empresasApi";
import { List, Plus, Search, Trash2, Pencil, Maximize2 } from "lucide-react";
import { toast } from "react-toastify";

const FeedbackQR = () => {
  const { data: feedbacks = [], isLoading, isFetching, refetch } = useObtenerFeedbackQrQuery();
  const { data: empresas = [] } = useObtenerEmpresasQuery();
  const { data: locaciones = [] } = useObtenerLocacionesQuery();
  const { data: areas = [] } = useObtenerAreasUsuarioQuery();
  const [crearFeedbackList] = useCrearFeedbackListMutation();
  const [eliminarFeedbackQr] = useEliminarFeedbackQrMutation();
  const [actualizarFeedbackQr] = useActualizarFeedbackQrMutation();

  const [filtro, setFiltro] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modoEditar, setModoEditar] = useState(false);
  const [feedbackSeleccionado, setFeedbackSeleccionado] = useState(null);
  const [form, setForm] = useState({
    empresa_id: "",
    locacion_id: "",
    area_id: "",
    contexto: "",
  });

  const [feedbackAEliminar, setFeedbackAEliminar] = useState(null);
  const [qrZoomUrl, setQrZoomUrl] = useState(null);

  const feedbacksFiltrados = useMemo(() => {
    return feedbacks.filter((f) =>
      f.nombre ? f.nombre.toLowerCase().includes(filtro.toLowerCase()) : false
    );
  }, [feedbacks, filtro]);

  const locacionesMap = useMemo(
    () => locaciones.reduce((acc, locacion) => {
      acc[locacion.id] = locacion;
      return acc;
    }, {}),
    [locaciones]
  );

  const areasMap = useMemo(
    () => areas.reduce((acc, area) => {
      acc[area.id] = area;
      return acc;
    }, {}),
    [areas]
  );

  const locacionesFiltradas = useMemo(() => {
    if (!form.empresa_id) return locaciones;
    return locaciones.filter((locacion) => locacion.empresa_id === form.empresa_id);
  }, [form.empresa_id, locaciones]);

  const areasFiltradas = useMemo(() => {
    if (!form.locacion_id) return [];
    return areas.filter((area) => area.locacion_id === form.locacion_id);
  }, [areas, form.locacion_id]);

  const totalFeedbacks = feedbacks.length;

  const handleCrearClick = () => {
    setModoEditar(false);
    setFeedbackSeleccionado(null);
    setForm({ empresa_id: "", locacion_id: "", area_id: "", contexto: "" });
    setModalOpen(true);
  };

  const handleEditarClick = (feedback) => {
    setModoEditar(true);
    setFeedbackSeleccionado(feedback);
    setForm({
      empresa_id: feedback.empresa_id || "",
      locacion_id: feedback.locacion_id || "",
      area_id: feedback.area_id || "",
      contexto: feedback.contexto || feedback.direccion || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!form.empresa_id) {
        toast.error("Debes seleccionar una empresa.");
        return;
      }

      if (modoEditar && feedbackSeleccionado) {
        await actualizarFeedbackQr({
          feedback_id: feedbackSeleccionado.id,
          datos: {
            empresa_id: form.empresa_id,
            locacion_id: form.locacion_id || null,
            area_id: form.area_id || null,
            contexto: form.contexto || null,
          },
        }).unwrap();
      } else {
        await crearFeedbackList({
          empresa_id: form.empresa_id,
          locacion_id: form.locacion_id || null,
          area_id: form.area_id || null,
          contexto: form.contexto || null,
        }).unwrap();
      }

      toast.success(
        modoEditar
          ? "QR de feedback actualizado correctamente."
          : "QR de feedback creado correctamente."
      );

      setModalOpen(false);
      setFeedbackSeleccionado(null);
      setForm({ empresa_id: "", locacion_id: "", area_id: "", contexto: "" });
      refetch();
    } catch (error) {
      console.error("Error guardando feedback QR:", error);
      toast.error("Ocurrió un error al guardar el QR de feedback.");
    }
  };

  const handleEliminar = async () => {
    if (!feedbackAEliminar) return;
    try {
      await eliminarFeedbackQr(feedbackAEliminar.id).unwrap();
      setFeedbackAEliminar(null);
      refetch();
      toast.success("QR de feedback eliminado correctamente.");
    } catch (error) {
      console.error("Error eliminando feedback QR:", error);
      toast.error("Ocurrió un error al eliminar el QR de feedback.");
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 bg-[#f4f8fb] min-h-full">
        <div className="relative overflow-hidden mb-6 rounded-[28px] bg-white border border-[#e6f0f8] shadow-xl shadow-[#0A2A47]/5 p-5 md:p-6">
          <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.12),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(10,42,71,0.08),_transparent_35%)]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#0A2A47] tracking-tight">
                QR de Feedback
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[#5b6b79]">
                Publica puntos de retroalimentación para clientes y visitantes con acceso rápido por QR.
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-2 rounded-2xl bg-[#f4f8fb] border border-[#e6f0f8] px-4 py-3 text-sm font-semibold text-[#0A2A47]">
              <List size={18} className="text-[#3BAE3D]" />
              Retroalimentación verificada
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative overflow-hidden bg-[#071f35] text-white rounded-2xl p-4 flex flex-col justify-between shadow-xl shadow-[#071f35]/15 border border-white/10 min-h-[118px]">
            <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.24),_transparent_38%)]" />
            <div className="relative flex items-start justify-between gap-3">
              <span className="text-sm text-white/70 font-medium">QR Feedbacks</span>
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 text-[#b7f7ba] flex items-center justify-center">
                <List size={20} />
              </div>
            </div>
            <div className="relative mt-4">
              <span className="text-3xl font-extrabold tracking-tight">
                {isLoading || isFetching ? "..." : totalFeedbacks}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#e6f0f8] rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7b8a97]" />
              <input
                className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] py-3 pl-10 pr-4 text-sm text-[#0A2A47] outline-none transition placeholder:text-[#8a99a8] focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                placeholder="Buscar por empresa"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>
            <button
              onClick={handleCrearClick}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#3BAE3D] text-white px-4 py-3 font-semibold shadow-lg shadow-[#3BAE3D]/20 transition hover:bg-[#2f9631]"
            >
              <Plus size={16} />
              Crear QR Feedback
            </button>
          </div>
        </div>

        <div className="overflow-auto rounded-3xl border border-[#e6f0f8] bg-white shadow-sm">
          <table className="w-full text-left text-sm text-[#0A2A47]">
            <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
              <tr className="border-b border-[#e6f0f8]">
                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">QR</th>
                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Empresa</th>
                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Locación</th>
                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Descripción</th>
                <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-[#0A2A47]">
              {feedbacksFiltrados.map((f) => (
                <tr
                  key={f.id}
                  className="border-b border-[#edf3f8] transition hover:bg-[#fbfdff]"
                >
                  <td className="px-4 py-4 align-top">
                    {f.url ? (
                      <button
                        onClick={() => setQrZoomUrl(f.url)}
                        className="inline-flex rounded-xl border border-[#dbe8f2] bg-white p-1.5 transition hover:border-[#0A2A47]"
                        title="Ampliar QR"
                      >
                        <img
                          src={f.url}
                          alt={f.nombre || "QR Feedback"}
                          className="h-10 w-10 rounded border border-[#e6f0f8]"
                        />
                      </button>
                    ) : (
                      <span className="text-[#7b8a97]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="font-semibold text-[#0A2A47]">{f.nombre || "-"}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="text-[#5b6b79]">{locacionesMap[f.locacion_id]?.nombre || "Sin locación"}</p>
                    {f.area_id ? (
                      <p className="mt-1 text-xs text-[#7b8a97]">
                        Área: {areasMap[f.area_id]?.nombre || "Área asignada"}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="max-w-md text-[#5b6b79]">{f.contexto || f.direccion || "-"}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditarClick(f)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#dbe8f2] bg-white text-[#0A2A47] transition hover:border-[#0A2A47] hover:bg-[#f8fbfd]"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setFeedbackAEliminar(f)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#f0d4d4] bg-[#fff7f7] text-red-500 transition hover:bg-red-50 hover:text-red-700"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {feedbacksFiltrados.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center text-[#7b8a97]">
                    No hay QR de feedback registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Crear / Editar */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 text-[#0A2A47] px-4">
            <div className="bg-white p-6 rounded-[28px] w-full max-w-md border border-[#e6f0f8] shadow-2xl">
              <h3 className="font-extrabold mb-5 text-2xl tracking-tight text-[#0A2A47]">
                {modoEditar ? "Editar QR Feedback" : "Crear QR Feedback"}
              </h3>

              <label className="block mb-2 text-sm font-semibold text-[#0A2A47]">
                Empresa <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 mb-4 text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                value={form.empresa_id}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    empresa_id: e.target.value,
                    locacion_id: "",
                    area_id: "",
                  }))
                }
              >
                <option value="">Selecciona una empresa</option>
                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nombre}
                  </option>
                ))}
              </select>

              <label className="block mb-2 text-sm font-semibold text-[#0A2A47]">
                Locación
              </label>
              <select
                className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 mb-4 text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                value={form.locacion_id}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    locacion_id: e.target.value,
                    area_id: "",
                  }))
                }
              >
                <option value="">Sin locación</option>
                {locacionesFiltradas.map((locacion) => (
                  <option key={locacion.id} value={locacion.id}>
                    {locacion.nombre}
                  </option>
                ))}
              </select>

              <label className="block mb-2 text-sm font-semibold text-[#0A2A47]">
                Área
              </label>
              <select
                className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 mb-4 text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                value={form.area_id}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, area_id: e.target.value }))
                }
                disabled={!form.locacion_id}
              >
                <option value="">{form.locacion_id ? "Sin área" : "Selecciona primero una locación"}</option>
                {areasFiltradas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.nombre}
                  </option>
                ))}
              </select>

              <label className="block mb-2 text-sm font-semibold text-[#0A2A47]">
                Descripción del punto de feedback
              </label>
              <textarea
                className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 mb-5 text-[#0A2A47] outline-none transition resize-none focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                rows={3}
                placeholder="Aula 204, Edificio B"
                value={form.contexto}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, contexto: e.target.value }))
                }
              />

              <div className="flex gap-2 flex-col md:flex-row">
                <button
                  onClick={handleSubmit}
                  className="bg-[#3BAE3D] text-white flex-1 py-3 rounded-2xl font-semibold shadow-lg shadow-[#3BAE3D]/20 transition hover:bg-[#2f9631]"
                >
                  {modoEditar ? "Actualizar" : "Crear"}
                </button>
                <button
                  onClick={() => {
                    setModalOpen(false);
                    setFeedbackSeleccionado(null);
                    setForm({ empresa_id: "", locacion_id: "", area_id: "", contexto: "" });
                  }}
                  className="border border-[#dbe8f2] text-[#0A2A47] flex-1 py-3 rounded-2xl font-semibold hover:border-[#0A2A47] hover:bg-[#f8fbfd] transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirmar Eliminación */}
        {feedbackAEliminar && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 text-[#0A2A47] px-4">
            <div className="bg-white p-6 rounded-[28px] w-full max-w-md text-center border border-[#e6f0f8] shadow-2xl">
              <h3 className="font-extrabold mb-4 text-2xl tracking-tight text-[#0A2A47]">
                Eliminar QR Feedback
              </h3>
              <p className="mb-5 text-[#5b6b79]">
                ¿Seguro que deseas eliminar este QR de feedback?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleEliminar}
                  className="bg-red-500 text-white flex-1 py-3 rounded-2xl font-semibold transition hover:bg-red-700"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => setFeedbackAEliminar(null)}
                  className="border border-[#dbe8f2] text-[#0A2A47] flex-1 py-3 rounded-2xl font-semibold hover:border-[#0A2A47] hover:bg-[#f8fbfd] transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Zoom QR */}
        {qrZoomUrl && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
            onClick={() => setQrZoomUrl(null)}
          >
            <div
              className="bg-white p-5 rounded-[28px] max-w-xs md:max-w-md border border-[#e6f0f8] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={qrZoomUrl}
                alt="QR ampliado"
                className="w-full h-auto rounded-xl"
              />
              <button
                onClick={() => window.open(qrZoomUrl, "_blank")}
                className="mt-4 text-sm text-[#3BAE3D] hover:text-[#2c8c30] flex items-center gap-1"
              >
                <Search size={14} />
                Abrir en nueva pestaña
              </button>
              <button
                onClick={() => setQrZoomUrl(null)}
                className="mt-3 w-full border border-[#dbe8f2] py-3 rounded-2xl font-semibold text-[#0A2A47] transition hover:border-[#0A2A47] hover:bg-[#f8fbfd]"
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

export default FeedbackQR;

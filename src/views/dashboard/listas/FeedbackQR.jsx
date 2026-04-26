import React, { useMemo, useState } from "react";
import Layout from "../../../components/Layout";
import {
  useCrearFeedbackListMutation,
  useObtenerFeedbackQrQuery,
  useEliminarFeedbackQrMutation,
  useActualizarFeedbackQrMutation,
} from "../../../redux/api/listasApi";
import { useObtenerEmpresasQuery } from "../../../redux/api/empresasApi";
import { List, Plus, Search, Trash2, Pencil, Maximize2 } from "lucide-react";
import { toast } from "react-toastify";

const FeedbackQR = () => {
  const { data: feedbacks = [], isLoading, isFetching, refetch } = useObtenerFeedbackQrQuery();
  const { data: empresas = [] } = useObtenerEmpresasQuery();
  const [crearFeedbackList] = useCrearFeedbackListMutation();
  const [eliminarFeedbackQr] = useEliminarFeedbackQrMutation();
  const [actualizarFeedbackQr] = useActualizarFeedbackQrMutation();

  const [filtro, setFiltro] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modoEditar, setModoEditar] = useState(false);
  const [feedbackSeleccionado, setFeedbackSeleccionado] = useState(null);
  const [form, setForm] = useState({
    empresa_id: "",
    contexto: "",
  });

  const [feedbackAEliminar, setFeedbackAEliminar] = useState(null);
  const [qrZoomUrl, setQrZoomUrl] = useState(null);

  const feedbacksFiltrados = useMemo(() => {
    return feedbacks.filter((f) =>
      f.nombre ? f.nombre.toLowerCase().includes(filtro.toLowerCase()) : false
    );
  }, [feedbacks, filtro]);

  const totalFeedbacks = feedbacks.length;

  const handleCrearClick = () => {
    setModoEditar(false);
    setFeedbackSeleccionado(null);
    setForm({ empresa_id: "", contexto: "" });
    setModalOpen(true);
  };

  const handleEditarClick = (feedback) => {
    setModoEditar(true);
    setFeedbackSeleccionado(feedback);
    setForm({
      empresa_id: feedback.empresa_id || "",
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
            contexto: form.contexto || null,
          },
        }).unwrap();
      } else {
        await crearFeedbackList({
          empresa_id: form.empresa_id,
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
      setForm({ empresa_id: "", contexto: "" });
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
      <div className="p-4">
        <h1 className="text-3xl font-extrabold text-[#0A2A47] mb-4">
          QR de Feedback
        </h1>

        {/* Tarjeta de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="bg-[#0A2A47] text-white rounded-xl p-4 flex flex-col justify-between shadow-sm md:col-span-1">
            <span className="text-sm opacity-80">QR Feedbacks</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-bold">
                {isLoading || isFetching ? "..." : totalFeedbacks}
              </span>
              <List className="text-[#3BAE3D]" />
            </div>
          </div>
        </div>

        {/* Filtro + botón crear */}
        <div className="flex mb-4 gap-2 flex-col md:flex-row">
          <input
            className="border border-[#0A2A47] px-3 py-2 flex-1 rounded-md w-full md:w-3/5 text-[#0A2A47] placeholder:text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
            placeholder="Buscar por empresa"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
          <button
            onClick={handleCrearClick}
            className="bg-[#0A2A47] text-white px-3 py-2 rounded flex items-center gap-1 w-full md:w-1/5 justify-center font-semibold shadow-sm hover:bg-[#123b63]"
          >
            <Plus size={16} />
            Crear QR Feedback
          </button>
        </div>

        {/* Tabla */}
        <div className="max-h-[55vh] overflow-auto rounded-xl border border-[#e6f0f8] shadow-sm">
          <table className="w-full text-center text-[#0A2A47]">
            <thead className="sticky top-0 left-0">
              <tr className="bg-white text-[#0A2A47] border-b border-[#e6f0f8] sticky top-0 left-0">
                <th className="py-2 px-3">QR</th>
                <th className="py-2 px-3">Empresa</th>
                <th className="py-2 px-3">Descripción</th>
                <th className="py-2 px-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-[#0A2A47]">
              {feedbacksFiltrados.map((f) => (
                <tr
                  key={f.id}
                  className="transition-colors hover:bg-[#e6f0f8] border-b border-[#e6f0f8]"
                >
                  <td className="py-2 px-3">
                    {f.url ? (
                      <button
                        onClick={() => setQrZoomUrl(f.url)}
                        className="flex flex-col items-center justify-center text-[#0A2A47] hover:text-[#123b63]"
                      >
                        <img
                          src={f.url}
                          alt={f.nombre || "QR Feedback"}
                          className="h-12 mx-auto rounded-md border"
                        />
                        <span className="flex items-center gap-1 text-xs mt-1">
                          <Maximize2 size={12} />
                          Ver
                        </span>
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-2 px-3">{f.nombre || "-"}</td>
                  <td className="py-2 px-3">{f.contexto || f.direccion || "-"}</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleEditarClick(f)}
                        className="rounded-full p-1 text-[#0A2A47] hover:bg-[#d6e6f5]"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setFeedbackAEliminar(f)}
                        className="rounded-full p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
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
                  <td colSpan={4} className="p-4 text-gray-500">
                    No hay QR de feedback registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Crear / Editar */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 text-[#0A2A47]">
            <div className="bg-white p-8 rounded-xl w-full max-w-md">
              <h3 className="font-bold mb-4 text-2xl text-[#0A2A47]">
                {modoEditar ? "Editar QR Feedback" : "Crear QR Feedback"}
              </h3>

              <label className="block mb-1 text-[#0A2A47]">
                Empresa <span className="text-red-500">*</span>
              </label>
              <select
                className="border w-full px-2 py-1 mb-3 rounded border-[#0A2A47]"
                value={form.empresa_id}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, empresa_id: e.target.value }))
                }
              >
                <option value="">Selecciona una empresa</option>
                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nombre}
                  </option>
                ))}
              </select>

              <label className="block mb-1 text-[#0A2A47]">
                Descripción del punto de feedback
              </label>
              <textarea
                className="border w-full px-2 py-1 mb-4 rounded border-[#0A2A47] resize-none"
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
                  className="bg-[#3BAE3D] text-white flex-1 py-1 rounded hover:bg-[#a0dea1]"
                >
                  {modoEditar ? "Actualizar" : "Crear"}
                </button>
                <button
                  onClick={() => {
                    setModalOpen(false);
                    setFeedbackSeleccionado(null);
                    setForm({ empresa_id: "", contexto: "" });
                  }}
                  className="border flex-1 py-1 rounded hover:bg-[#a0dea1]"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirmar Eliminación */}
        {feedbackAEliminar && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 text-[#0A2A47]">
            <div className="bg-white p-8 rounded-xl w-full max-w-md text-center">
              <h3 className="font-bold mb-4 text-2xl text-[#0A2A47]">
                Eliminar QR Feedback
              </h3>
              <p className="mb-4">
                ¿Seguro que deseas eliminar este QR de feedback?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleEliminar}
                  className="bg-red-500 text-white flex-1 py-1 rounded hover:bg-red-700"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => setFeedbackAEliminar(null)}
                  className="border flex-1 py-1 rounded hover:bg-[#a0dea1]"
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
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            onClick={() => setQrZoomUrl(null)}
          >
            <div
              className="bg-white p-4 rounded-xl max-w-xs md:max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={qrZoomUrl}
                alt="QR ampliado"
                className="w-full h-auto rounded-md"
              />
              <button
                onClick={() => window.open(qrZoomUrl, "_blank")}
                className="mt-3 text-sm text-[#3BAE3D] hover:text-[#2c8c30] flex items-center gap-1"
              >
                <Search size={14} />
                Abrir en nueva pestaña
              </button>
              <button
                onClick={() => setQrZoomUrl(null)}
                className="mt-2 w-full border py-1 rounded hover:bg-[#a0dea1]"
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

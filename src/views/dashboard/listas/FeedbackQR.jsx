import React, { useMemo, useState } from "react";
import Layout from "../../../components/Layout";
import {
  useCrearFeedbackListMutation,
  useObtenerFeedbackQrQuery,
  useEliminarFeedbackQrMutation,
  useActualizarFeedbackQrMutation,
} from "../../../redux/api/listasApi";
import { List, Plus, Search, Trash2, Pencil, Maximize2 } from "lucide-react";
import { toast } from "react-toastify";

const FeedbackQR = () => {
  const { data: feedbacks = [], isLoading, isFetching, refetch } = useObtenerFeedbackQrQuery();
  const [crearFeedbackList] = useCrearFeedbackListMutation();
  const [eliminarFeedbackQr] = useEliminarFeedbackQrMutation();
  const [actualizarFeedbackQr] = useActualizarFeedbackQrMutation();

  const [filtro, setFiltro] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modoEditar, setModoEditar] = useState(false);
  const [feedbackSeleccionado, setFeedbackSeleccionado] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    direccion: "",
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
    setForm({ nombre: "", direccion: "" });
    setModalOpen(true);
  };

  const handleEditarClick = (feedback) => {
    setModoEditar(true);
    setFeedbackSeleccionado(feedback);
    setForm({
      nombre: feedback.nombre || "",
      direccion: feedback.direccion || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!form.nombre || !form.direccion) {
        toast.error("Nombre y dirección son obligatorios.");
        return;
      }

      if (modoEditar && feedbackSeleccionado) {
        await actualizarFeedbackQr({
          feedback_id: feedbackSeleccionado.id,
          datos: {
            nombre: form.nombre,
            direccion: form.direccion,
          },
        }).unwrap();
      } else {
        await crearFeedbackList({
          nombre: form.nombre,
          direccion: form.direccion,
        }).unwrap();
      }

      toast.success(
        modoEditar
          ? "QR de feedback actualizado correctamente."
          : "QR de feedback creado correctamente."
      );

      setModalOpen(false);
      setFeedbackSeleccionado(null);
      setForm({ nombre: "", direccion: "" });
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

        {/* Resumen */}
        <div className="hidden md:flex justify-center bg-[#0A2A47] text-white p-4 rounded-xl gap-7 mb-8 !text-[18px]">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <List size={18} className="text-[#3BAE3D]" />
              <span className="font-bold">QR Feedbacks</span>
            </div>
            <span className="text-lg font-bold">
              {isLoading || isFetching ? "..." : totalFeedbacks}
            </span>
          </div>
        </div>

        {/* Filtro + botón crear */}
        <div className="flex mb-4 gap-2 flex-col md:flex-row">
          <input
            className="border px-2 py-1 flex-1 rounded-md w-full md:w-3/5"
            placeholder="Buscar por empresa"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
          <button
            onClick={handleCrearClick}
            className="bg-[#3BAE3D] text-white px-2 py-1 rounded flex items-center gap-1 w-full md:w-1/5 justify-center hover:bg-[#a0dea1]"
          >
            <Plus size={16} />
            Crear QR Feedback
          </button>
        </div>

        {/* Tabla */}
        <div className="max-h-[55vh] overflow-auto">
          <table className="w-full text-center border rounded-xl overflow-hidden">
            <thead className="sticky top-0 left-0">
              <tr className="bg-[#0A2A47] text-white sticky top-0 left-0">
                <th className="p-2">QR</th>
                <th className="p-2">Empresa</th>
                <th className="p-2">Dirección</th>
                <th className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-[#333333]">
              {feedbacksFiltrados.map((f) => (
                <tr
                  key={f.id}
                  className="hover:bg-gray-100 border-b-1 border-gray-200"
                >
                  <td className="p-2">
                    {f.url ? (
                      <button
                        onClick={() => setQrZoomUrl(f.url)}
                        className="flex flex-col items-center justify-center text-[#3BAE3D] hover:text-[#2c8c30]"
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
                  <td className="p-2">{f.nombre || "-"}</td>
                  <td className="p-2">{f.direccion || "-"}</td>
                  <td className="p-2">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleEditarClick(f)}
                        className="text-green-600 hover:text-green-800"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setFeedbackAEliminar(f)}
                        className="text-red-500 hover:text-red-700"
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
                Empresa / Nombre <span className="text-red-500">*</span>
              </label>
              <input
                className="border w-full px-2 py-1 mb-3 rounded border-[#0A2A47]"
                value={form.nombre}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nombre: e.target.value }))
                }
              />

              <label className="block mb-1 text-[#0A2A47]">
                Dirección <span className="text-red-500">*</span>
              </label>
              <input
                className="border w-full px-2 py-1 mb-4 rounded border-[#0A2A47]"
                value={form.direccion}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, direccion: e.target.value }))
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
                    setForm({ nombre: "", direccion: "" });
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
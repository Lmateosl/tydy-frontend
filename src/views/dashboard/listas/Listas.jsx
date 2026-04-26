import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import { useObtenerListasQuery, useCrearListaMutation, useEditarListaMutation, useEliminarListaMutation } from "../../../redux/api/listasApi";
import { useObtenerActividadesQuery, useObtenerCategoriasQuery } from "../../../redux/api/actividadesApi";
import { Search, Plus, List, ScanLine, ScanBarcode, Trash2 } from "lucide-react";
import Layout from "../../../components/Layout";

export default function ListasActividades() {
  const { data: listas = [], refetch } = useObtenerListasQuery();
  const { data: actividades = [] } = useObtenerActividadesQuery();
  const { data: categorias = [] } = useObtenerCategoriasQuery();
  const [crearLista] = useCrearListaMutation();
  const [editarLista] = useEditarListaMutation();
  const [eliminarLista] = useEliminarListaMutation();

  const [filtro, setFiltro] = useState("");
  const [ordenAsc, setOrdenAsc] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modoEditar, setModoEditar] = useState(false);
  const [listaSeleccionada, setListaSeleccionada] = useState(null);
  const [form, setForm] = useState({ nombre: "", qrin: true, code: false, qrout: false, codeout: false, actividad_ids: [], imagen: false });
  const [modalStep, setModalStep] = useState(1);
  const [actividadFiltro, setActividadFiltro] = useState("");
  const [listaAEliminar, setListaAEliminar] = useState(null);
  const [actividadFiltroCategoria, setActividadFiltroCategoria] = useState("");

  const listasFiltradas = useMemo(() => {
    return listas
      .filter((l) => l.nombre.toLowerCase().includes(filtro.toLowerCase()))
      .sort((a, b) => (ordenAsc ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre)));
  }, [listas, filtro, ordenAsc]);

  const totalQR = listas.filter((l) => l.qrin || l.qrout).length;
  const totalCodigos = listas.filter((l) => l.code || l.codeout).length;

  const handleSubmit = async () => {
    if (!form.nombre) return toast.error("El nombre es obligatorio");
    try {
      if (modoEditar) {
        if (confirm("Editar la lista afectará reportes antiguos. ¿Desea continuar?")) {
          await editarLista({ lista_id: listaSeleccionada.id, datos: form }).unwrap();
          toast.success("Lista actualizada");
        }
      } else {
        await crearLista(form).unwrap();
        toast.success("Lista creada");
      }
      refetch();
      setModalOpen(false);
      setForm({ nombre: "", qrin: true, code: false, qrout: true, codeout: false, actividad_ids: [], imagen: false });
      setModalStep(1);
      setActividadFiltro("");
    } catch (error) {
      toast.error(error?.data?.detail || "Error al guardar lista");
    }
  };

  const handleEliminar = async () => {
    try {
      await eliminarLista(listaAEliminar.id).unwrap();
      toast.success("Lista eliminada");
      refetch();
      setListaAEliminar(null);
    } catch (error) {
      toast.error(error?.data?.detail || "Error al eliminar lista");
    }
  };

  return (
    <Layout>
        <div className="p-4">
            <h1 className="text-3xl font-extrabold text-[#0A2A47] mb-4">Lista de actividades</h1>
            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              <div className="bg-[#0A2A47] text-white rounded-xl p-4 flex flex-col justify-between shadow-sm">
                <span className="text-sm opacity-80">Listas</span>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-3xl font-bold">{listas.length}</span>
                  <List className="text-[#3BAE3D]" />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">QR generados</p>
                  <ScanLine size={16} className="text-[#0A2A47]" />
                </div>
                <p className="text-2xl font-bold text-[#0A2A47]">
                  {totalQR}
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">Códigos generados</p>
                  <ScanBarcode size={16} className="text-[#0A2A47]" />
                </div>
                <p className="text-2xl font-bold text-[#0A2A47]">
                  {totalCodigos}
                </p>
              </div>
            </div>

            <div className="flex mb-4 gap-2 flex-col md:flex-row">
                <input className="border border-[#0A2A47] px-3 py-2 flex-1 rounded-md w-full md:w-3/5 text-[#0A2A47] placeholder:text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]" placeholder="Buscar lista" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
                <button 
                    onClick={() => { 
                        setModalOpen(true); 
                        setModoEditar(false); 
                        setForm({ nombre: "", qrin: true, code: false, qrout: true, codeout: false, actividad_ids: [], imagen: false }); 
                        setModalStep(1);
                        setActividadFiltro("");
                    }} 
                    className="bg-[#0A2A47] text-white px-3 py-2 rounded flex items-center gap-1 w-full md:w-1/5 justify-center font-semibold shadow-sm hover:bg-[#123b63]">
                    <Plus size={16} /> 
                    Crear Lista
                </button>
            </div>

            <div className="max-h-[55vh] overflow-auto rounded-xl border border-[#e6f0f8] shadow-sm">        
                <table className="w-full text-center text-[#0A2A47]">
                    <thead className="sticky top-0 left-0">
                        <tr className="bg-white text-[#0A2A47] border-b border-[#e6f0f8] sticky top-0 left-0">
                            <th onClick={() => setOrdenAsc(!ordenAsc)} className="cursor-pointer py-2 px-3">Nombre</th>
                            <th className="py-2 px-3">QR Inicio</th>
                            <th className="py-2 px-3">QR Finalizar</th>
                            <th className="py-2 px-3">Código Inicio</th>
                            <th className="py-2 px-3">Código Finalizar</th>
                            <th className="py-2 px-3">Actividades</th>
                            <th className="py-2 px-3">Imagen</th>
                            <th className="py-2 px-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="text-[#0A2A47]">
                    {listasFiltradas.map((l) => (
                        <tr key={l.id} className="transition-colors hover:bg-[#e6f0f8] border-b border-[#e6f0f8]">
                            <td className="py-2 px-3 font-medium">{l.nombre}</td>
                            <td className="py-2 px-3">
                              {l.qrin ? (
                                <div>
                                  <img src={l.qrin} alt="QR" className="h-8 mx-auto" />
                                  <button className="rounded-full p-1 text-[#0A2A47] hover:bg-[#d6e6f5] inline-flex" onClick={() => window.open(l.qrin)}><Search size={16} /></button>
                                </div>
                              ) : "-"}
                            </td>
                            <td className="py-2 px-3">
                              {l.qrout ? (
                                <div>
                                  <img src={l.qrout} alt="QR" className="h-8 mx-auto" />
                                  <button className="rounded-full p-1 text-[#0A2A47] hover:bg-[#d6e6f5] inline-flex" onClick={() => window.open(l.qrout)}><Search size={16} /></button>
                                </div>
                              ) : "-"}
                            </td>
                            <td className="py-2 px-3">{l.code || "-"}</td>
                            <td className="py-2 px-3">{l.codeout || "-"}</td>
                            <td className="text-sm py-2 px-3">
                              <ul className="list-disc list-inside text-left space-y-1">
                                {l.actividades.map(a => (
                                  <li key={a.id}>{a.nombre}</li>
                                ))}
                              </ul>
                            </td>
                            <td className="py-2 px-3">{l.imagen ? "Sí" : "No"}</td>
                            <td className="py-2 px-3">
                                {/*<button onClick={() => {
                                setListaSeleccionada(l);
                                setForm({
                                    nombre: l.nombre,
                                    qrin: l.qrin,
                                    code: l.code,
                                    qrout: l.qrout,
                                    codeout: l.codeout,
                                    // Map actividades to ids
                                    actividad_ids: Array.isArray(l.actividades) ? l.actividades.map(a => a.id) : [],
                                    imagen: l.imagen
                                });
                                setModalOpen(true);
                                setModoEditar(true);
                                setModalStep(1);
                                setActividadFiltro("");
                                }} className="text-green-500 mr-2"><Pencil size={16} /></button>*/}
                                <button onClick={() => setListaAEliminar(l)} className="rounded-full p-1 text-red-500 hover:bg-red-50 hover:text-red-700"><Trash2 size={16} /></button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {modalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 text-[#0A2A47] px-4">
                    <div className="bg-white p-5 rounded-xl w-full max-w-md border border-[#0A2A47] shadow-xl">
                        <h3 className="font-bold mb-4 text-xl text-[#0A2A47]">{modoEditar ? "Editar Lista" : "Crear Lista"}</h3>
                        {modalStep === 1 ? (
                          <>
                            <label className="block mb-1 text-[#0A2A47]">Nombre <span className="text-red-500">*</span></label>
                            <input className="border border-[#0A2A47] w-full px-3 py-2 mb-3 rounded-md text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />

                            <label className="block mb-1 text-[#0A2A47]">¿Cómo se debe iniciar esta Lista? <span className="text-red-500">*</span></label>
                            <div className="flex gap-2 mb-2">
                              <label><input type="radio" checked={form.qrin} onChange={() => setForm({ ...form, qrin: true, code: false })} /> QR</label>
                              <label><input type="radio" checked={form.code} onChange={() => setForm({ ...form, qrin: false, code: true })} /> Código</label>
                            </div>

                            <label className="block mb-1 text-[#0A2A47]">¿Cómo se debe finalizar esta Lista? <span className="text-red-500">*</span></label>
                            <div className="flex gap-2 mb-2">
                              <label><input type="radio" checked={form.qrout} onChange={() => setForm({ ...form, qrout: true, codeout: false })} /> QR</label>
                              <label><input type="radio" checked={form.codeout} onChange={() => setForm({ ...form, qrout: false, codeout: true })} /> Código</label>
                              <label><input type="radio" checked={!form.qrout && !form.codeout} onChange={() => setForm({ ...form, qrout: false, codeout: false })} /> Ninguno</label>
                            </div>

                            <label className="block mb-1 text-[#0A2A47]">¿Para finalizar necesita imagen? <span className="text-red-500">*</span></label>
                            <div className="flex gap-2 mb-4">
                              <label><input type="radio" checked={form.imagen === true} onChange={() => setForm({ ...form, imagen: true })} /> Sí</label>
                              <label><input type="radio" checked={form.imagen === false} onChange={() => setForm({ ...form, imagen: false })} /> No</label>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => setModalStep(2)}
                                className="bg-[#0A2A47] text-white flex-1 py-2 rounded font-semibold shadow-sm hover:bg-[#123b63]"
                              >
                                Continuar
                              </button>
                              <button
                                onClick={() => {
                                  setModalOpen(false);
                                  setModalStep(1);
                                  setActividadFiltro("");
                                }}
                                className="border border-[#0A2A47] text-[#0A2A47] flex-1 py-2 rounded font-semibold hover:bg-[#e6f0f8]"
                              >
                                Cerrar
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <label className="block mb-1 text-[#0A2A47]">Filtrar por categoría</label>
                            <select
                              className="border border-[#0A2A47] w-full px-3 py-2 mb-3 rounded-md text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
                              value={actividadFiltroCategoria}
                              onChange={e => setActividadFiltroCategoria(e.target.value)}
                            >
                              <option value="">Todas</option>
                              {categorias.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                              ))}
                            </select>
                            <label className="block mb-1 text-[#0A2A47]">Buscar actividad</label>
                            <input
                              className="border border-[#0A2A47] w-full px-3 py-2 mb-3 rounded-md text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
                              placeholder="Buscar por nombre"
                              value={actividadFiltro}
                              onChange={e => setActividadFiltro(e.target.value)}
                            />
                            <div className="overflow-auto max-h-52 mb-3 text-center rounded-xl border border-[#e6f0f8] shadow-sm">
                              <table className="w-full text-sm">
                                <thead className="bg-white text-[#0A2A47] border-b border-[#e6f0f8] sticky top-0 left-0">
                                  <tr>
                                    <th className="font-normal">Seleccionar</th>
                                    <th className="p-1 font-normal">Nombre</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {actividades
                                    .filter(a =>
                                      a.nombre.toLowerCase().includes(actividadFiltro.toLowerCase()) &&
                                      (actividadFiltroCategoria === "" || a.categoria_id === actividadFiltroCategoria)
                                    )
                                    .map(a => (
                                      <tr key={a.id} className="transition-colors border-b border-[#e6f0f8] hover:bg-[#e6f0f8]">
                                        <td className="flex justify-center p-1">
                                          <input
                                            type="checkbox"
                                            checked={form.actividad_ids.includes(a.id)}
                                            onChange={e => {
                                              if (e.target.checked) {
                                                setForm(f => ({
                                                  ...f,
                                                  actividad_ids: [...f.actividad_ids, a.id]
                                                }));
                                              } else {
                                                setForm(f => ({
                                                  ...f,
                                                  actividad_ids: f.actividad_ids.filter(id => id !== a.id)
                                                }));
                                              }
                                            }}
                                          />
                                        </td>
                                        <td className="p-1">{a.nombre}</td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                            <div className="flex gap-2 flex-col">
                              <button
                                onClick={handleSubmit}
                                className="bg-[#0A2A47] text-white flex-1 py-2 w-full rounded font-semibold shadow-sm hover:bg-[#123b63]"
                              >
                                {modoEditar ? "Actualizar" : "Crear Lista"}
                              </button>
                              <button
                                onClick={() => setModalStep(1)}
                                className="border border-[#0A2A47] text-[#0A2A47] flex-1 py-2 rounded font-semibold hover:bg-[#e6f0f8] w-full"
                              >
                                Volver
                              </button>
                              <button
                                onClick={() => {
                                  setModalOpen(false);
                                  setModalStep(1);
                                  setActividadFiltro("");
                                }}
                                className="border border-[#0A2A47] text-[#0A2A47] flex-1 py-2 rounded font-semibold hover:bg-[#e6f0f8] w-full"
                              >
                                Cerrar
                              </button>
                            </div>
                          </>
                        )}
                    </div>
                </div>
            )}
            {listaAEliminar && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 text-[#0A2A47] px-4">
                <div className="bg-white p-5 rounded-xl w-full max-w-md text-center border border-[#0A2A47] shadow-xl">
                  <h3 className="font-bold mb-4 text-2xl text-[#0A2A47]">Eliminar Lista</h3>
                  <p className="mb-4">Eliminar esta lista eliminará todos los reportes relacionados. ¿Desea continuar?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleEliminar}
                      className="bg-red-500 text-white flex-1 py-1 rounded hover:bg-red-700"
                    >
                      Eliminar
                    </button>
                    <button
                      onClick={() => setListaAEliminar(null)}
                      className="border border-[#0A2A47] text-[#0A2A47] flex-1 py-2 rounded font-semibold hover:bg-[#e6f0f8]"
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
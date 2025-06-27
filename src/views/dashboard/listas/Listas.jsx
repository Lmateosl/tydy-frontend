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
            <div className="hidden md:flex justify-center bg-[#0A2A47] text-white p-4 rounded-xl gap-7 mb-8 !text-[18px]">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2">
                    <List size={18} className="text-[#3BAE3D]" />
                    <span className="font-bold">Listas</span>
                  </div>
                  <span className="text-lg font-bold">{listas.length}</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2">
                    <ScanLine size={18} className="text-[#3BAE3D]" />
                    <span className="font-bold">QR Generados</span>
                  </div>
                  <span className="text-lg font-bold">{totalQR}</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2">
                    <ScanBarcode size={18} className="text-[#3BAE3D]" />
                    <span className="font-bold">Códigos Generados</span>
                  </div>
                  <span className="text-lg font-bold">{totalCodigos}</span>
                </div>
            </div>

            <div className="flex mb-4 gap-2 flex-col md:flex-row">
                <input className="border px-2 py-1 flex-1 rounded-md w-full md:w-3/5" placeholder="Buscar lista" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
                <button 
                    onClick={() => { 
                        setModalOpen(true); 
                        setModoEditar(false); 
                        setForm({ nombre: "", qrin: true, code: false, qrout: true, codeout: false, actividad_ids: [], imagen: false }); 
                        setModalStep(1);
                        setActividadFiltro("");
                    }} 
                    className="bg-[#3BAE3D] text-white px-2 py-1 rounded flex items-center gap-1 w-full md:w-1/5 justify-center hover:bg-[#a0dea1]"><Plus size={16} 
                /> 
                    Crear Lista
                </button>
            </div>

            <div className="max-h-[55vh] overflow-auto">        
                <table className="w-full text-center border rounded-xl overflow-hidden">
                    <thead className="sticky top-0 left-0">
                        <tr className="bg-[#0A2A47] text-white sticky top-0 left-0">
                            <th onClick={() => setOrdenAsc(!ordenAsc)} className="cursor-pointer p-2">Nombre</th>
                            <th>QR Inicio</th>
                            <th>QR Finalizar</th>
                            <th>Código Inicio</th>
                            <th>Código Finalizar</th>
                            <th>Actividades</th>
                            <th>Imagen</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="text-[#333333]">
                    {listasFiltradas.map((l) => (
                        <tr key={l.id} className="hover:bg-gray-100 border-b-1 border-gray-200">
                            <td className="p-4">{l.nombre}</td>
                            <td>{l.qrin ? (<div><img src={l.qrin} alt="QR" className="h-8 mx-auto" /><button className="text-green-500" onClick={() => window.open(l.qrin)}><Search size={16} /></button></div>) : "-"}</td>
                            <td>{l.qrout ? (<div><img src={l.qrout} alt="QR" className="h-8 mx-auto" /><button className="text-green-500" onClick={() => window.open(l.qrout)}><Search size={16} /></button></div>) : "-"}</td>
                            <td>{l.code || "-"}</td>
                            <td>{l.codeout || "-"}</td>
                            <td className="text-sm py-1">
                            <ul className="list-disc list-inside text-left">
                                {l.actividades.map(a => (
                                <li key={a.id}>{a.nombre}</li>
                                ))}
                            </ul>
                            </td>
                            <td>{l.imagen ? "Sí" : "No"}</td>
                            <td>
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
                                <button onClick={() => setListaAEliminar(l)} className="text-red-500"><Trash2 size={16} /></button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 text-[#0A2A47]">
                    <div className="bg-white p-8 rounded-xl w-full max-w-md">
                        <h3 className="font-bold mb-4 text-2xl text-[#0A2A47]">{modoEditar ? "Editar Lista" : "Crear Lista"}</h3>
                        {modalStep === 1 ? (
                          <>
                            <label className="block mb-1 text-[#0A2A47]">Nombre <span className="text-red-500">*</span></label>
                            <input className="border w-full px-2 py-1 mb-2 rounded border-[#0A2A47]" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />

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
                                className="bg-[#3BAE3D] text-white flex-1 py-1 rounded hover:bg-[#a0dea1]"
                              >
                                Continuar
                              </button>
                              <button
                                onClick={() => {
                                  setModalOpen(false);
                                  setModalStep(1);
                                  setActividadFiltro("");
                                }}
                                className="border flex-1 py-1 rounded hover:bg-[#a0dea1]"
                              >
                                Cerrar
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <label className="block mb-1 text-[#0A2A47]">Filtrar por categoría</label>
                            <select
                              className="border w-full px-2 py-1 mb-2 rounded border-[#0A2A47]"
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
                              className="border w-full px-2 py-1 mb-2 rounded border-[#0A2A47]"
                              placeholder="Buscar por nombre"
                              value={actividadFiltro}
                              onChange={e => setActividadFiltro(e.target.value)}
                            />
                            <div className="overflow-auto max-h-52 mb-2 text-center rounded-md">
                              <table className="w-full text-sm">
                                <thead className="bg-[#0A2A47] text-white sticky top-0 left-0">
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
                                      <tr key={a.id}>
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
                                className="bg-[#3BAE3D] text-white flex-1 py-1 w-full rounded hover:bg-[#a0dea1]"
                              >
                                {modoEditar ? "Actualizar" : "Crear Lista"}
                              </button>
                              <button
                                onClick={() => setModalStep(1)}
                                className="border flex-1 py-1 rounded hover:bg-[#a0dea1] w-full"
                              >
                                Volver
                              </button>
                              <button
                                onClick={() => {
                                  setModalOpen(false);
                                  setModalStep(1);
                                  setActividadFiltro("");
                                }}
                                className="border flex-1 py-1 rounded hover:bg-[#a0dea1] w-full"
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
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 text-[#0A2A47]">
                <div className="bg-white p-8 rounded-xl w-full max-w-md text-center">
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
                      className="border flex-1 py-1 rounded hover:bg-[#a0dea1]"
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
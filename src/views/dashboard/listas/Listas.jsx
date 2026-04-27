import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import { useObtenerListasQuery, useCrearListaMutation, useEditarListaMutation, useEliminarListaMutation } from "../../../redux/api/listasApi";
import { useObtenerActividadesQuery, useObtenerCategoriasQuery } from "../../../redux/api/actividadesApi";
import { Search, Plus, List, ScanLine, ScanBarcode, Trash2, ArrowUp, ArrowDown } from "lucide-react";
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
        <div className="p-4 md:p-6 bg-[#f4f8fb] min-h-full">
            <div className="relative overflow-hidden mb-6 rounded-[28px] bg-white border border-[#e6f0f8] shadow-xl shadow-[#0A2A47]/5 p-5 md:p-6">
              <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.12),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(10,42,71,0.08),_transparent_35%)]" />
              <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-[#0A2A47] tracking-tight">Listas de actividades</h1>
                  <p className="mt-2 text-sm text-[#5b6b79] max-w-2xl">
                    Configura flujos verificables con QR, códigos, evidencia y actividades asociadas.
                  </p>
                </div>
                <div className="hidden lg:flex items-center gap-2 rounded-2xl bg-[#f4f8fb] border border-[#e6f0f8] px-4 py-3 text-sm font-semibold text-[#0A2A47]">
                  <List size={18} className="text-[#3BAE3D]" />
                  Verificación operativa
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="relative overflow-hidden bg-[#071f35] text-white rounded-2xl p-4 flex flex-col justify-between shadow-xl shadow-[#071f35]/15 border border-white/10 min-h-[118px]">
                <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.24),_transparent_38%)]" />
                <div className="relative flex items-start justify-between gap-3">
                  <span className="text-sm text-white/70 font-medium">Listas</span>
                  <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 text-[#b7f7ba] flex items-center justify-center">
                    <List size={20} />
                  </div>
                </div>
                <div className="relative mt-4">
                  <span className="text-3xl font-extrabold tracking-tight">{listas.length}</span>
                </div>
              </div>

              <div className="bg-white/95 border border-[#e6f0f8] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">QR generados</p>
                  <div className="w-9 h-9 rounded-xl bg-[#f4f8fb] text-[#0A2A47] flex items-center justify-center border border-[#e6f0f8]">
                    <ScanLine size={16} />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-[#0A2A47] tracking-tight">{totalQR}</p>
              </div>

              <div className="bg-white/95 border border-[#e6f0f8] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Códigos generados</p>
                  <div className="w-9 h-9 rounded-xl bg-[#f4f8fb] text-[#0A2A47] flex items-center justify-center border border-[#e6f0f8]">
                    <ScanBarcode size={16} />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-[#0A2A47] tracking-tight">{totalCodigos}</p>
              </div>
            </div>

            <div className="bg-white border border-[#e6f0f8] rounded-2xl p-4 shadow-sm mb-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-1">
                  <div className="relative flex-1">
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7b8a97]" />
                    <input
                      className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] py-3 pl-10 pr-4 text-sm text-[#0A2A47] outline-none transition placeholder:text-[#8a99a8] focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                      placeholder="Buscar lista"
                      value={filtro}
                      onChange={(e) => setFiltro(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setOrdenAsc(!ordenAsc)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dbe8f2] bg-white px-4 py-3 text-sm font-semibold text-[#0A2A47] transition hover:border-[#0A2A47]"
                  >
                    Ordenar
                    {ordenAsc ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  </button>
                </div>

                <button 
                    onClick={() => { 
                        setModalOpen(true); 
                        setModoEditar(false); 
                        setForm({ nombre: "", qrin: true, code: false, qrout: true, codeout: false, actividad_ids: [], imagen: false }); 
                        setModalStep(1);
                        setActividadFiltro("");
                    }} 
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#3BAE3D] text-white px-4 py-3 font-semibold shadow-lg shadow-[#3BAE3D]/20 transition hover:bg-[#2f9631]">
                    <Plus size={16} /> 
                    Crear Lista
                </button>
              </div>
            </div>

            <div className="overflow-auto rounded-3xl border border-[#e6f0f8] bg-white shadow-sm">        
                <table className="w-full text-left text-sm text-[#0A2A47]">
                    <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                        <tr className="border-b border-[#e6f0f8]">
                            <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">QR</th>
                            <th onClick={() => setOrdenAsc(!ordenAsc)} className="cursor-pointer px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Nombre</th>
                            <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Inicio</th>
                            <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Finalización</th>
                            <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Actividades</th>
                            <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Imagen</th>
                            <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="text-[#0A2A47]">
                    {listasFiltradas.map((l) => (
                        <tr key={l.id} className="border-b border-[#edf3f8] transition hover:bg-[#fbfdff]">
                            <td className="px-4 py-4 align-top">
                              {l.qrin ? (
                                <button
                                  className="inline-flex rounded-xl border border-[#dbe8f2] bg-white p-1.5 transition hover:border-[#0A2A47]"
                                  onClick={() => window.open(l.qrin)}
                                  title="Abrir QR"
                                >
                                  <img src={l.qrin} alt="QR" className="h-8 w-8 rounded border border-[#e6f0f8]" />
                                </button>
                              ) : (
                                <span className="text-[#7b8a97]">-</span>
                              )}
                            </td>
                            <td className="px-4 py-4 align-top">
                              <div className="min-w-[180px]">
                                <p className="font-semibold text-[#0A2A47]">{l.nombre}</p>
                                <p className="mt-1 text-xs text-[#7b8a97]">
                                  {l.code || l.qrin ? "Inicio verificado" : "Sin inicio"} · {l.codeout || l.qrout ? "Cierre verificado" : "Sin cierre"}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-[#f4f8fb] border border-[#e6f0f8] px-2.5 py-1 text-xs font-medium text-[#0A2A47]">
                                    {l.qrin ? "QR" : l.code ? "Código" : "-"}
                                  </span>
                                  {l.code && (
                                    <span className="rounded-full bg-white border border-[#dbe8f2] px-2.5 py-1 text-xs text-[#5b6b79]">
                                      {l.code}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-[#f4f8fb] border border-[#e6f0f8] px-2.5 py-1 text-xs font-medium text-[#0A2A47]">
                                    {l.qrout ? "QR" : l.codeout ? "Código" : "Ninguno"}
                                  </span>
                                  {l.codeout && (
                                    <span className="rounded-full bg-white border border-[#dbe8f2] px-2.5 py-1 text-xs text-[#5b6b79]">
                                      {l.codeout}
                                    </span>
                                  )}
                                </div>
                                {l.qrout && (
                                  <button className="inline-flex items-center gap-2 rounded-xl border border-[#dbe8f2] bg-white px-3 py-2 text-xs font-medium text-[#0A2A47] transition hover:border-[#0A2A47]" onClick={() => window.open(l.qrout)}>
                                    <img src={l.qrout} alt="QR" className="h-7 w-7 rounded border border-[#e6f0f8]" />
                                    Ver QR
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <div className="flex max-w-xs flex-wrap gap-2">
                                {l.actividades.map(a => (
                                  <span key={a.id} className="rounded-full border border-[#dbe8f2] bg-[#f8fbfd] px-2.5 py-1 text-xs text-[#5b6b79]">
                                    {a.nombre}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium border ${
                                l.imagen
                                  ? "bg-[#effaf0] text-[#257a27] border-[#cfe9d1]"
                                  : "bg-[#f8fbfd] text-[#5b6b79] border-[#dbe8f2]"
                              }`}>
                                {l.imagen ? "Requerida" : "Opcional"}
                              </span>
                            </td>
                            <td className="px-4 py-4 align-top">
                                <div className="flex justify-end">
                                  <button onClick={() => setListaAEliminar(l)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#f0d4d4] bg-[#fff7f7] text-red-500 transition hover:bg-red-50 hover:text-red-700"><Trash2 size={16} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {modalOpen && (
                <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 text-[#0A2A47] px-4">
                    <div className="bg-white p-5 md:p-6 rounded-[28px] w-full max-w-md border border-[#e6f0f8] shadow-2xl">
                        <h3 className="font-extrabold mb-5 text-2xl tracking-tight text-[#0A2A47]">{modoEditar ? "Editar Lista" : "Crear Lista"}</h3>
                        {modalStep === 1 ? (
                          <>
                            <label className="block mb-2 text-sm font-semibold text-[#0A2A47]">Nombre <span className="text-red-500">*</span></label>
                            <input className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 mb-4 text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />

                            <label className="block mb-2 text-sm font-semibold text-[#0A2A47]">¿Cómo se debe iniciar esta Lista? <span className="text-red-500">*</span></label>
                            <div className="flex gap-4 mb-4 text-sm">
                              <label><input type="radio" checked={form.qrin} onChange={() => setForm({ ...form, qrin: true, code: false })} /> QR</label>
                              <label><input type="radio" checked={form.code} onChange={() => setForm({ ...form, qrin: false, code: true })} /> Código</label>
                            </div>

                            <label className="block mb-2 text-sm font-semibold text-[#0A2A47]">¿Cómo se debe finalizar esta Lista? <span className="text-red-500">*</span></label>
                            <div className="flex gap-4 mb-4 text-sm flex-wrap">
                              <label><input type="radio" checked={form.qrout} onChange={() => setForm({ ...form, qrout: true, codeout: false })} /> QR</label>
                              <label><input type="radio" checked={form.codeout} onChange={() => setForm({ ...form, qrout: false, codeout: true })} /> Código</label>
                              <label><input type="radio" checked={!form.qrout && !form.codeout} onChange={() => setForm({ ...form, qrout: false, codeout: false })} /> Ninguno</label>
                            </div>

                            <label className="block mb-2 text-sm font-semibold text-[#0A2A47]">¿Para finalizar necesita imagen? <span className="text-red-500">*</span></label>
                            <div className="flex gap-4 mb-5 text-sm">
                              <label><input type="radio" checked={form.imagen === true} onChange={() => setForm({ ...form, imagen: true })} /> Sí</label>
                              <label><input type="radio" checked={form.imagen === false} onChange={() => setForm({ ...form, imagen: false })} /> No</label>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => setModalStep(2)}
                                className="bg-[#071f35] text-white flex-1 py-3 rounded-2xl font-semibold shadow-lg shadow-[#071f35]/10 hover:bg-[#123b63] transition"
                              >
                                Continuar
                              </button>
                              <button
                                onClick={() => {
                                  setModalOpen(false);
                                  setModalStep(1);
                                  setActividadFiltro("");
                                }}
                                className="border border-[#dbe8f2] text-[#0A2A47] flex-1 py-3 rounded-2xl font-semibold hover:border-[#0A2A47] hover:bg-[#f8fbfd] transition"
                              >
                                Cerrar
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <label className="block mb-2 text-sm font-semibold text-[#0A2A47]">Filtrar por categoría</label>
                            <select
                              className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 mb-4 text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                              value={actividadFiltroCategoria}
                              onChange={e => setActividadFiltroCategoria(e.target.value)}
                            >
                              <option value="">Todas</option>
                              {categorias.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                              ))}
                            </select>
                            <label className="block mb-2 text-sm font-semibold text-[#0A2A47]">Buscar actividad</label>
                            <input
                              className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 mb-4 text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                              placeholder="Buscar por nombre"
                              value={actividadFiltro}
                              onChange={e => setActividadFiltro(e.target.value)}
                            />
                            <div className="overflow-auto max-h-52 mb-4 text-center rounded-2xl border border-[#e6f0f8] shadow-sm">
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
                                className="bg-[#071f35] text-white flex-1 py-3 w-full rounded-2xl font-semibold shadow-lg shadow-[#071f35]/10 hover:bg-[#123b63] transition"
                              >
                                {modoEditar ? "Actualizar" : "Crear Lista"}
                              </button>
                              <button
                                onClick={() => setModalStep(1)}
                                className="border border-[#dbe8f2] text-[#0A2A47] flex-1 py-3 rounded-2xl font-semibold hover:border-[#0A2A47] hover:bg-[#f8fbfd] transition w-full"
                              >
                                Volver
                              </button>
                              <button
                                onClick={() => {
                                  setModalOpen(false);
                                  setModalStep(1);
                                  setActividadFiltro("");
                                }}
                                className="border border-[#dbe8f2] text-[#0A2A47] flex-1 py-3 rounded-2xl font-semibold hover:border-[#0A2A47] hover:bg-[#f8fbfd] transition w-full"
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
              <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 text-[#0A2A47] px-4">
                <div className="bg-white p-5 md:p-6 rounded-[28px] w-full max-w-md text-center border border-[#e6f0f8] shadow-2xl">
                  <h3 className="font-extrabold mb-4 text-2xl tracking-tight text-[#0A2A47]">Eliminar Lista</h3>
                  <p className="mb-5 text-[#5b6b79]">Eliminar esta lista eliminará todos los reportes relacionados. ¿Desea continuar?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleEliminar}
                      className="bg-red-500 text-white flex-1 py-3 rounded-2xl font-semibold hover:bg-red-700 transition"
                    >
                      Eliminar
                    </button>
                    <button
                      onClick={() => setListaAEliminar(null)}
                      className="border border-[#dbe8f2] text-[#0A2A47] flex-1 py-3 rounded-2xl font-semibold hover:border-[#0A2A47] hover:bg-[#f8fbfd] transition"
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

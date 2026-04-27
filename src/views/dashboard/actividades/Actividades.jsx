import { useState, useMemo } from "react";
import Layout from "../../../components/Layout";
import { Layers3, ListTodo, Edit2, Plus, Search } from "lucide-react";
import { toast } from "react-toastify";
import {
  useObtenerCategoriasQuery,
  useCrearCategoriaMutation,
  useEditarCategoriaMutation,
  useEliminarCategoriaMutation,
  useObtenerActividadesQuery,
  useCrearActividadMutation,
  useEditarActividadMutation,
  useEliminarActividadMutation,
} from "../../../redux/api/actividadesApi";

export default function Actividades() {
  const { data: categorias = [], refetch: refetchCategorias } = useObtenerCategoriasQuery();
  const { data: actividades = [], refetch: refetchActividades } = useObtenerActividadesQuery();

  const [crearCategoria] = useCrearCategoriaMutation();
  const [editarCategoria] = useEditarCategoriaMutation();
  const [eliminarCategoria] = useEliminarCategoriaMutation();
  const [crearActividad] = useCrearActividadMutation();
  const [editarActividad] = useEditarActividadMutation();
  const [eliminarActividad] = useEliminarActividadMutation();

  const [nombreCategoria, setNombreCategoria] = useState("");
  const [editarCat, setEditarCat] = useState(null);
  const [nombreEditarCat, setNombreEditarCat] = useState("");

  const [nombreActividad, setNombreActividad] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [editarAct, setEditarAct] = useState(null);
  const [nombreEditarAct, setNombreEditarAct] = useState("");
  const [catEditarAct, setCatEditarAct] = useState("");

  // Nuevos estados para filtros y orden
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [ordenAscCat, setOrdenAscCat] = useState(true);
  const [filtroActividad, setFiltroActividad] = useState("");
  const [filtroCatActividad, setFiltroCatActividad] = useState("");
  const [ordenAscAct, setOrdenAscAct] = useState(true);

  const totalCategorias = categorias.length;
  const totalActividades = actividades.length;

  // Datos filtrados y ordenados para categorías
  const categoriasFiltradas = useMemo(() => {
    return categorias
      .filter(c => c.nombre.toLowerCase().includes(filtroCategoria.toLowerCase()))
      .sort((a, b) => ordenAscCat ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre));
  }, [categorias, filtroCategoria, ordenAscCat]);

  // Datos filtrados y ordenados para actividades
  const actividadesFiltradas = useMemo(() => {
    return actividades
      .filter(a => a.nombre.toLowerCase().includes(filtroActividad.toLowerCase()))
      .filter(a => !filtroCatActividad || a.categoria_id === filtroCatActividad)
      .sort((a, b) => ordenAscAct ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre));
  }, [actividades, filtroActividad, filtroCatActividad, ordenAscAct]);

  const handleCrearCategoria = async () => {
    if (!nombreCategoria) return toast.error("El nombre es obligatorio");
    try {
      await crearCategoria({ nombre: nombreCategoria }).unwrap();
      toast.success("Categoría creada");
      setNombreCategoria("");
      refetchCategorias();
    } catch {
      toast.error("Error al crear categoría");
    }
  };

  const handleActualizarCategoria = async () => {
    try {
      await editarCategoria({ categoria_id: editarCat.id, datos: { nombre: nombreEditarCat } }).unwrap();
      toast.success("Categoría actualizada");
      setEditarCat(null);
      refetchCategorias();
    } catch {
      toast.error("Error al actualizar categoría");
    }
  };

  const handleEliminarCategoria = async () => {
    try {
      await eliminarCategoria(editarCat.id).unwrap();
      toast.success("Categoría eliminada");
      setEditarCat(null);
      refetchCategorias();
    } catch(error) {
      toast.error(error?.data?.detail || "Error al eliminar categoría");
    }
  };

  const handleCrearActividad = async () => {
    if (!nombreActividad) return toast.error("El nombre es obligatorio");
    try {
      await crearActividad({
        nombre: nombreActividad,
        ...(categoriaSeleccionada && { categoria_id: categoriaSeleccionada }),
      }).unwrap();
      toast.success("Actividad creada");
      setNombreActividad("");
      setCategoriaSeleccionada("");
      refetchActividades();
    } catch(error) {
      toast.error(error?.data?.detail || "Error al crear actividad");
    }
  };

  const handleActualizarActividad = async () => {
    try {
      await editarActividad({
        actividad_id: editarAct.id,
        datos: {
          nombre: nombreEditarAct,
          categoria_id: catEditarAct || null,
        },
      }).unwrap();
      toast.success("Actividad actualizada");
      setEditarAct(null);
      refetchActividades();
    } catch {
      toast.error("Error al actualizar actividad");
    }
  };

  const handleEliminarActividad = async () => {
    try {
      await eliminarActividad(editarAct.id).unwrap();
      toast.success("Actividad eliminada");
      setEditarAct(null);
      refetchActividades();
    } catch(error) {
      toast.error(error?.data?.detail || "Error al eliminar actividad");
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 bg-[#f4f8fb] min-h-full">
        <div className="relative overflow-hidden mb-6 rounded-[28px] bg-white border border-[#e6f0f8] shadow-xl shadow-[#0A2A47]/5 p-5 md:p-6">
          <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.12),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(10,42,71,0.08),_transparent_35%)]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#0A2A47] tracking-tight">Actividades</h1>
              <p className="mt-2 text-sm text-[#5b6b79] max-w-2xl">
                Organiza categorías y actividades para estructurar checklists, tareas y ejecución operativa.
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-2 rounded-2xl bg-[#f4f8fb] border border-[#e6f0f8] px-4 py-3 text-sm font-semibold text-[#0A2A47]">
              <ListTodo size={18} className="text-[#3BAE3D]" />
              Catálogo operativo
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative overflow-hidden bg-[#071f35] text-white rounded-2xl p-4 flex flex-col justify-between shadow-xl shadow-[#071f35]/15 border border-white/10 min-h-[118px]">
            <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.24),_transparent_38%)]" />
            <div className="relative flex items-start justify-between gap-3">
              <span className="text-sm text-white/70 font-medium">Categorías</span>
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 text-[#b7f7ba] flex items-center justify-center">
                <Layers3 size={20} />
              </div>
            </div>
            <div className="relative mt-4">
              <span className="text-3xl font-extrabold tracking-tight">{totalCategorias}</span>
            </div>
          </div>

          <div className="bg-white/95 border border-[#e6f0f8] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Actividades</p>
              <div className="w-9 h-9 rounded-xl bg-[#f4f8fb] text-[#0A2A47] flex items-center justify-center border border-[#e6f0f8]">
                <ListTodo size={16} />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-[#0A2A47] tracking-tight">{totalActividades}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <section className="rounded-[28px] border border-[#e6f0f8] bg-white shadow-sm overflow-hidden">
            <div className="relative overflow-hidden border-b border-[#e6f0f8] px-5 py-5 md:px-6">
              <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.10),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(10,42,71,0.05),_transparent_40%)]" />
              <div className="relative flex flex-col gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold tracking-tight text-[#0A2A47]">Categorías</h2>
                    <Layers3 size={16} className="text-[#5b6b79]" />
                  </div>
                  <p className="mt-1 text-xs text-[#5b6b79]">Agrupa actividades por tipo de trabajo o proceso.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      value={nombreCategoria}
                      onChange={(e) => setNombreCategoria(e.target.value)}
                      placeholder="Nombre categoría"
                      className="flex-1 rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-sm text-[#0A2A47] placeholder:text-[#8a99a8] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                    />
                    <button onClick={handleCrearCategoria} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#071f35] text-white px-4 py-3 font-semibold shadow-lg shadow-[#071f35]/15 transition hover:bg-[#0A2A47]">
                      <Plus size={16} />
                      Crear
                    </button>
                  </div>
                  <div className="relative">
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7b8a97]" />
                    <input
                      value={filtroCategoria}
                      onChange={(e) => setFiltroCategoria(e.target.value)}
                      placeholder="Buscar categoría"
                      className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] py-3 pl-10 pr-4 text-sm text-[#0A2A47] placeholder:text-[#8a99a8] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="max-h-[28vh] overflow-auto px-5 py-5 md:px-6 md:py-6">
              <table className="w-full table-fixed text-left text-sm text-[#0A2A47]">
                <colgroup>
                  <col className="w-auto" />
                  <col className="w-[92px]" />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-[#e6f0f8]">
                  <tr>
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97] cursor-pointer" onClick={() => setOrdenAscCat(!ordenAscCat)}>Nombre</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Editar</th>
                  </tr>
                </thead>
                <tbody>
                  {categoriasFiltradas.map((c) => (
                    <tr key={c.id} className="border-b border-[#edf3f8] transition hover:bg-[#fbfdff]">
                      <td className="px-3 py-3 font-semibold">{c.nombre}</td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end">
                          <button
                            onClick={() => { setEditarCat(c); setNombreEditarCat(c.nombre); }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#dbe8f2] bg-white text-[#0A2A47] transition hover:border-[#0A2A47] hover:bg-[#f8fbfd]"
                            title="Editar categoría"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        {/* Modal editar categoría */}
        {editarCat && (
          <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/45 backdrop-blur-sm px-4">
            <div className="bg-white p-5 md:p-6 rounded-[28px] w-full max-w-md flex flex-col gap-3 border border-[#e6f0f8] shadow-2xl">
              <h3 className="text-2xl font-extrabold tracking-tight text-[#0A2A47]">Editar Categoría</h3>
              <input
                value={nombreEditarCat}
                onChange={(e) => setNombreEditarCat(e.target.value)}
                placeholder="Nombre"
                className="rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
              />
              <button onClick={handleActualizarCategoria} className="bg-[#071f35] text-white px-3 py-3 rounded-2xl font-semibold shadow-lg shadow-[#071f35]/10 hover:bg-[#123b63] transition">Actualizar</button>
              <button onClick={handleEliminarCategoria} className="border border-red-200 bg-red-50 text-red-500 px-3 py-3 rounded-2xl font-semibold hover:bg-red-100 transition">Eliminar</button>
              <button onClick={() => setEditarCat(null)} className="border border-[#dbe8f2] text-[#0A2A47] px-3 py-3 rounded-2xl font-semibold hover:border-[#0A2A47] hover:bg-[#f8fbfd] transition">Cerrar</button>
            </div>
          </div>
        )}

          <section className="rounded-[28px] border border-[#e6f0f8] bg-white shadow-sm overflow-hidden">
            <div className="relative overflow-hidden border-b border-[#e6f0f8] px-5 py-5 md:px-6">
              <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.10),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(10,42,71,0.05),_transparent_40%)]" />
              <div className="relative flex flex-col gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold tracking-tight text-[#0A2A47]">Actividades</h2>
                    <ListTodo size={16} className="text-[#5b6b79]" />
                  </div>
                  <p className="mt-1 text-xs text-[#5b6b79]">Define las tareas individuales que luego usarás en listas y checklists.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      value={nombreActividad}
                      onChange={(e) => setNombreActividad(e.target.value)}
                      placeholder="Nombre actividad"
                      className="flex-1 rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-sm text-[#0A2A47] placeholder:text-[#8a99a8] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                    />
                    <select
                      value={categoriaSeleccionada}
                      onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                      className="rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-sm text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                    >
                      <option value="">Sin categoría</option>
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                    <button onClick={handleCrearActividad} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#071f35] text-white px-4 py-3 font-semibold shadow-lg shadow-[#071f35]/15 transition hover:bg-[#0A2A47]">
                      <Plus size={16} />
                      Crear
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7b8a97]" />
                      <input
                        value={filtroActividad}
                        onChange={(e) => setFiltroActividad(e.target.value)}
                        placeholder="Buscar actividad"
                        className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] py-3 pl-10 pr-4 text-sm text-[#0A2A47] placeholder:text-[#8a99a8] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                      />
                    </div>
                    <select
                      value={filtroCatActividad}
                      onChange={(e) => setFiltroCatActividad(e.target.value)}
                      className="rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-sm text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                    >
                      <option value="">Todas las categorías</option>
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-h-[28vh] overflow-auto px-5 py-5 md:px-6 md:py-6">
              <table className="w-full text-left text-sm text-[#0A2A47]">
                <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-[#e6f0f8]">
                  <tr>
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97] cursor-pointer" onClick={() => setOrdenAscAct(!ordenAscAct)}>Nombre</th>
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Categoría</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Editar</th>
                  </tr>
                </thead>
                <tbody>
                  {actividadesFiltradas.map((a) => (
                    <tr key={a.id} className="border-b border-[#edf3f8] transition hover:bg-[#fbfdff]">
                      <td className="px-3 py-3 font-semibold">{a.nombre}</td>
                      <td className="px-3 py-3 text-[#5b6b79]">
                        {categorias.find((c) => c.id === a.categoria_id)?.nombre || "Sin categoría"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end">
                          <button
                            onClick={() => { setEditarAct(a); setNombreEditarAct(a.nombre); setCatEditarAct(a.categoria_id || ""); }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#dbe8f2] bg-white text-[#0A2A47] transition hover:border-[#0A2A47] hover:bg-[#f8fbfd]"
                            title="Editar actividad"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Modal editar actividad */}
        {editarAct && (
          <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/45 backdrop-blur-sm px-4">
            <div className="bg-white p-5 md:p-6 rounded-[28px] w-full max-w-md flex flex-col gap-3 border border-[#e6f0f8] shadow-2xl">
              <h3 className="text-2xl font-extrabold tracking-tight text-[#0A2A47]">Editar Actividad</h3>
              <input
                value={nombreEditarAct}
                onChange={(e) => setNombreEditarAct(e.target.value)}
                placeholder="Nombre"
                className="rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
              />
              <select
                value={catEditarAct}
                onChange={(e) => setCatEditarAct(e.target.value)}
                className="rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
              >
                <option value="">Sin categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              <button onClick={handleActualizarActividad} className="bg-[#071f35] text-white px-3 py-3 rounded-2xl font-semibold shadow-lg shadow-[#071f35]/10 hover:bg-[#123b63] transition">Actualizar</button>
              <button onClick={handleEliminarActividad} className="border border-red-200 bg-red-50 text-red-500 px-3 py-3 rounded-2xl font-semibold hover:bg-red-100 transition">Eliminar</button>
              <button onClick={() => setEditarAct(null)} className="border border-[#dbe8f2] text-[#0A2A47] px-3 py-3 rounded-2xl font-semibold hover:border-[#0A2A47] hover:bg-[#f8fbfd] transition">Cerrar</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

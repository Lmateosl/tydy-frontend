import { useState, useMemo } from "react";
import Layout from "../../../components/Layout";
import { Layers3, ListTodo, Edit2 } from "lucide-react";
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
      <div className="bg-white p-4">
        <h1 className="text-3xl font-extrabold text-[#0A2A47] mb-4">Actividades</h1>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <div className="bg-[#0A2A47] text-white rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <span className="text-sm opacity-80">Categorías</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-bold">{totalCategorias}</span>
              <Layers3 className="text-[#3BAE3D]" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500">Actividades</p>
              <ListTodo size={16} className="text-[#0A2A47]" />
            </div>
            <p className="text-2xl font-bold text-[#0A2A47]">
              {totalActividades}
            </p>
          </div>
        </div>

        {/* Crear categoría */}
        <h2 className="text-2xl text-[#0A2A47] font-bold mb-4">Categorias</h2>
        <div className="flex flex-col md:flex-row gap-2 mb-4 flex-wrap items-center">
          <input
            value={nombreCategoria}
            onChange={(e) => setNombreCategoria(e.target.value)}
            placeholder="Nombre categoría"
            className="border border-[#0A2A47] px-3 py-2 rounded-md w-full md:w-auto text-[#0A2A47] placeholder:text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
          />
          <button onClick={handleCrearCategoria} className="bg-[#0A2A47] text-white px-3 py-2 rounded font-semibold shadow-sm hover:bg-[#123b63] w-full md:w-auto">Crear Categoría</button>
          <input
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            placeholder="Buscar"
            className="border border-[#0A2A47] px-3 py-2 rounded-md ml-auto w-full md:w-auto text-[#0A2A47] placeholder:text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
          />
        </div>

        {/* Tabla categorías */}
        <div className="rounded-xl overflow-auto mb-6 border border-[#e6f0f8] shadow-sm max-h-[20vh]">
          <table className="w-full text-center text-[#0A2A47]">
            <thead className="bg-white text-[#0A2A47] border-b border-[#e6f0f8] sticky top-0">
              <tr>
                <th className="py-2 px-3 cursor-pointer" onClick={() => setOrdenAscCat(!ordenAscCat)}>Nombre</th>
                <th className="py-2 px-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categoriasFiltradas.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-[#e6f0f8] border-b border-[#e6f0f8]">
                  <td className="py-2 px-3 font-medium">{c.nombre}</td>
                  <td className="py-2 px-3">
                    <button
                      onClick={() => { setEditarCat(c); setNombreEditarCat(c.nombre); }}
                      className="rounded-full p-1 text-[#0A2A47] hover:bg-[#d6e6f5] inline-flex"
                      title="Editar categoría"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal editar categoría */}
        {editarCat && (
          <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 px-4">
            <div className="bg-white p-5 rounded-xl w-full max-w-md flex flex-col gap-3 border border-[#0A2A47] shadow-xl">
              <h3 className="text-xl font-bold text-[#0A2A47]">Editar Categoría</h3>
              <input
                value={nombreEditarCat}
                onChange={(e) => setNombreEditarCat(e.target.value)}
                placeholder="Nombre"
                className="border border-[#0A2A47] px-3 py-2 rounded-md text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
              />
              <button onClick={handleActualizarCategoria} className="bg-[#0A2A47] text-white px-3 py-2 rounded font-semibold shadow-sm hover:bg-[#123b63]">Actualizar</button>
              <button onClick={handleEliminarCategoria} className="border border-red-500 text-red-500 px-3 py-2 rounded font-semibold hover:bg-red-50">Eliminar</button>
              <button onClick={() => setEditarCat(null)} className="border border-[#0A2A47] text-[#0A2A47] px-3 py-2 rounded font-semibold hover:bg-[#e6f0f8]">Cerrar</button>
            </div>
          </div>
        )}

        {/* Crear actividad */}
        <h2 className="text-2xl text-[#0A2A47] font-bold mb-4">Actividades</h2>
        <div className="flex flex-col md:flex-row gap-2 mb-4 items-center flex-wrap">
          <input
            value={nombreActividad}
            onChange={(e) => setNombreActividad(e.target.value)}
            placeholder="Nombre actividad"
            className="border border-[#0A2A47] px-3 py-2 rounded-md w-full md:w-auto text-[#0A2A47] placeholder:text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
          />
          <select
            value={categoriaSeleccionada}
            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
            className="border border-[#0A2A47] px-3 py-2 rounded-md w-full md:w-auto text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
          >
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <button onClick={handleCrearActividad} className="bg-[#0A2A47] text-white px-3 py-2 rounded font-semibold shadow-sm hover:bg-[#123b63] w-full md:w-auto">Crear Actividad</button>
          <input
            value={filtroActividad}
            onChange={(e) => setFiltroActividad(e.target.value)}
            placeholder="Buscar actividad"
            className="border border-[#0A2A47] px-3 py-2 rounded-md ml-auto w-full md:w-auto text-[#0A2A47] placeholder:text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
          />
          <select
            value={filtroCatActividad}
            onChange={(e) => setFiltroCatActividad(e.target.value)}
            className="border border-[#0A2A47] px-3 py-2 rounded-md w-full md:w-auto text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        {/* Tabla actividades */}
        <div className="rounded-xl overflow-auto mb-6 border border-[#e6f0f8] shadow-sm max-h-[20vh]">
          <table className="w-full text-center text-[#0A2A47]">
            <thead className="bg-white text-[#0A2A47] border-b border-[#e6f0f8] sticky top-0 z-10">
              <tr>
                <th className="py-2 px-3 cursor-pointer" onClick={() => setOrdenAscAct(!ordenAscAct)}>Nombre</th>
                <th className="py-2 px-3">Categoría</th>
                <th className="py-2 px-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {actividadesFiltradas.map((a) => (
                <tr key={a.id} className="transition-colors hover:bg-[#e6f0f8] border-b border-[#e6f0f8]">
                  <td className="py-2 px-3 font-medium">{a.nombre}</td>
                  <td className="py-2 px-3">
                    {categorias.find((c) => c.id === a.categoria_id)?.nombre || "Sin categoría"}
                  </td>
                  <td className="py-2 px-3">
                    <button
                      onClick={() => { setEditarAct(a); setNombreEditarAct(a.nombre); setCatEditarAct(a.categoria_id || ""); }}
                      className="rounded-full p-1 text-[#0A2A47] hover:bg-[#d6e6f5] inline-flex"
                      title="Editar actividad"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal editar actividad */}
        {editarAct && (
          <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 px-4">
            <div className="bg-white p-5 rounded-xl w-full max-w-md flex flex-col gap-3 border border-[#0A2A47] shadow-xl">
              <h3 className="text-xl font-bold text-[#0A2A47]">Editar Actividad</h3>
              <input
                value={nombreEditarAct}
                onChange={(e) => setNombreEditarAct(e.target.value)}
                placeholder="Nombre"
                className="border border-[#0A2A47] px-3 py-2 rounded-md text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
              />
              <select
                value={catEditarAct}
                onChange={(e) => setCatEditarAct(e.target.value)}
                className="border border-[#0A2A47] px-3 py-2 rounded-md text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
              >
                <option value="">Sin categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              <button onClick={handleActualizarActividad} className="bg-[#0A2A47] text-white px-3 py-2 rounded font-semibold shadow-sm hover:bg-[#123b63]">Actualizar</button>
              <button onClick={handleEliminarActividad} className="border border-red-500 text-red-500 px-3 py-2 rounded font-semibold hover:bg-red-50">Eliminar</button>
              <button onClick={() => setEditarAct(null)} className="border border-[#0A2A47] text-[#0A2A47] px-3 py-2 rounded font-semibold hover:bg-[#e6f0f8]">Cerrar</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

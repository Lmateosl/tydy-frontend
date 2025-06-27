import { useState, useMemo } from "react";
import Layout from "../../../components/Layout";
import { Users, Layers3, ListTodo, Edit2, Trash2, Plus } from "lucide-react";
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

        {/* Barra de totales */}
        <div className="hidden md:flex text-white text-[18px] shadow rounded-xl p-4 mb-4 flex-wrap justify-center items-center bg-[#0A2A47] gap-7">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <Layers3 size={18} className="text-[#3BAE3D]" />
              <span className="font-bold">Categorías</span>
            </div>
            <span className="text-lg font-bold">{totalCategorias}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <ListTodo size={18} className="text-[#3BAE3D]" />
              <span className="font-bold">Actividades</span>
            </div>
            <span className="text-lg font-bold">{totalActividades}</span>
          </div>
        </div>

        {/* Crear categoría */}
        <h2 className="text-2xl text-[#0A2A47] font-bold mb-4">Categorias</h2>
        <div className="flex flex-col md:flex-row gap-2 mb-4 flex-wrap items-center">
          <input
            value={nombreCategoria}
            onChange={(e) => setNombreCategoria(e.target.value)}
            placeholder="Nombre categoría"
            className="border border-[#0A2A47] px-2 py-1 rounded w-full md:w-auto"
          />
          <button onClick={handleCrearCategoria} className="bg-[#3BAE3D] text-white px-3 py-1 rounded hover:bg-[#0A2A47] w-full md:w-auto">Crear Categoría</button>
          <input
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            placeholder="Buscar"
            className="border border-[#0A2A47] px-2 py-1 rounded ml-auto w-full md:w-auto"
          />
        </div>

        {/* Tabla categorías */}
        <div className="rounded-lg overflow-auto mb-6 border border-[#0A2A47] max-h-[20vh]">
          <table className="w-full text-center">
            <thead className="bg-[#0A2A47] text-white sticky">
              <tr>
                <th className="py-1 cursor-pointer" onClick={() => setOrdenAscCat(!ordenAscCat)}>Nombre</th>
                <th className="py-1">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categoriasFiltradas.map((c) => (
                <tr key={c.id} className="hover:bg-gray-100">
                  <td className="py-1">{c.nombre}</td>
                  <td>
                    <button onClick={() => { setEditarCat(c); setNombreEditarCat(c.nombre); }} className="text-[#3BAE3D] hover:underline">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal editar categoría */}
        {editarCat && (
          <div className="fixed inset-0 flex z-5 justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)'}}>
            <div className="bg-white p-4 rounded shadow w-72 flex flex-col gap-2">
              <h3 className="text-lg font-bold mb-2">Editar Categoría</h3>
              <input
                value={nombreEditarCat}
                onChange={(e) => setNombreEditarCat(e.target.value)}
                placeholder="Nombre"
                className="border border-[#0A2A47] px-2 py-1 rounded"
              />
              <button onClick={handleActualizarCategoria} className="bg-[#3BAE3D] text-white px-3 py-1 rounded hover:bg-[#0A2A47]">Actualizar</button>
              <button onClick={handleEliminarCategoria} className="border border-[#0A2A47] text-[#0A2A47] px-3 py-1 rounded hover:bg-gray-100">Eliminar</button>
              <button onClick={() => setEditarCat(null)} className="text-gray-500">Cerrar</button>
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
            className="border border-[#0A2A47] px-2 py-1 rounded w-full md:w-auto"
          />
          <select
            value={categoriaSeleccionada}
            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
            className="border border-[#0A2A47] px-2 py-1 rounded w-full md:w-auto"
          >
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <button onClick={handleCrearActividad} className="bg-[#3BAE3D] text-white px-3 py-1 rounded hover:bg-[#0A2A47] w-full md:w-auto">Crear Actividad</button>
          <input
            value={filtroActividad}
            onChange={(e) => setFiltroActividad(e.target.value)}
            placeholder="Buscar actividad"
            className="border border-[#0A2A47] px-2 py-1 rounded ml-auto w-full md:w-auto"
          />
          <select
            value={filtroCatActividad}
            onChange={(e) => setFiltroCatActividad(e.target.value)}
            className="border border-[#0A2A47] px-2 py-1 rounded w-full md:w-auto"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        {/* Tabla actividades */}
        <div className="rounded-lg overflow-auto mb-6 border border-[#0A2A47] max-h-[20vh]">
          <table className="w-full text-center">
            <thead className="bg-[#0A2A47] text-white sticky z-1">
              <tr>
                <th className="py-1 cursor-pointer" onClick={() => setOrdenAscAct(!ordenAscAct)}>Nombre</th>
                <th className="py-1">Categoría</th>
                <th className="py-1">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {actividadesFiltradas.map((a) => (
                <tr key={a.id} className="hover:bg-gray-100">
                  <td className="py-1">{a.nombre}</td>
                  <td className="py-1">
                    {categorias.find((c) => c.id === a.categoria_id)?.nombre || "Sin categoría"}
                  </td>
                  <td>
                    <button onClick={() => { setEditarAct(a); setNombreEditarAct(a.nombre); setCatEditarAct(a.categoria_id || ""); }} className="text-[#3BAE3D] hover:underline">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal editar actividad */}
        {editarAct && (
          <div className="fixed inset-0 z-5 flex justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)'}}>
            <div className="bg-white p-4 rounded shadow w-72 flex flex-col gap-2">
              <h3 className="text-lg font-bold mb-2">Editar Actividad</h3>
              <input
                value={nombreEditarAct}
                onChange={(e) => setNombreEditarAct(e.target.value)}
                placeholder="Nombre"
                className="border border-[#0A2A47] px-2 py-1 rounded"
              />
              <select
                value={catEditarAct}
                onChange={(e) => setCatEditarAct(e.target.value)}
                className="border border-[#0A2A47] px-2 py-1 rounded"
              >
                <option value="">Sin categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              <button onClick={handleActualizarActividad} className="bg-[#3BAE3D] text-white px-3 py-1 rounded hover:bg-[#0A2A47]">Actualizar</button>
              <button onClick={handleEliminarActividad} className="border border-[#0A2A47] text-[#0A2A47] px-3 py-1 rounded hover:bg-gray-100">Eliminar</button>
              <button onClick={() => setEditarAct(null)} className="text-gray-500">Cerrar</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

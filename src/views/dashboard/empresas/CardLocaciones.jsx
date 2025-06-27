import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import { Search, Trash, Edit, Plus, MapPin, ArrowUp, ArrowDown } from "lucide-react";
import {
  useCrearLocacionMutation,
  useEditarLocacionMutation,
  useEliminarLocacionMutation,
  useBuscarCoordenadasQuery,
} from "../../../redux/api/empresasApi";

export default function CardLocaciones({
  locaciones,
  empresaSeleccionada,
  locacionSeleccionada,
  setLocacionSeleccionada,
  refetch,
  refreshTotales
}) {
  const [filtro, setFiltro] = useState("");
  const [modoCrear, setModoCrear] = useState(false);
  const [ordenAsc, setOrdenAsc] = useState(true);
  const [form, setForm] = useState({ nombre: "", direccion: "", latitud: "", longitud: "" });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [buscar, setBuscar] = useState("");
  const [buscarActivo, setBuscarActivo] = useState(false);

  const { data: sugerencias = [] } = useBuscarCoordenadasQuery(buscar, { skip: !buscarActivo });

  const [crearLocacion] = useCrearLocacionMutation();
  const [editarLocacion] = useEditarLocacionMutation();
  const [eliminarLocacion] = useEliminarLocacionMutation();

  const locacionesFiltradas = useMemo(() => {
    const filtradas = locaciones.filter((l) => l.nombre.toLowerCase().includes(filtro.toLowerCase()));
    return filtradas.sort((a, b) => {
      if (ordenAsc) return a.nombre.localeCompare(b.nombre);
      return b.nombre.localeCompare(a.nombre);
    });
  }, [filtro, locaciones, ordenAsc]);

  // Eliminar seleccionar, usar directamente en onClick.
  const limpiar = () => {
    setForm({ nombre: "", direccion: "", latitud: "", longitud: "" });
    setLocacionSeleccionada(null);
    setModoCrear(true);
  };

  const handleSubmit = async () => {
    if (!form.nombre || !form.direccion || !form.latitud || !form.longitud) {
      toast.error("Completa todos los campos seleccionando una dirección válida");
      return;
    }
    try {
      if (modoCrear) {
        await crearLocacion({ ...form, empresa_id: empresaSeleccionada.id }).unwrap();
        toast.success("Locación creada");
        refetch();
        refreshTotales();
      } else {
        await editarLocacion({ locacion_id: locacionSeleccionada.id, datos: form }).unwrap();
        toast.success("Locación actualizada");
        refetch();
      }
      limpiar();
    } catch {
      toast.error("Error al guardar locación");
    }
  };

  const handleEliminar = async () => {
    try {
      await eliminarLocacion(locacionSeleccionada.id).unwrap();
      toast.success("Locación eliminada");
      refetch();
      refreshTotales();
      limpiar();
    } catch {
      toast.error("Error al eliminar locación");
    }
  };

  return (
    <div className="bg-[#0A2A47] p-4 rounded-xl flex flex-col h-full">
      <h2 className="text-xl font-bold text-white mb-4 text-center">Locaciones</h2>
      <div className="flex flex-col gap-0 mb-2">
        <button
          className="bg-[#3BAE3D] text-white w-full py-1 mb-2 rounded hover:bg-[#a0dea1]"
          onClick={limpiar}
        >
          <Plus size={16} className="inline mr-1" /> Crear Locación
        </button>
        <input
          type="text"
          placeholder="Buscar por nombre"
          className="border border-white bg-white rounded-md px-2 py-1 mb-2 w-full text-[#333333] placeholder:text-[#333333]"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-auto rounded-xl">
        <table className="w-full text-center text-white rounded-xl">
          <thead className="sticky top-0 bg-white text-[#0A2A47] rounded-2xl">
            <tr>
              <th className="py-1 cursor-pointer flex items-center justify-center" onClick={() => setOrdenAsc(!ordenAsc)}>Nombre {ordenAsc ? <ArrowUp size={14} /> : <ArrowDown size={14} />}</th>
              <th>Dirección</th>
            </tr>
          </thead>
          <tbody>
            {locacionesFiltradas.map((l) => (
              <tr
                key={l.id}
                className={`cursor-pointer hover:bg-[#a0dea1] p-4 ${
                  locacionSeleccionada?.id === l.id ? "bg-[#3BAE3D]" : ""
                }`}
                onClick={() => {
                  setLocacionSeleccionada(l);
                  setForm({
                    nombre: l.nombre,
                    direccion: l.direccion,
                    latitud: l.latitud,
                    longitud: l.longitud,
                  });
                  setModoCrear(false);
                }}
              >
                <td className="p-2">{l.nombre}</td>
                <td className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">{l.direccion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(modoCrear || locacionSeleccionada) && (
        <div className="pt-2">
          <h3 className="font-bold mb-4 text-[18px] text-white">{modoCrear ? "Crear Locación" : "Editar Locación"}</h3>

          <input
            type="text"
            placeholder="Nombre"
            className="border border-white bg-white rounded-md px-2 py-1 mb-2 w-full text-[#333333] placeholder:text-[#333333]"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />

          <button
            onClick={() => setModalAbierto(true)}
            className="border border-white text-white w-full px-4 py-1 rounded mb-2 hover:bg-[#a0dea1]"
          >
            Buscar Dirección
          </button>

          {form.direccion && (
            <div className="text-sm text-white mb-2">
              Dirección: {form.direccion}
            </div>
          )}

          <div className="flex gap-2 mt-4 flex-col">
            <button onClick={handleSubmit} className="bg-[#3BAE3D] text-white w-full px-4 py-1 rounded hover:bg-[#a0dea1]">
              {modoCrear ? "Crear" : "Actualizar"}
            </button>
            {!modoCrear && (
              <button onClick={handleEliminar} className="border border-white text-white px-4 py-1 rounded hover:bg-[#a0dea1]">
                Eliminar
              </button>
            )}
          </div>
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 flex justify-center items-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
          <div className="bg-white p-4 rounded shadow w-80 max-h-[80vh] flex flex-col gap-2">
            <h3 className="text-lg font-bold text-[#0A2A47]">Buscar Dirección</h3>
            <input
              type="text"
              placeholder="Ingrese dirección"
              className="border rounded-md px-2 py-1 text-[#333333] w-full bg-white placeholder-[#333333]"
              value={buscar}
              onChange={(e) => {setBuscar(e.target.value); setBuscarActivo(false);}}
            />
            {sugerencias.length > 0 && (
              <div className="border max-h-40 overflow-auto mt-2">
                {sugerencias.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2 border-b cursor-pointer hover:bg-gray-100 text-sm"
                    onClick={() => {
                      setForm({ ...form, direccion: s.display_name, latitud: s.latitud, longitud: s.longitud });
                      setModalAbierto(false);
                      setBuscar("");
                      setBuscarActivo(false);
                    }}
                  >
                    <MapPin className="inline mr-1" /> {s.display_name}
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setBuscarActivo(true);
                }}
                className="bg-[#0A2A47] text-white px-4 py-1 rounded-md hover:bg-[#a0dea1]"
              >
                Buscar
              </button>
              <button onClick={() => setModalAbierto(false)} className="text-[#0A2A47] font-semibold hover:bg-[#a0dea1] p-2 rounded-md">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

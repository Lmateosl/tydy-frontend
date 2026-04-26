import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Search, Edit, Plus, MapPin, ArrowUp, ArrowDown } from "lucide-react";
import {
  useCrearLocacionMutation,
  useEditarLocacionMutation,
  useEliminarLocacionMutation,
  useLazyBuscarCoordenadasQuery,
  useLazyBuscarDireccionPorCoordenadasQuery,
} from "../../../redux/api/empresasApi";
import LocationPickerMap from "./LocationPickerMap";

const LOCATIONIQ_LOGO_URL = "https://res.cloudinary.com/mr-builder/image/upload/v1777177394/62cba99749e8c69abccdde05_locationiq-logo_ld8imk.png";

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
  const [modalFormularioAbierto, setModalFormularioAbierto] = useState(false);
  const [ordenAsc, setOrdenAsc] = useState(true);
  const [form, setForm] = useState({ nombre: "", direccion: "", latitud: "", longitud: "", radio_verificacion_metros: 1000 });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [buscar, setBuscar] = useState("");
  const [sugerencias, setSugerencias] = useState([]);

  const [crearLocacion] = useCrearLocacionMutation();
  const [editarLocacion] = useEditarLocacionMutation();
  const [eliminarLocacion] = useEliminarLocacionMutation();
  const [buscarCoordenadas, { isFetching: buscandoDireccionTexto }] = useLazyBuscarCoordenadasQuery();
  const [buscarDireccionPorCoordenadas, { isFetching: buscandoDireccionMapa }] = useLazyBuscarDireccionPorCoordenadasQuery();

  const locacionesFiltradas = useMemo(() => {
    const filtradas = locaciones.filter((l) => l.nombre.toLowerCase().includes(filtro.toLowerCase()));
    return filtradas.sort((a, b) => {
      if (ordenAsc) return a.nombre.localeCompare(b.nombre);
      return b.nombre.localeCompare(a.nombre);
    });
  }, [filtro, locaciones, ordenAsc]);

  const resetForm = () => {
    setForm({ nombre: "", direccion: "", latitud: "", longitud: "", radio_verificacion_metros: 1000 });
  };

  const abrirCrear = () => {
    resetForm();
    setLocacionSeleccionada(null);
    setModoCrear(true);
    setModalFormularioAbierto(true);
  };

  const abrirEditar = (locacion) => {
    setLocacionSeleccionada(locacion);
    setForm({
      nombre: locacion.nombre,
      direccion: locacion.direccion,
      latitud: locacion.latitud,
      longitud: locacion.longitud,
      radio_verificacion_metros: locacion.radio_verificacion_metros || 1000,
    });
    setModoCrear(false);
    setModalFormularioAbierto(true);
  };

  const cerrarFormulario = () => {
    setModoCrear(false);
    setModalFormularioAbierto(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!form.nombre || !form.direccion || !form.latitud || !form.longitud) {
      toast.error("Completa todos los campos seleccionando una dirección válida");
      return;
    }
    if (!form.radio_verificacion_metros || Number(form.radio_verificacion_metros) <= 0) {
      toast.error("El radio de verificación debe ser mayor a 0");
      return;
    }
    try {
      if (modoCrear) {
        await crearLocacion({
          ...form,
          radio_verificacion_metros: Number(form.radio_verificacion_metros),
          empresa_id: empresaSeleccionada.id,
        }).unwrap();
        toast.success("Locación creada");
        refetch();
        refreshTotales();
      } else {
        await editarLocacion({
          locacion_id: locacionSeleccionada.id,
          datos: {
            ...form,
            radio_verificacion_metros: Number(form.radio_verificacion_metros),
          },
        }).unwrap();
        toast.success("Locación actualizada");
        refetch();
      }
      cerrarFormulario();
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
      setLocacionSeleccionada(null);
      cerrarFormulario();
    } catch {
      toast.error("Error al eliminar locación");
    }
  };

  const actualizarPuntoMapa = useCallback((latitud, longitud, direccion) => {
    const latNumber = Number(latitud);
    const lngNumber = Number(longitud);
    const lat = Number(latNumber.toFixed(6));
    const lng = Number(lngNumber.toFixed(6));

    setForm((prev) => ({
      ...prev,
      latitud: lat,
      longitud: lng,
      direccion: direccion || prev.direccion || `Punto seleccionado (${lat}, ${lng})`,
    }));

    return { lat, lng };
  }, []);

  const seleccionarPuntoMapa = useCallback(async (latitud, longitud) => {
    const { lat, lng } = actualizarPuntoMapa(latitud, longitud);

    try {
      const resultado = await buscarDireccionPorCoordenadas({
        latitud: lat,
        longitud: lng,
      }).unwrap();

      setForm((prev) => ({
        ...prev,
        latitud: resultado.latitud || lat,
        longitud: resultado.longitud || lng,
        direccion: resultado.display_name || prev.direccion,
      }));
    } catch {
      toast.info("Punto seleccionado. No se pudo obtener una dirección automática.");
    }
  }, [actualizarPuntoMapa, buscarDireccionPorCoordenadas]);

  const buscarDireccion = async () => {
    if (!buscar.trim()) {
      toast.error("Ingresa una dirección para buscar.");
      return;
    }

    try {
      const resultados = await buscarCoordenadas(buscar.trim()).unwrap();
      setSugerencias(resultados);
      if (!resultados.length) {
        toast.info("No se encontraron opciones para esa dirección.");
      }
    } catch {
      setSugerencias([]);
      toast.error("No se encontraron opciones para esa dirección.");
    }
  };

  useEffect(() => {
    if (!modalAbierto || form.latitud || form.longitud) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        seleccionarPuntoMapa(position.coords.latitude, position.coords.longitude);
      },
      () => {
        toast.info("No se pudo obtener tu ubicación actual. Puedes buscar o seleccionar el punto en el mapa.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [form.latitud, form.longitud, modalAbierto, seleccionarPuntoMapa]);

  return (
    <div className="bg-white border border-[#0A2A47] p-4 rounded-xl flex flex-col h-full">
      <h2 className="text-xl font-bold text-[#0A2A47] mb-4 text-center">Locaciones</h2>
      <div className="flex flex-col gap-0 mb-2">
        <button
          className="bg-[#0A2A47] text-white w-full py-1 mb-2 rounded font-semibold shadow-sm hover:bg-[#123b63]"
          onClick={abrirCrear}
        >
          <Plus size={16} className="inline mr-1" /> Crear Locación
        </button>
        <input
          type="text"
          placeholder="Buscar por nombre"
          className="border border-[#0A2A47] bg-white rounded-md px-2 py-1 mb-2 w-full text-[#0A2A47] placeholder:text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-[#e6f0f8]">
        <table className="w-full text-center text-[#0A2A47]">
          <thead className="sticky top-0 bg-white text-[#0A2A47] border-b border-[#e6f0f8]">
            <tr>
              <th className="py-2 px-3 cursor-pointer flex items-center justify-center" onClick={() => setOrdenAsc(!ordenAsc)}>Nombre {ordenAsc ? <ArrowUp size={14} /> : <ArrowDown size={14} />}</th>
              <th className="py-2 px-3">Dirección</th>
            </tr>
          </thead>
          <tbody>
            {locacionesFiltradas.map((l) => (
              <tr
                key={l.id}
                className={`cursor-pointer transition-colors border-b border-[#e6f0f8] hover:bg-[#e6f0f8] ${
                  locacionSeleccionada?.id === l.id ? "bg-[#d6e6f5] border-l-4 border-[#0A2A47]" : ""
                }`}
                onClick={() => {
                  setLocacionSeleccionada(l);
                  setModoCrear(false);
                  setModalFormularioAbierto(false);
                }}
              >
                <td className="py-2 px-3">
                  <div className="flex items-center justify-center gap-2">
                    <span>{l.nombre}</span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        abrirEditar(l);
                      }}
                      className="rounded-full p-1 text-[#0A2A47] hover:bg-[#d6e6f5]"
                      title="Editar locación"
                    >
                      <Edit size={14} />
                    </button>
                  </div>
                </td>
                <td className="py-2 px-3 max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">{l.direccion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalFormularioAbierto && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white border border-[#0A2A47] shadow-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[18px] text-[#0A2A47]">{modoCrear ? "Crear Locación" : "Editar Locación"}</h3>
              <button
                type="button"
                onClick={cerrarFormulario}
                className="text-[#0A2A47] hover:bg-[#e6f0f8] rounded-full px-2 py-1 font-bold"
              >
                ×
              </button>
            </div>

            <input
              type="text"
              placeholder="Nombre"
              className="border border-[#0A2A47] bg-white rounded-md px-2 py-1 mb-2 w-full text-[#0A2A47] placeholder:text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />

            <button
              onClick={() => setModalAbierto(true)}
              className="border border-[#0A2A47] text-[#0A2A47] w-full px-4 py-1 rounded mb-2 font-semibold hover:bg-[#e6f0f8]"
            >
              Buscar Dirección
            </button>

            {form.direccion && (
              <div className="text-sm text-[#0A2A47] mb-2">
                Dirección: {form.direccion}
              </div>
            )}

            <label className="block text-sm text-[#0A2A47] mb-1">Radio de verificación (metros)</label>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="1000"
              className="border border-[#0A2A47] bg-white rounded-md px-2 py-1 mb-2 w-full text-[#0A2A47] placeholder:text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
              value={form.radio_verificacion_metros}
              onChange={(e) => setForm({ ...form, radio_verificacion_metros: e.target.value })}
            />

            <div className="flex gap-2 mt-4 flex-col">
              <button onClick={handleSubmit} className="bg-[#0A2A47] text-white w-full px-4 py-1 rounded font-semibold shadow-sm hover:bg-[#123b63]">
                {modoCrear ? "Crear" : "Actualizar"}
              </button>
              {!modoCrear && (
                <button onClick={handleEliminar} className="border border-[#0A2A47] text-[#0A2A47] px-4 py-1 rounded font-semibold hover:bg-[#e6f0f8]">
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 flex justify-center items-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}>
          <div className="bg-white p-4 rounded shadow w-[94vw] max-w-3xl max-h-[90vh] overflow-auto flex flex-col gap-3">
            <h3 className="text-lg font-bold text-[#0A2A47]">Seleccionar ubicación</h3>
            <a
              href="https://locationiq.com/"
              target="_blank"
              rel="noreferrer"
              className="flex w-fit items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
            >
              <span>Search by</span>
              <img src={LOCATIONIQ_LOGO_URL} alt="LocationIQ" className="h-4 w-auto" />
            </a>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ingrese dirección"
                className="border border-[#0A2A47] rounded-md px-2 py-1 text-[#0A2A47] w-full bg-white placeholder:text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    buscarDireccion();
                  }
                }}
              />
              <button
                onClick={buscarDireccion}
                disabled={buscandoDireccionTexto}
                className={`bg-[#0A2A47] text-white px-4 py-1 rounded-md flex items-center gap-1 ${
                  buscandoDireccionTexto ? "opacity-60 cursor-not-allowed" : "hover:bg-[#123b63]"
                }`}
              >
                <Search size={16} />
                {buscandoDireccionTexto ? "Buscando" : "Buscar"}
              </button>
            </div>
            {sugerencias.length > 0 && (
              <div className="border max-h-40 overflow-auto mt-2">
                {sugerencias.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2 border-b cursor-pointer hover:bg-gray-100 text-sm"
                    onClick={() => {
                      actualizarPuntoMapa(s.latitud, s.longitud, s.display_name);
                    }}
                  >
                    <MapPin className="inline mr-1" /> {s.display_name}
                  </div>
                ))}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-sm font-semibold text-[#0A2A47]">O selecciona el punto exacto en el mapa</p>
                {buscandoDireccionMapa && (
                  <span className="text-xs text-gray-500">Buscando dirección...</span>
                )}
              </div>
              <LocationPickerMap
                latitud={form.latitud}
                longitud={form.longitud}
                onSelect={seleccionarPuntoMapa}
              />
              {form.latitud && form.longitud && (
                <p className="mt-2 text-xs text-gray-600">
                  Coordenadas seleccionadas: {form.latitud}, {form.longitud}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  if (!form.latitud || !form.longitud) {
                    toast.error("Selecciona una dirección o un punto en el mapa.");
                    return;
                  }
                  setModalAbierto(false);
                  setBuscar("");
                  setSugerencias([]);
                }}
                className="bg-[#0A2A47] text-white px-4 py-1 rounded-md font-semibold shadow-sm hover:bg-[#123b63]"
              >
                Usar ubicación
              </button>
              <button onClick={() => setModalAbierto(false)} className="border border-[#0A2A47] text-[#0A2A47] font-semibold hover:bg-[#e6f0f8] px-4 py-1 rounded-md">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

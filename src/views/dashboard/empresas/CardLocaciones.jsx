import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  ArrowDown,
  ArrowUp,
  Edit,
  MapPin,
  Navigation,
  Plus,
  Radar,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  useAsignarSupervisorLocacionMutation,
  useCrearLocacionMutation,
  useEditarLocacionMutation,
  useEliminarLocacionMutation,
  useQuitarSupervisorLocacionMutation,
  useLazyBuscarCoordenadasQuery,
  useLazyBuscarDireccionPorCoordenadasQuery,
} from "../../../redux/api/empresasApi";
import { useObtenerUsuariosQuery } from "../../../redux/api/userApi";
import LocationPickerMap from "./LocationPickerMap";

const LOCATIONIQ_LOGO_URL = "https://res.cloudinary.com/mr-builder/image/upload/v1777177394/62cba99749e8c69abccdde05_locationiq-logo_ld8imk.png";

export default function CardLocaciones({
  locaciones,
  empresaSeleccionada,
  locacionSeleccionada,
  setLocacionSeleccionada,
  refetch,
  refreshTotales,
}) {
  const [filtro, setFiltro] = useState("");
  const [modoCrear, setModoCrear] = useState(false);
  const [modalFormularioAbierto, setModalFormularioAbierto] = useState(false);
  const [ordenAsc, setOrdenAsc] = useState(true);
  const [form, setForm] = useState({
    nombre: "",
    direccion: "",
    latitud: "",
    longitud: "",
    radio_verificacion_metros: 1000,
    supervisor_id: "",
  });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalSugerenciasAbierto, setModalSugerenciasAbierto] = useState(false);
  const [buscar, setBuscar] = useState("");
  const [sugerencias, setSugerencias] = useState([]);

  const [crearLocacion] = useCrearLocacionMutation();
  const [editarLocacion] = useEditarLocacionMutation();
  const [eliminarLocacion] = useEliminarLocacionMutation();
  const [asignarSupervisorLocacion] = useAsignarSupervisorLocacionMutation();
  const [quitarSupervisorLocacion] = useQuitarSupervisorLocacionMutation();
  const [buscarCoordenadas, { isFetching: buscandoDireccionTexto }] = useLazyBuscarCoordenadasQuery();
  const [buscarDireccionPorCoordenadas, { isFetching: buscandoDireccionMapa }] =
    useLazyBuscarDireccionPorCoordenadasQuery();
  const { data: usuarios = [] } = useObtenerUsuariosQuery();

  const supervisores = useMemo(
    () => usuarios.filter((usuario) => usuario.rol === "supervisor"),
    [usuarios]
  );

  const supervisoresMap = useMemo(
    () => supervisores.reduce((acc, supervisor) => {
      acc[supervisor.id] = supervisor;
      return acc;
    }, {}),
    [supervisores]
  );

  const locacionesFiltradas = useMemo(() => {
    const filtradas = locaciones.filter((l) =>
      l.nombre.toLowerCase().includes(filtro.toLowerCase())
    );
    return filtradas.sort((a, b) => {
      if (ordenAsc) return a.nombre.localeCompare(b.nombre);
      return b.nombre.localeCompare(a.nombre);
    });
  }, [filtro, locaciones, ordenAsc]);

  const resetForm = () => {
    setForm({
      nombre: "",
      direccion: "",
      latitud: "",
      longitud: "",
      radio_verificacion_metros: 1000,
      supervisor_id: "",
    });
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
      supervisor_id: locacion.supervisor_id || "",
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
      let locacionGuardada = null;

      if (modoCrear) {
        locacionGuardada = await crearLocacion({
          ...form,
          radio_verificacion_metros: Number(form.radio_verificacion_metros),
          empresa_id: empresaSeleccionada.id,
          supervisor_id: undefined,
        }).unwrap();

        if (form.supervisor_id) {
          await asignarSupervisorLocacion({
            locacion_id: locacionGuardada.id,
            supervisor_id: form.supervisor_id,
          }).unwrap();
        }

        toast.success("Locación creada");
        refetch();
        refreshTotales();
      } else {
        locacionGuardada = await editarLocacion({
          locacion_id: locacionSeleccionada.id,
          datos: {
            ...form,
            radio_verificacion_metros: Number(form.radio_verificacion_metros),
            supervisor_id: undefined,
          },
        }).unwrap();

        if (form.supervisor_id) {
          await asignarSupervisorLocacion({
            locacion_id: locacionGuardada.id,
            supervisor_id: form.supervisor_id,
          }).unwrap();
        } else if (locacionSeleccionada?.supervisor_id) {
          await quitarSupervisorLocacion(locacionSeleccionada.id).unwrap();
        }

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

  const seleccionarPuntoMapa = useCallback(
    async (latitud, longitud) => {
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
    },
    [actualizarPuntoMapa, buscarDireccionPorCoordenadas]
  );

  const buscarDireccion = async () => {
    if (!buscar.trim()) {
      toast.error("Ingresa una dirección para buscar.");
      return;
    }

    try {
      const resultados = await buscarCoordenadas(buscar.trim()).unwrap();
      setSugerencias(resultados);
      if (!resultados.length) {
        setModalSugerenciasAbierto(false);
        toast.info("No se encontraron opciones para esa dirección.");
      } else {
        setModalSugerenciasAbierto(true);
      }
    } catch {
      setSugerencias([]);
      setModalSugerenciasAbierto(false);
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
        toast.info(
          "No se pudo obtener tu ubicación actual. Puedes buscar o seleccionar el punto en el mapa."
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [form.latitud, form.longitud, modalAbierto, seleccionarPuntoMapa]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-[#e6f0f8] bg-white shadow-xl shadow-[#0A2A47]/5">
      <div className="relative overflow-hidden border-b border-[#e6f0f8] px-5 py-5 md:px-6">
        <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.12),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(10,42,71,0.06),_transparent_38%)]" />
        <div className="relative flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight text-[#0A2A47]">Locaciones</h2>
                <MapPin size={16} className="text-[#5b6b79]" />
              </div>
              <p className="mt-1 text-xs text-[#5b6b79]">
                Define puntos verificados y su cobertura operativa.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#071f35] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#071f35]/15 transition hover:bg-[#0A2A47]"
              onClick={abrirCrear}
            >
              <Plus size={16} />
              Crear Locación
            </button>

            <div className="relative flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7b8a97]" />
                <input
                  type="text"
                  placeholder="Buscar por nombre"
                  className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] py-3 pl-10 pr-4 text-sm text-[#0A2A47] outline-none transition placeholder:text-[#8a99a8] focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
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
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6 md:py-6">
          <table className="w-full table-fixed text-left text-sm text-[#0A2A47]">
            <colgroup>
              <col className="w-auto" />
              <col className="w-[92px]" />
            </colgroup>
            <thead className="sticky top-0 z-10 border-b border-[#e6f0f8] bg-white/95 backdrop-blur">
              <tr>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">
                  Espacio
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">
                  Editar
                </th>
              </tr>
            </thead>
            <tbody>
              {locacionesFiltradas.map((l) => (
                <tr
                  key={l.id}
                  className={`cursor-pointer border-b border-[#edf3f8] transition ${
                    locacionSeleccionada?.id === l.id ? "bg-[#edf5fb]" : "hover:bg-white"
                  }`}
                  onClick={() => {
                    setLocacionSeleccionada(l);
                    setModoCrear(false);
                    setModalFormularioAbierto(false);
                  }}
                >
                  <td className="px-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#0A2A47]">{l.nombre}</p>
                      <p className="mt-0.5 text-xs text-[#7b8a97]" title={l.direccion}>
                        {l.direccion?.length > 8 ? `${l.direccion.slice(0, 8)}...` : l.direccion}
                      </p>
                      <div className="mt-2">
                        {l.supervisor_id ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            <ShieldCheck size={12} />
                            {supervisoresMap[l.supervisor_id]?.nombre || "Supervisor asignado"}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                            Sin supervisor
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          abrirEditar(l);
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#dbe8f2] bg-white text-[#0A2A47] transition hover:border-[#0A2A47] hover:bg-[#f8fbfd]"
                        title="Editar locación"
                      >
                        <Edit size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {locacionesFiltradas.length === 0 && (
                <tr>
                  <td className="px-3 py-14 text-center" colSpan="2">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-[#dbe8f2] bg-[#f4f8fb] text-[#7b8a97]">
                        <Navigation size={22} />
                      </div>
                      <p className="text-base font-semibold text-[#0A2A47]">No hay locaciones registradas</p>
                      <p className="mt-1 text-sm text-[#7b8a97]">
                        Crea una locación para empezar a validar trabajo por sitio.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
      </div>

      {modalFormularioAbierto && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 backdrop-blur-sm px-4">
          <div className="w-full max-w-[45rem] rounded-[28px] border border-[#e6f0f8] bg-white shadow-2xl">
            <div className="border-b border-[#e6f0f8] px-5 py-5 md:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7b8a97]">
                    Configuración
                  </p>
                  <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0A2A47]">
                    {modoCrear ? "Crear Locación" : "Editar Locación"}
                  </h3>
                  <p className="mt-1 text-sm text-[#5b6b79]">
                    Define nombre, ubicación y radio de verificación del sitio.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f4f8fb] text-[#0A2A47] transition hover:bg-[#e6f0f8]"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 px-5 py-5 md:grid-cols-2 md:px-6 md:py-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0A2A47]">Nombre de la locación</label>
                <input
                  type="text"
                  placeholder="Ej. Edificio Norte, Sucursal Centro"
                  className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-[#0A2A47] outline-none transition placeholder:text-[#8a99a8] focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>

              <div className="rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] p-4 md:col-span-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#0A2A47]">Ubicación verificada</p>
                    <p className="mt-1 text-sm text-[#5b6b79]">
                      Busca una dirección o marca el punto exacto en el mapa.
                    </p>
                  </div>
                  <button
                    onClick={() => setModalAbierto(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dbe8f2] bg-white px-4 py-3 text-sm font-semibold text-[#0A2A47] transition hover:border-[#0A2A47]"
                  >
                    <Search size={16} />
                    Buscar Dirección
                  </button>
                </div>

                {form.direccion ? (
                  <div className="mt-4 rounded-2xl border border-[#e6f0f8] bg-white px-4 py-3 text-sm text-[#0A2A47]">
                    <span className="font-semibold">Dirección:</span> {form.direccion}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-[#dbe8f2] bg-white px-4 py-3 text-sm text-[#7b8a97]">
                    Aún no has seleccionado una ubicación.
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#0A2A47]">
                  <Radar size={16} />
                  Radio de verificación (metros)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="1000"
                  className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-[#0A2A47] outline-none transition placeholder:text-[#8a99a8] focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                  value={form.radio_verificacion_metros}
                  onChange={(e) => setForm({ ...form, radio_verificacion_metros: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#0A2A47]">
                  <ShieldCheck size={16} />
                  Supervisor principal
                </label>
                <select
                  className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                  value={form.supervisor_id}
                  onChange={(e) => setForm({ ...form, supervisor_id: e.target.value })}
                >
                  <option value="">Sin supervisor</option>
                  {supervisores.map((supervisor) => (
                    <option key={supervisor.id} value={supervisor.id}>
                      {supervisor.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-3 pt-1 md:col-span-2 md:flex-row">
                <button
                  onClick={handleSubmit}
                  className="w-full rounded-2xl bg-[#3BAE3D] px-4 py-3 font-semibold text-white shadow-lg shadow-[#3BAE3D]/20 transition hover:bg-[#2f9631]"
                >
                  {modoCrear ? "Crear Locación" : "Guardar Cambios"}
                </button>
                {!modoCrear && (
                  <button
                    onClick={handleEliminar}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#f0d4d4] bg-[#fff7f7] px-4 py-3 font-semibold text-[#b84040] transition hover:bg-[#ffecec]"
                  >
                    <Trash2 size={16} />
                    Eliminar Locación
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm px-4">
          <div className="flex max-h-[90vh] w-[94vw] max-w-4xl flex-col gap-4 overflow-auto rounded-[28px] border border-[#e6f0f8] bg-white p-5 shadow-2xl md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-2xl font-extrabold tracking-tight text-[#0A2A47]">Seleccionar ubicación</h3>
                <p className="mt-1 text-sm text-[#5b6b79]">
                  Busca una dirección o elige el punto exacto directamente en el mapa.
                </p>
              </div>
              <a
                href="https://locationiq.com/"
                target="_blank"
                rel="noreferrer"
                className="flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 transition hover:bg-gray-100"
              >
                <span>Search by</span>
                <img src={LOCATIONIQ_LOGO_URL} alt="LocationIQ" className="h-4 w-auto" />
              </a>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7b8a97]" />
                <input
                  type="text"
                  placeholder="Ingresa dirección"
                  className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] py-3 pl-10 pr-4 text-[#0A2A47] outline-none transition placeholder:text-[#8a99a8] focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      buscarDireccion();
                    }
                  }}
                />
              </div>
              <button
                onClick={buscarDireccion}
                disabled={buscandoDireccionTexto}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-[#071f35] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#071f35]/15 transition ${
                  buscandoDireccionTexto ? "cursor-not-allowed opacity-60" : "hover:bg-[#0A2A47]"
                }`}
              >
                <Search size={16} />
                {buscandoDireccionTexto ? "Buscando" : "Buscar"}
              </button>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#0A2A47]">O selecciona el punto exacto en el mapa</p>
                {buscandoDireccionMapa && (
                  <span className="text-xs text-[#7b8a97]">Buscando dirección...</span>
                )}
              </div>
              <div className="overflow-hidden rounded-[24px] border border-[#e6f0f8]">
                <LocationPickerMap
                  latitud={form.latitud}
                  longitud={form.longitud}
                  onSelect={seleccionarPuntoMapa}
                />
              </div>
              {form.latitud && form.longitud && (
                <p className="mt-3 text-xs text-[#5b6b79]">
                  Coordenadas seleccionadas: {form.latitud}, {form.longitud}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
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
                className="rounded-2xl bg-[#3BAE3D] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#3BAE3D]/20 transition hover:bg-[#2f9631]"
              >
                Usar ubicación
              </button>
              <button
                onClick={() => setModalAbierto(false)}
                className="rounded-2xl border border-[#dbe8f2] bg-white px-4 py-3 text-sm font-semibold text-[#0A2A47] transition hover:border-[#0A2A47]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalSugerenciasAbierto && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl rounded-[28px] border border-[#e6f0f8] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#e6f0f8] px-5 py-5 md:px-6">
              <div>
                <h4 className="text-xl font-extrabold tracking-tight text-[#0A2A47]">
                  Selecciona una dirección
                </h4>
                <p className="mt-1 text-sm text-[#5b6b79]">
                  Elige una opción y la usaremos para esta locación.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalSugerenciasAbierto(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f4f8fb] text-[#0A2A47] transition hover:bg-[#e6f0f8]"
              >
                ×
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-5 py-5 md:px-6 md:py-6">
              <div className="overflow-hidden rounded-3xl border border-[#e6f0f8] bg-[#fbfdff]">
                {sugerencias.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="flex w-full items-start gap-3 border-b border-[#edf3f8] px-4 py-4 text-left text-sm text-[#0A2A47] transition hover:bg-white"
                    onClick={() => {
                      actualizarPuntoMapa(s.latitud, s.longitud, s.display_name);
                      setModalSugerenciasAbierto(false);
                      setSugerencias([]);
                    }}
                  >
                    <MapPin size={16} className="mt-0.5 shrink-0 text-[#3BAE3D]" />
                    <span>{s.display_name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end border-t border-[#e6f0f8] px-5 py-4 md:px-6">
              <button
                type="button"
                onClick={() => setModalSugerenciasAbierto(false)}
                className="rounded-2xl border border-[#dbe8f2] bg-white px-4 py-3 text-sm font-semibold text-[#0A2A47] transition hover:border-[#0A2A47]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

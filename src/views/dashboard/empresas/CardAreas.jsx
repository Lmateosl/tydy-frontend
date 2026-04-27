import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  ArrowDown,
  ArrowUp,
  Edit,
  LayoutGrid,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import {
  useCrearAreaMutation,
  useEditarAreaMutation,
  useEliminarAreaMutation,
  useLazyObtenerUsuariosAreaQuery,
} from "../../../redux/api/empresasApi";
import {
  useEditarUsuarioMutation,
  useLazyObtenerUsuariosQuery,
} from "../../../redux/api/userApi";

export default function CardAreas({ areas = [], locacionSeleccionada, refetch, refreshTotales }) {
  const [crearArea] = useCrearAreaMutation();
  const [editarArea] = useEditarAreaMutation();
  const [eliminarArea] = useEliminarAreaMutation();

  const [mostrarModal, setMostrarModal] = useState(false);
  const [buscarEmpleado, setBuscarEmpleado] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  const [triggerBuscarUsuarios, { data: usuarios = [] }] = useLazyObtenerUsuariosQuery();
  const [editarUsuario] = useEditarUsuarioMutation();

  const [filtro, setFiltro] = useState("");
  const [areaSeleccionada, setAreaSeleccionada] = useState(null);
  const [form, setForm] = useState({ nombre: "" });
  const [modoCrear, setModoCrear] = useState(false);
  const [modalFormularioAbierto, setModalFormularioAbierto] = useState(false);
  const [ordenAsc, setOrdenAsc] = useState(true);

  const [mostrarModalUsuarios, setMostrarModalUsuarios] = useState(false);
  const [usuariosArea, setUsuariosArea] = useState([]);
  const [loadingUsuariosArea, setLoadingUsuariosArea] = useState(false);
  const [obtenerUsuariosArea] = useLazyObtenerUsuariosAreaQuery();

  useEffect(() => {
    if (locacionSeleccionada) {
      setAreaSeleccionada(null);
    }
  }, [locacionSeleccionada]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({ nombre: "" });
  };

  const abrirCrear = () => {
    resetForm();
    setAreaSeleccionada(null);
    setModoCrear(true);
    setModalFormularioAbierto(true);
  };

  const abrirEditar = (area) => {
    setAreaSeleccionada(area);
    setForm({ nombre: area.nombre });
    setModoCrear(false);
    setModalFormularioAbierto(true);
  };

  const cerrarFormulario = () => {
    setModoCrear(false);
    setModalFormularioAbierto(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!form.nombre) {
      toast.error("El nombre es obligatorio");
      return;
    }
    try {
      if (modoCrear) {
        await crearArea({ nombre: form.nombre, locacion_id: locacionSeleccionada.id }).unwrap();
        toast.success("Área creada correctamente");
        refetch();
        refreshTotales();
      } else {
        await editarArea({
          locacion_id: locacionSeleccionada.id,
          area_id: areaSeleccionada.id,
          datos: { nombre: form.nombre },
        }).unwrap();
        toast.success("Área editada correctamente");
        refetch();
      }
      cerrarFormulario();
    } catch {
      toast.error("Ocurrió un error");
    }
  };

  const handleEliminar = async () => {
    try {
      await eliminarArea({
        locacion_id: locacionSeleccionada.id,
        area_id: areaSeleccionada.id,
      }).unwrap();
      toast.success("Área eliminada correctamente");
      refetch();
      refreshTotales();
      setAreaSeleccionada(null);
      cerrarFormulario();
    } catch {
      toast.error("Ocurrió un error");
    }
  };

  const areasFiltradas = areas
    .filter((a) => a.nombre.toLowerCase().includes(filtro.toLowerCase()))
    .sort((a, b) => {
      if (ordenAsc) return a.nombre.localeCompare(b.nombre);
      return b.nombre.localeCompare(a.nombre);
    });

  useEffect(() => {
    const fetchUsuariosArea = async () => {
      if (mostrarModalUsuarios && locacionSeleccionada && areaSeleccionada) {
        try {
          setLoadingUsuariosArea(true);
          const data = await obtenerUsuariosArea({
            locacion_id: locacionSeleccionada.id,
            area_id: areaSeleccionada.id,
          }).unwrap();
          setUsuariosArea(data);
        } catch {
          toast.error("Error al obtener usuarios del área");
        } finally {
          setLoadingUsuariosArea(false);
        }
      }
    };
    fetchUsuariosArea();
  }, [mostrarModalUsuarios, locacionSeleccionada, areaSeleccionada, obtenerUsuariosArea]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-[#e6f0f8] bg-white shadow-xl shadow-[#0A2A47]/5">
      <div className="relative overflow-hidden border-b border-[#e6f0f8] px-5 py-5 md:px-6">
        <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.12),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(10,42,71,0.06),_transparent_38%)]" />
        <div className="relative flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight text-[#0A2A47]">Áreas</h2>
                <LayoutGrid size={16} className="text-[#5b6b79]" />
              </div>
              <p className="mt-1 text-xs text-[#5b6b79]">
                Organiza cada locación en zonas operativas claras.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={abrirCrear}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#071f35] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#071f35]/15 transition hover:bg-[#0A2A47]"
            >
              <Plus size={16} />
              Crear Área
            </button>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7b8a97]" />
                <input
                  type="text"
                  placeholder="Buscar área"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] py-3 pl-10 pr-4 text-sm text-[#0A2A47] outline-none transition placeholder:text-[#8a99a8] focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
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
                  Área
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">
                  Editar
                </th>
              </tr>
            </thead>
            <tbody>
              {areasFiltradas.map((area) => (
                <tr
                  key={area.id}
                  className={`cursor-pointer border-b border-[#edf3f8] transition ${
                    areaSeleccionada?.id === area.id ? "bg-[#edf5fb]" : "hover:bg-white"
                  }`}
                  onClick={() => {
                    setAreaSeleccionada(area);
                    setModoCrear(false);
                    setModalFormularioAbierto(false);
                  }}
                >
                  <td className="px-3 py-3">
                    <p className="truncate font-semibold text-[#0A2A47]">{area.nombre}</p>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          abrirEditar(area);
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#dbe8f2] bg-white text-[#0A2A47] transition hover:border-[#0A2A47] hover:bg-[#f8fbfd]"
                        title="Editar área"
                      >
                        <Edit size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {areasFiltradas.length === 0 && (
                <tr>
                  <td className="px-3 py-14 text-center" colSpan="2">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-[#dbe8f2] bg-[#f4f8fb] text-[#7b8a97]">
                        <LayoutGrid size={22} />
                      </div>
                      <p className="text-base font-semibold text-[#0A2A47]">No hay áreas disponibles</p>
                      <p className="mt-1 text-sm text-[#7b8a97]">
                        Crea la primera área para empezar a ordenar la operación por zonas.
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
          <div className="w-full max-w-lg rounded-[28px] border border-[#e6f0f8] bg-white shadow-2xl">
            <div className="border-b border-[#e6f0f8] px-5 py-5 md:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7b8a97]">
                    Configuración
                  </p>
                  <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0A2A47]">
                    {modoCrear ? "Crear Área" : "Editar Área"}
                  </h3>
                  <p className="mt-1 text-sm text-[#5b6b79]">
                    Define una zona interna para ordenar mejor las tareas y responsables.
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

            <div className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0A2A47]">Nombre del área</label>
                <input
                  name="nombre"
                  placeholder="Ej. Recepción, Bodega, Piso 2"
                  value={form.nombre}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-[#0A2A47] outline-none transition placeholder:text-[#8a99a8] focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                />
              </div>

              {!modoCrear && areaSeleccionada && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => setMostrarModal(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#071f35] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#071f35]/15 transition hover:bg-[#0A2A47]"
                  >
                    <UserPlus size={16} />
                    Añadir Empleado
                  </button>
                  <button
                    onClick={() => setMostrarModalUsuarios(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dbe8f2] bg-white px-4 py-3 text-sm font-semibold text-[#0A2A47] transition hover:border-[#0A2A47]"
                  >
                    <Users size={16} />
                    Ver Empleados
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={handleSubmit}
                  className="w-full rounded-2xl bg-[#3BAE3D] px-4 py-3 font-semibold text-white shadow-lg shadow-[#3BAE3D]/20 transition hover:bg-[#2f9631]"
                >
                  {modoCrear ? "Crear Área" : "Guardar Cambios"}
                </button>

                {!modoCrear && (
                  <button
                    onClick={handleEliminar}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#f0d4d4] bg-[#fff7f7] px-4 py-3 font-semibold text-[#b84040] transition hover:bg-[#ffecec]"
                  >
                    <Trash2 size={16} />
                    Eliminar Área
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl rounded-[28px] border border-[#e6f0f8] bg-white shadow-2xl">
            <div className="border-b border-[#e6f0f8] px-5 py-5 md:px-6">
              <h3 className="text-2xl font-extrabold tracking-tight text-[#0A2A47]">Seleccionar Empleado</h3>
              <p className="mt-1 text-sm text-[#5b6b79]">
                Asigna un empleado al área <span className="font-semibold text-[#0A2A47]">{areaSeleccionada?.nombre}</span>.
              </p>
            </div>

            <div className="space-y-4 px-5 py-5 md:px-6 md:py-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7b8a97]" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o identificación"
                    value={buscarEmpleado}
                    onChange={(e) => setBuscarEmpleado(e.target.value)}
                    className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] py-3 pl-10 pr-4 text-sm text-[#0A2A47] outline-none transition placeholder:text-[#8a99a8] focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                  />
                </div>
                <button
                  onClick={() => triggerBuscarUsuarios()}
                  className="rounded-2xl bg-[#071f35] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#071f35]/15 transition hover:bg-[#0A2A47]"
                >
                  Buscar
                </button>
              </div>

              <div className="max-h-72 overflow-auto rounded-3xl border border-[#e6f0f8] bg-[#fbfdff]">
                <table className="w-full text-left text-sm text-[#333333]">
                  <thead className="sticky top-0 border-b border-[#e6f0f8] bg-white/95 backdrop-blur">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Nombre</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Identificación</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Área</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios
                      .filter(
                        (u) =>
                          u.rol === "empleado" &&
                          (u.nombre.toLowerCase().includes(buscarEmpleado.toLowerCase()) ||
                            (u.identificacion || "").toLowerCase().includes(buscarEmpleado.toLowerCase()))
                      )
                      .map((u) => (
                        <tr
                          key={u.id}
                          className={`cursor-pointer border-b border-[#edf3f8] transition hover:bg-white ${
                            usuarioSeleccionado?.id === u.id ? "bg-[#edf5fb]" : ""
                          }`}
                          onClick={() => setUsuarioSeleccionado(u)}
                        >
                          <td className="px-4 py-3 font-medium text-[#0A2A47]">{u.nombre}</td>
                          <td className="px-4 py-3 text-[#5b6b79]">{u.identificacion}</td>
                          <td className="px-4 py-3 text-[#5b6b79]">{u.area_nombre || "-"}</td>
                        </tr>
                      ))}
                    {usuarios.length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-4 py-10 text-center text-[#7b8a97]">
                          Sin resultados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {usuarioSeleccionado && (
                <div className="rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] p-4 text-sm text-[#5b6b79]">
                  Vas a añadir a <strong className="text-[#0A2A47]">{usuarioSeleccionado.nombre}</strong> al área{" "}
                  <strong className="text-[#0A2A47]">{areaSeleccionada.nombre}</strong>.
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                {usuarioSeleccionado && (
                  <button
                    onClick={async () => {
                      try {
                        const formData = new FormData();
                        formData.append("area_id", areaSeleccionada.id);
                        await editarUsuario({ usuario_id: usuarioSeleccionado.id, datos: formData }).unwrap();
                        toast.success("Usuario añadido al área");
                        setMostrarModal(false);
                        setUsuarioSeleccionado(null);
                      } catch {
                        toast.error("Error al añadir usuario");
                      }
                    }}
                    className="rounded-2xl bg-[#3BAE3D] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#3BAE3D]/20 transition hover:bg-[#2f9631]"
                  >
                    Confirmar asignación
                  </button>
                )}
                <button
                  onClick={() => setMostrarModal(false)}
                  className="rounded-2xl border border-[#dbe8f2] bg-white px-4 py-3 text-sm font-semibold text-[#0A2A47] transition hover:border-[#0A2A47]"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarModalUsuarios && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl rounded-[28px] border border-[#e6f0f8] bg-white shadow-2xl">
            <div className="border-b border-[#e6f0f8] px-5 py-5 md:px-6">
              <h3 className="text-2xl font-extrabold tracking-tight text-[#0A2A47]">
                Empleados en {areaSeleccionada?.nombre}
              </h3>
              <p className="mt-1 text-sm text-[#5b6b79]">
                Vista rápida de las personas asignadas a esta área.
              </p>
            </div>

            <div className="px-5 py-5 md:px-6 md:py-6">
              {loadingUsuariosArea ? (
                <div className="rounded-2xl border border-dashed border-[#dbe8f2] bg-[#f8fbfd] px-4 py-10 text-center text-[#7b8a97]">
                  Cargando empleados...
                </div>
              ) : usuariosArea.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#dbe8f2] bg-[#f8fbfd] px-4 py-10 text-center text-[#7b8a97]">
                  No hay empleados en el área
                </div>
              ) : (
                <div className="max-h-72 overflow-auto rounded-3xl border border-[#e6f0f8] bg-[#fbfdff]">
                  <table className="w-full text-left text-sm text-[#333333]">
                    <thead className="sticky top-0 border-b border-[#e6f0f8] bg-white/95 backdrop-blur">
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Nombre</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Identificación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuariosArea.map((u) => (
                        <tr key={u.id} className="border-b border-[#edf3f8] transition hover:bg-white">
                          <td className="px-4 py-3 font-medium text-[#0A2A47]">{u.nombre}</td>
                          <td className="px-4 py-3 text-[#5b6b79]">{u.identificacion}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setMostrarModalUsuarios(false)}
                  className="rounded-2xl border border-[#dbe8f2] bg-white px-4 py-3 text-sm font-semibold text-[#0A2A47] transition hover:border-[#0A2A47]"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

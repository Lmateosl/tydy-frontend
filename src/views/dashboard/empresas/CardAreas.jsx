import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Plus, Edit, ArrowUp, ArrowDown } from "lucide-react";
import { 
  useCrearAreaMutation,
  useEditarAreaMutation,
  useEliminarAreaMutation,
  useLazyObtenerUsuariosAreaQuery
} from "../../../redux/api/empresasApi";
import { useLazyObtenerUsuariosQuery } from "../../../redux/api/userApi";
import { useEditarUsuarioMutation } from "../../../redux/api/userApi";

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
        await editarArea({ locacion_id: locacionSeleccionada.id, area_id: areaSeleccionada.id, datos: { nombre: form.nombre } }).unwrap();
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
      await eliminarArea({ locacion_id: locacionSeleccionada.id, area_id: areaSeleccionada.id }).unwrap();
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
      else return b.nombre.localeCompare(a.nombre);
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
    <div className="bg-white border border-[#0A2A47] p-4 rounded-xl flex flex-col h-full">
      <h2 className="text-xl font-bold text-[#0A2A47] mb-4 text-center">Áreas</h2>

      <div className="flex flex-col gap-0">
        <button
          onClick={abrirCrear}
          className="bg-[#0A2A47] text-white w-full py-1 mb-2 rounded font-semibold shadow-sm hover:bg-[#123b63]"
        >
          <Plus size={16} className="inline" /> Crear Área
        </button>

        <input
          type="text"
          placeholder="Buscar área"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="border border-[#0A2A47] bg-white rounded px-2 py-1 mb-4 w-full text-[#0A2A47] placeholder:text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
        />
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-[#e6f0f8] shadow-sm">
        <table className="w-full text-center text-[#0A2A47]">
          <thead className="sticky top-0 bg-white text-[#0A2A47] border-b border-[#e6f0f8]">
            <tr>
              <th
                className="py-2 px-3 cursor-pointer flex items-center justify-center"
                onClick={() => setOrdenAsc(!ordenAsc)}
              >
                Nombre {ordenAsc ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
              </th>
            </tr>
          </thead>
          <tbody>
            {areasFiltradas.map((area) => (
              <tr
                key={area.id}
                className={`cursor-pointer transition-colors border-b border-[#e6f0f8] hover:bg-[#e6f0f8] ${areaSeleccionada?.id === area.id ? "bg-[#d6e6f5] border-l-4 border-[#0A2A47]" : ""}`}
                onClick={() => {
                  setAreaSeleccionada(area);
                  setModoCrear(false);
                  setModalFormularioAbierto(false);
                }}
              >
                <td className="py-2 px-3">
                  <div className="flex items-center justify-center gap-2">
                    <span>{area.nombre}</span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        abrirEditar(area);
                      }}
                      className="rounded-full p-1 text-[#0A2A47] hover:bg-[#d6e6f5]"
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
                <td className="py-2 px-3 text-[#0A2A47]" colSpan="2">No hay áreas</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalFormularioAbierto && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white border border-[#0A2A47] shadow-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[18px] text-[#0A2A47]">{modoCrear ? "Crear Área" : "Editar Área"}</h3>
              <button
                type="button"
                onClick={cerrarFormulario}
                className="text-[#0A2A47] hover:bg-[#e6f0f8] rounded-full px-2 py-1 font-bold"
              >
                ×
              </button>
            </div>
          <input
            name="nombre"
            placeholder="Nombre"
            value={form.nombre}
            onChange={handleChange}
            className="border border-[#0A2A47] bg-white rounded-md px-2 py-2 mb-4 w-full text-[#0A2A47] placeholder:text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
          />

          <div className="flex flex-col gap-2">
            <button onClick={handleSubmit} className="bg-[#0A2A47] text-white w-full py-2 rounded font-semibold shadow-sm hover:bg-[#123b63]">
              {modoCrear ? "Crear" : "Actualizar"}
            </button>

            {!modoCrear && (
              <>
                <button onClick={handleEliminar} className="border border-[#0A2A47] text-[#0A2A47] w-full py-2 rounded font-semibold hover:bg-[#e6f0f8]">
                  Eliminar
                </button>
                {areaSeleccionada && (
                  <div className="pt-4">
                    <button
                      onClick={() => setMostrarModal(true)}
                      className="bg-[#0A2A47] text-white w-full py-2 rounded font-semibold shadow-sm hover:bg-[#123b63]"
                    >
                      Añadir Empleado
                    </button>
                    <button
                      onClick={() => setMostrarModalUsuarios(true)}
                      className="bg-[#0A2A47] text-white w-full py-2 rounded font-semibold shadow-sm hover:bg-[#123b63] mt-2"
                    >
                      Ver Empleados
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          </div>
        </div>
      )}
      {mostrarModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}>
          <div className="bg-white p-4 rounded-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-2 text-[#0A2A47]">Seleccionar Empleado</h3>
            
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Buscar por nombre o identificación"
                value={buscarEmpleado}
                onChange={(e) => setBuscarEmpleado(e.target.value)}
                className="border border-[#0A2A47] rounded-md px-2 py-1 flex-1 text-[#0A2A47] placeholder:text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
              />
              <button
                onClick={() => triggerBuscarUsuarios()}
                className="bg-[#0A2A47] text-white px-3 py-1 rounded font-semibold shadow-sm hover:bg-[#123b63]"
              >
                Buscar
              </button>
            </div>

            <div className="max-h-48 overflow-auto mb-2 rounded-2xl">
              <table className="w-full text-[#333333] text-left">
                <thead className="bg-[#0A2A47] text-white text-center">
                  <tr>
                    <th className="py-1">Nombre</th>
                    <th className="py-1">Identificación</th>
                    <th className="py-1">Área</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {usuarios
                    .filter(u => u.rol === "empleado" && 
                      (u.nombre.toLowerCase().includes(buscarEmpleado.toLowerCase()) || 
                       (u.identificacion || "").toLowerCase().includes(buscarEmpleado.toLowerCase())))
                    .map(u => (
                      <tr
                        key={u.id}
                        className={`cursor-pointer transition-colors border-b border-[#e6f0f8] hover:bg-[#e6f0f8] ${usuarioSeleccionado?.id === u.id ? "bg-[#d6e6f5] text-[#0A2A47]" : ""}`}
                        onClick={() => setUsuarioSeleccionado(u)}
                      >
                        <td className="py-1">{u.nombre}</td>
                        <td className="py-1">{u.identificacion}</td>
                        <td className="py-1">{u.area_nombre || "-"}</td>
                      </tr>
                  ))}
                  {usuarios.length === 0 && (
                    <tr>
                      <td colSpan="2" className="py-1">Sin resultados</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {usuarioSeleccionado && (
              <div className="text-center">
                <p className="mb-2">Vas a añadir <strong className="text-[#0A2A47]">{usuarioSeleccionado.nombre}</strong> al área <strong className="text-[#0A2A47]">{areaSeleccionada.nombre}</strong></p>
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
                  className="bg-[#0A2A47] text-white px-4 w-full py-2 rounded font-semibold shadow-sm hover:bg-[#123b63] mb-2"
                >
                  Confirmar
                </button>
              </div>
            )}
            <button
                onClick={() => setMostrarModal(false)}
                className="border border-[#0A2A47] text-[#0A2A47] px-2 py-1 w-full rounded font-semibold hover:bg-[#e6f0f8]"
              >
                Cerrar
            </button>
          </div>
        </div>
      )}
      {mostrarModalUsuarios && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}>
          <div className="bg-white p-4 rounded-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-2 text-[#0A2A47]">
              Empleados en el área {areaSeleccionada?.nombre}
            </h3>

            {loadingUsuariosArea ? (
              <p className="text-center">Cargando...</p>
            ) : usuariosArea.length === 0 ? (
              <p className="text-center">No hay empleados en el área</p>
            ) : (
              <div className="max-h-48 overflow-auto mb-2 rounded-2xl">
                <table className="w-full text-[#333333] text-left">
                  <thead className="bg-[#0A2A47] text-white text-center">
                    <tr>
                      <th className="py-1">Nombre</th>
                      <th className="py-1">Identificación</th>
                    </tr>
                  </thead>
                  <tbody className="text-center">
                    {usuariosArea.map((u) => (
                      <tr key={u.id} className="transition-colors border-b border-[#e6f0f8] hover:bg-[#e6f0f8]">
                        <td className="py-1">{u.nombre}</td>
                        <td className="py-1">{u.identificacion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button
              onClick={() => setMostrarModalUsuarios(false)}
              className="border border-[#0A2A47] text-[#0A2A47] px-2 py-1 w-full rounded font-semibold hover:bg-[#e6f0f8]"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

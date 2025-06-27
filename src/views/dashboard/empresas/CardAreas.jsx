import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Plus, Trash, Edit, ArrowUp, ArrowDown } from "lucide-react";
import { 
  useCrearAreaMutation,
  useEditarAreaMutation,
  useEliminarAreaMutation,
  useObtenerUsuariosAreaQuery
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
  const [ordenAsc, setOrdenAsc] = useState(true);

  const [mostrarModalUsuarios, setMostrarModalUsuarios] = useState(false);
  const [usuariosArea, setUsuariosArea] = useState([]);
  const [loadingUsuariosArea, setLoadingUsuariosArea] = useState(false);

  useEffect(() => {
    if (locacionSeleccionada) {
        setAreaSeleccionada(null);
    }
  }, [locacionSeleccionada]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
      setForm({ nombre: "" });
      setAreaSeleccionada(null);
      setModoCrear(false);
    } catch (error) {
      toast.error("Ocurrió un error");
    }
  };

  const handleEliminar = async () => {
    try {
      await eliminarArea({ locacion_id: locacionSeleccionada.id, area_id: areaSeleccionada.id }).unwrap();
      toast.success("Área eliminada correctamente");
      refetch();
      refreshTotales();
      setForm({ nombre: "" });
      setAreaSeleccionada(null);
      setModoCrear(false);
    } catch (error) {
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
          const res = await fetch(`https://api.tydy.pro/areas/${locacionSeleccionada.id}/${areaSeleccionada.id}/usuarios/`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          });
          const data = await res.json();
          setUsuariosArea(data);
        } catch {
          toast.error("Error al obtener usuarios del área");
        } finally {
          setLoadingUsuariosArea(false);
        }
      }
    };
    fetchUsuariosArea();
  }, [mostrarModalUsuarios, locacionSeleccionada, areaSeleccionada]);

  return (
    <div className="bg-[#0A2A47] p-4 rounded-xl flex flex-col h-full">
      <h2 className="text-xl font-bold text-white mb-4 text-center">Áreas</h2>

      <div className="flex flex-col gap-0">
        <button
          onClick={() => {
            setForm({ nombre: "" });
            setAreaSeleccionada(null);
            setModoCrear(true);
          }}
          className="bg-[#3BAE3D] text-white w-full py-1 mb-2 rounded hover:bg-[#a0dea1]"
        >
          <Plus size={16} className="inline" /> Crear Área
        </button>

        <input
          type="text"
          placeholder="Buscar área"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="border border-white bg-white rounded px-2 py-1 mb-4 w-full text-[#333333] placeholder:text-[#333333]"
        />
      </div>

      <div className="flex-1 overflow-auto rounded-xl">
        <table className="w-full text-center text-white rounded-xl">
          <thead className="sticky top-0 bg-white text-[#0A2A47] rounded-2xl">
            <tr>
              <th
                className="p-2 cursor-pointer flex items-center justify-center"
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
                className={`cursor-pointer hover:bg-[#a0dea1] ${areaSeleccionada?.id === area.id ? "bg-[#3BAE3D]" : ""}`}
                onClick={() => {
                  setAreaSeleccionada(area);
                  setForm({ nombre: area.nombre });
                  setModoCrear(false);
                }}
              >
                <td className="py-2">{area.nombre}</td>
              </tr>
            ))}
            {areasFiltradas.length === 0 && (
              <tr>
                <td className="py-2" colSpan="2">No hay áreas</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(modoCrear || areaSeleccionada) && (
        <div className="pt-2">
          <h3 className="font-bold mb-4 text-[18px] text-white">{modoCrear ? "Crear Área" : "Editar Área"}</h3>
          <input
            name="nombre"
            placeholder="Nombre"
            value={form.nombre}
            onChange={handleChange}
            className="border border-white bg-white rounded-md px-2 py-1 mb-2 w-full text-[#333333] placeholder:text-[#333333]"
          />

          <div className="flex flex-col gap-2">
            <button onClick={handleSubmit} className="bg-[#3BAE3D] text-white w-full py-1 rounded hover:bg-[#a0dea1]">
              {modoCrear ? "Crear" : "Actualizar"}
            </button>

            {!modoCrear && (
              <>
                <button onClick={handleEliminar} className="border border-white text-white w-full py-1 rounded hover:bg-[#a0dea1]">
                  Eliminar
                </button>
                {areaSeleccionada && (
                  <div className="pt-4">
                    <button
                      onClick={() => setMostrarModal(true)}
                      className="bg-[#3BAE3D] text-white w-full py-1 rounded hover:bg-[#a0dea1]"
                    >
                      Añadir Empleado
                    </button>
                    <button
                      onClick={() => setMostrarModalUsuarios(true)}
                      className="bg-[#3BAE3D] text-white w-full py-1 rounded hover:bg-[#a0dea1] mt-2"
                    >
                      Ver Empleados
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {mostrarModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
          <div className="bg-white p-4 rounded-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-2 text-[#0A2A47]">Seleccionar Empleado</h3>
            
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Buscar por nombre o identificación"
                value={buscarEmpleado}
                onChange={(e) => setBuscarEmpleado(e.target.value)}
                className="border border-gray-300 px-2 py-1 flex-1"
              />
              <button
                onClick={() => triggerBuscarUsuarios()}
                className="bg-[#3BAE3D] text-white px-2 py-1 rounded hover:bg-[#a0dea1]"
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
                        className={`cursor-pointer hover:bg-[#a0dea1] ${usuarioSeleccionado?.id === u.id ? "bg-[#3BAE3D] text-white" : ""}`}
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
                  className="bg-[#3BAE3D] text-white px-4 w-full py-1 rounded hover:bg-[#a0dea1] mb-2"
                >
                  Confirmar
                </button>
              </div>
            )}
            <button
                onClick={() => setMostrarModal(false)}
                className="border border-[#0A2A47] text-[#0A2A47] px-2 py-1 w-full rounded hover:bg-[#a0dea1]"
              >
                Cerrar
            </button>
          </div>
        </div>
      )}
      {mostrarModalUsuarios && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
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
                      <tr key={u.id} className="hover:bg-[#a0dea1]">
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
              className="border border-[#0A2A47] text-[#0A2A47] px-2 py-1 w-full rounded hover:bg-[#a0dea1]"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

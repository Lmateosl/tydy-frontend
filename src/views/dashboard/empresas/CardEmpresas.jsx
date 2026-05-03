import { useState, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import { Plus, ArrowDown, ArrowUp, Camera, Pencil, ShieldCheck } from "lucide-react";
import {
  useAplicarSupervisorEmpresaMutation,
  useCrearEmpresaMutation,
  useEditarEmpresaMutation,
  useEliminarEmpresaMutation
} from '../../../redux/api/empresasApi'
import { useObtenerUsuariosQuery } from "../../../redux/api/userApi";

export default function CardEmpresas({ empresas, setEmpresaSeleccionada, empresaSeleccionada, refetch, refreshLocaciones, refreshTotales }) {
  const [filtro, setFiltro] = useState("");
  const [modoCrear, setModoCrear] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [ordenAsc, setOrdenAsc] = useState(true);
  const [form, setForm] = useState({ nombre: "", foto: null });
  const [supervisorEmpresaId, setSupervisorEmpresaId] = useState("");
  const fileInputRef = useRef(null);

  const [crearEmpresa] = useCrearEmpresaMutation();
  const [editarEmpresa] = useEditarEmpresaMutation();
  const [eliminarEmpresa] = useEliminarEmpresaMutation();
  const [aplicarSupervisorEmpresa] = useAplicarSupervisorEmpresaMutation();
  const { data: usuarios = [] } = useObtenerUsuariosQuery();

  const supervisores = useMemo(
    () => usuarios.filter((usuario) => usuario.rol === "supervisor"),
    [usuarios]
  );

  const empresasFiltradas = useMemo(() => {
    let filtradas = empresas.filter((e) => e.nombre.toLowerCase().includes(filtro.toLowerCase()));
    return filtradas.sort((a, b) => {
      if (ordenAsc) return a.nombre.localeCompare(b.nombre);
      else return b.nombre.localeCompare(a.nombre);
    });
  }, [filtro, empresas, ordenAsc]);

  const handleSelect = (empresa) => {
    setEmpresaSeleccionada(empresa);
    setModoCrear(false);
    setModalEditarAbierto(false);
  };

  const handleOpenEditar = (empresa) => {
    setEmpresaSeleccionada(empresa);
    setModoCrear(false);
    setModalEditarAbierto(true);
    setForm({ nombre: empresa.nombre, foto: null });
  };

  const handleCrear = async () => {
    if (!form.nombre) return toast.error("El nombre es obligatorio");
    const formData = new FormData();
    formData.append("nombre", form.nombre);
    if (form.foto) formData.append("imagen", form.foto);
    try {
      await crearEmpresa(formData).unwrap();
      toast.success("Empresa creada con éxito");
      refetch();
      refreshTotales();
      setForm({ nombre: "", foto: null });
      setModoCrear(false);
      setModalEditarAbierto(false);
    } catch {
      toast.error("Error al crear empresa");
    }
  };

  const handleEditar = async () => {
    if (!form.nombre) return toast.error("El nombre es obligatorio");
    const formData = new FormData();
    formData.append("nombre", form.nombre);
    if (form.foto) formData.append("imagen", form.foto);
    try {
      await editarEmpresa({ empresa_id: empresaSeleccionada.id, datos: formData }).unwrap();
      toast.success("Empresa actualizada con éxito");
      refetch();
      setModalEditarAbierto(false);
    } catch {
      toast.error("Error al actualizar empresa");
    }
  };

  const handleEliminar = async () => {
    try {
      await eliminarEmpresa(empresaSeleccionada.id).unwrap();
      toast.success("Empresa eliminada");
      setEmpresaSeleccionada(null);
      setModalEditarAbierto(false);
      refetch();
      refreshTotales();
    } catch {
      toast.error("Error al eliminar empresa");
    }
  };

  const handleAplicarSupervisorEmpresa = async () => {
    if (!empresaSeleccionada?.id) {
      toast.error("No hay empresa seleccionada.");
      return;
    }
    if (!supervisorEmpresaId) {
      toast.error("Selecciona un supervisor.");
      return;
    }

    try {
      const resultado = await aplicarSupervisorEmpresa({
        empresa_id: empresaSeleccionada.id,
        supervisor_id: supervisorEmpresaId,
      }).unwrap();
      toast.success(`Supervisor aplicado en ${resultado.locaciones_actualizadas} locaciones`);
      refetch();
      refreshLocaciones?.();
      refreshTotales();
    } catch {
      toast.error("No se pudo aplicar el supervisor a la empresa");
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-[#e6f0f8] bg-white shadow-xl shadow-[#0A2A47]/5">
      <div className="relative overflow-hidden border-b border-[#e6f0f8] px-5 py-5 md:px-6">
        <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.12),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(10,42,71,0.06),_transparent_38%)]" />
        <div className="relative flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight text-[#0A2A47]">Empresas</h2>
                <Camera size={16} className="text-[#5b6b79]" />
              </div>
              <p className="mt-1 text-xs text-[#5b6b79]">
                Clientes y organizaciones registradas.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setModoCrear(true); setModalEditarAbierto(false); setEmpresaSeleccionada(null); setForm({ nombre: "", foto: null }); }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#071f35] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#071f35]/15 transition hover:bg-[#0A2A47]"
            >
              <Plus size={16} />
              Crear Empresa
            </button>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Camera size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7b8a97]" />
                <input
                  placeholder="Buscar empresa"
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
                Empresa
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">
                Editar
              </th>
            </tr>
          </thead>
          <tbody>
            {empresasFiltradas.map((e) => (
              <tr
                key={e.id}
                className={`cursor-pointer border-b border-[#edf3f8] transition ${
                  empresaSeleccionada?.id === e.id ? "bg-[#edf5fb]" : "hover:bg-white"
                }`}
                onClick={() => handleSelect(e)}
              >
                <td className="px-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {e.imagen ? (
                      <img
                        src={e.imagen}
                        alt="Foto"
                        className="h-9 w-9 rounded-xl object-cover border border-[#e6f0f8] shadow-sm"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e6f0f8] bg-[#f8fbfd]">
                        <Camera size={14} className="text-gray-400" />
                      </div>
                    )}
                    <p className="truncate font-semibold text-[#0A2A47]">{e.nombre}</p>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenEditar(e);
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#dbe8f2] bg-white text-[#0A2A47] transition hover:border-[#0A2A47] hover:bg-[#f8fbfd]"
                      title="Editar empresa"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(modoCrear || modalEditarAbierto) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-[40rem] rounded-3xl bg-white border border-[#e6f0f8] shadow-2xl p-5 md:p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#e6f0f8]">
              <h3 className="font-extrabold text-2xl text-[#0A2A47] tracking-tight">
                {modoCrear ? "Crear Empresa" : "Editar Empresa"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setModoCrear(false);
                  setModalEditarAbierto(false);
                  setForm({ nombre: "", foto: null });
                }}
                className="w-9 h-9 rounded-xl bg-[#f4f8fb] text-[#0A2A47] hover:bg-[#e6f0f8] font-bold transition"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
              <div className="flex flex-col items-center gap-3 text-[#0A2A47] text-wrap w-full rounded-3xl border border-[#e6f0f8] bg-[#f8fbfd] p-5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative h-28 w-28 rounded-3xl border border-[#e6f0f8] bg-white overflow-hidden flex items-center justify-center shadow-sm hover:border-[#3BAE3D] focus:outline-none focus:ring-4 focus:ring-[#3BAE3D]/10 transition"
                  title="Seleccionar imagen"
                >
                  {form.foto ? (
                    <img src={URL.createObjectURL(form.foto)} alt="Foto" className="h-full w-full object-cover" />
                  ) : empresaSeleccionada?.imagen ? (
                    <img src={empresaSeleccionada.imagen} alt="Foto" className="h-full w-full object-cover" />
                  ) : (
                    <Camera className="text-gray-400 h-10 w-10" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-[#071f35]/70 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Cambiar
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setForm({ ...form, foto: e.target.files[0] })}
                  className="hidden"
                />
                <p className="text-center text-xs text-gray-500">Haz click en la imagen para cambiarla</p>
              </div>

              <div className="flex flex-col gap-4">
                <input
                  placeholder="Nombre de la empresa"
                  className="w-full px-4 py-3 bg-[#f8fbfd] text-[#0A2A47] border border-[#dbe8f2] rounded-xl outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10 placeholder:text-gray-400"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />

                {modoCrear ? (
                  <button onClick={handleCrear} className="bg-[#071f35] text-white w-full py-3 rounded-2xl font-semibold shadow-lg shadow-[#071f35]/10 hover:bg-[#123b63] transition">
                    Crear
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="rounded-3xl border border-[#e6f0f8] bg-[#f8fbfd] p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-[#dbe8f2] bg-white text-[#0A2A47]">
                          <ShieldCheck size={18} />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-[#0A2A47]">
                            Supervisor principal para locaciones
                          </h4>
                          <p className="mt-1 text-xs leading-5 text-[#5b6b79]">
                            Aplica el supervisor seleccionado a todas las locaciones de esta empresa.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="mb-2 block text-sm font-semibold text-[#0A2A47]">
                          Supervisor principal
                        </label>
                        <select
                          className="w-full rounded-2xl border border-[#dbe8f2] bg-white px-4 py-3 text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                          value={supervisorEmpresaId}
                          onChange={(e) => setSupervisorEmpresaId(e.target.value)}
                        >
                          <option value="">Selecciona un supervisor</option>
                          {supervisores.map((supervisor) => (
                            <option key={supervisor.id} value={supervisor.id}>
                              {supervisor.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Reemplazará el supervisor principal de todas las locaciones de esta empresa.
                      </div>

                      <button
                        type="button"
                        onClick={handleAplicarSupervisorEmpresa}
                        className="mt-4 w-full rounded-2xl border border-[#dbe8f2] bg-white px-4 py-3 font-semibold text-[#0A2A47] transition hover:border-[#0A2A47] hover:bg-[#fdfefe]"
                      >
                        Aplicar supervisor a todas las locaciones
                      </button>
                    </div>

                    <button onClick={handleEditar} className="bg-[#071f35] text-white w-full py-3 rounded-2xl font-semibold shadow-lg shadow-[#071f35]/10 hover:bg-[#123b63] transition">
                      Actualizar
                    </button>
                    <button onClick={handleEliminar} className="border border-[#dbe8f2] text-[#0A2A47] w-full py-3 rounded-2xl font-semibold hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition">
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

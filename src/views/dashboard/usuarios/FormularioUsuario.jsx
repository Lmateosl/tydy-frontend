import { useState, useEffect, useRef, useMemo } from "react";
import {
  useCrearUsuarioMutation,
  useEditarUsuarioMutation,
  useEliminarUsuarioMutation,
  useObtenerEmpresasClienteQuery,
  useAsignarEmpresaClienteMutation,
  useQuitarEmpresaClienteMutation,
} from "../../../redux/api/userApi";
import { useObtenerEmpresasQuery } from "../../../redux/api/empresasApi";
import { toast } from "react-toastify";
import { Camera } from "lucide-react";

export default function FormularioUsuario({ usuario, modoCrear, setModoCrear, setUsuarioSeleccionado, refetchUsuarios }) {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    contrasena: "",
    rol: "empleado",
    numero: "",
    direccion: "",
    identificacion: "",
    foto: null,
    area_id: ""
  });
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState("");

  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef(null);

  const [crearUsuario, { isLoading: creando }] = useCrearUsuarioMutation();
  const [editarUsuario, { isLoading: editando }] = useEditarUsuarioMutation();
  const [eliminarUsuario] = useEliminarUsuarioMutation();
  const [asignarEmpresaCliente, { isLoading: asignandoEmpresa }] = useAsignarEmpresaClienteMutation();
  const [quitarEmpresaCliente, { isLoading: quitandoEmpresa }] = useQuitarEmpresaClienteMutation();
  const { data: empresas = [] } = useObtenerEmpresasQuery(undefined, {
    skip: !usuario || form.rol !== "cliente",
  });

  const puedeConsultarEmpresasAsignadas = Boolean(
    usuario && form.rol === "cliente" && usuario.rol === "cliente"
  );

  const {
    data: empresasAsignadas = [],
    isFetching: cargandoEmpresasAsignadas,
    refetch: refetchEmpresasAsignadas,
  } = useObtenerEmpresasClienteQuery(usuario?.id, {
    skip: !puedeConsultarEmpresasAsignadas,
  });

  useEffect(() => {
    if (usuario) {
      setForm({
        nombre: usuario.nombre || "",
        email: usuario.email || "",
        contrasena: "",
        rol: usuario.rol || "empleado",
        numero: usuario.numero || "",
        direccion: usuario.direccion || "",
        identificacion: usuario.identificacion || "",
        area_id: usuario.area_id || "",
        area_nombre: usuario.area_nombre || "",
        foto: null
      });
    } else {
      setForm({
        nombre: "",
        email: "",
        contrasena: "",
        rol: "empleado",
        numero: "",
        direccion: "",
        identificacion: "",
        area_id: "",
        foto: null
      });
    }
    setEmpresaSeleccionada("");
  }, [usuario, modoCrear]);

  const empresasDisponibles = useMemo(() => {
    const asignadasIds = new Set(empresasAsignadas.map((item) => item.empresa_id));
    return empresas.filter((empresa) => !asignadasIds.has(empresa.id));
  }, [empresas, empresasAsignadas]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "foto") {
      setForm({ ...form, foto: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    if (modoCrear) {
      if (!form.nombre || !form.email || !form.contrasena || !form.rol) {
        toast.error("Por favor completa los campos obligatorios");
        return;
      }
    }

    if (modoCrear) {
      formData.append("nombre", form.nombre);
      formData.append("email", form.email);
      formData.append("contrasena", form.contrasena);
      formData.append("rol", form.rol);
      if (form.numero) formData.append("numero", form.numero);
      if (form.direccion) formData.append("direccion", form.direccion);
      if (form.identificacion) formData.append("identificacion", form.identificacion);
      if (form.area_id) formData.append("area_id", form.area_id);
      if (form.foto) formData.append("foto", form.foto);
    } else {
      if (form.nombre) formData.append("nombre", form.nombre);
      if (form.email) formData.append("email", form.email);
      if (form.contrasena) formData.append("contrasena", form.contrasena);
      if (form.rol) formData.append("rol", form.rol);
      if (form.numero) formData.append("numero", form.numero);
      if (form.direccion) formData.append("direccion", form.direccion);
      if (form.identificacion) formData.append("identificacion", form.identificacion);
      if (form.area_id) formData.append("area_id", form.area_id);
      if (form.foto) formData.append("foto", form.foto);
    }

    try {
      if (modoCrear) {
        await crearUsuario(formData).unwrap();
        toast.success("Usuario creado correctamente");
        refetchUsuarios();
        setModoCrear(false);
      } else {
        await editarUsuario({ usuario_id: usuario.id, datos: formData }).unwrap();
        toast.success("Usuario actualizado correctamente");
        refetchUsuarios();
      }
      setUsuarioSeleccionado(null);
    } catch (error) {
      const msg = error?.data?.detail || error?.data?.detail?.[0]?.msg || "Error al guardar el usuario";
      toast.error(msg);
    }
  };

  const handleAsignarEmpresa = async () => {
    if (!usuario?.id || !empresaSeleccionada) {
      toast.error("Selecciona una empresa para asignar");
      return;
    }

    try {
      await asignarEmpresaCliente({
        usuario_id: usuario.id,
        empresa_id: empresaSeleccionada,
      }).unwrap();
      toast.success("Empresa asignada correctamente");
      setEmpresaSeleccionada("");
      refetchEmpresasAsignadas();
    } catch (error) {
      const msg = error?.data?.detail || "Error al asignar la empresa";
      toast.error(msg);
    }
  };

  const handleQuitarEmpresa = async (empresaId) => {
    if (!usuario?.id) return;

    try {
      await quitarEmpresaCliente({
        usuario_id: usuario.id,
        empresa_id: empresaId,
      }).unwrap();
      toast.success("Empresa quitada correctamente");
      refetchEmpresasAsignadas();
    } catch (error) {
      const msg = error?.data?.detail || "Error al quitar la empresa";
      toast.error(msg);
    }
  };

  const handleEliminar = async () => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
      try {
        await eliminarUsuario(usuario.id).unwrap();
        toast.success("Usuario eliminado correctamente");
        refetchUsuarios();
        setUsuarioSeleccionado(null);
      } catch (error) {
        const msg = error?.data?.detail || error?.data?.detail?.[0]?.msg || "Error al eliminar el usuario";
        toast.error(msg);
      }
    }
  };

if (!modoCrear && !usuario) {
  return (
    <div className="min-h-[360px] flex items-center justify-center rounded-3xl border border-dashed border-[#dbe8f2] bg-[#f8fbfd] text-center p-8">
      <div>
        <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-[#0A2A47]/10 text-[#0A2A47] flex items-center justify-center">
          <Camera size={24} />
        </div>
        <p className="text-[#0A2A47] font-bold">Selecciona un usuario</p>
        <p className="text-sm text-gray-500 mt-1">El detalle aparecerá aquí para editar su información.</p>
      </div>
    </div>
  );
}

return (
  <div className="w-full">
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <div className="relative overflow-hidden rounded-3xl border border-[#e6f0f8] bg-white shadow-sm p-5 md:p-6">
        <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.10),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(10,42,71,0.06),_transparent_35%)]" />
        <div className="relative flex flex-col gap-5">
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_1fr] gap-6">
            {/* Columna 1: Solo Foto */}
            <div className="flex flex-col items-center justify-center gap-4 w-full rounded-3xl border border-[#e6f0f8] bg-[#f8fbfd] p-5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative h-32 w-32 rounded-3xl border border-[#e6f0f8] bg-white overflow-hidden flex items-center justify-center shadow-sm hover:border-[#3BAE3D] focus:outline-none focus:ring-4 focus:ring-[#3BAE3D]/10 transition"
                title="Seleccionar imagen"
              >
                {form.foto ? (
                  <img src={URL.createObjectURL(form.foto)} alt="Foto" className="h-full w-full object-cover" />
                ) : usuario?.foto ? (
                  <img src={usuario.foto} alt="Foto" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="text-gray-400 h-11 w-11" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-[#071f35]/70 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Cambiar
                </div>
              </button>
              <input
                ref={fileInputRef}
                name="foto"
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
              />
              <div className="text-center">
                <p className="text-sm font-semibold text-[#0A2A47]">Foto de perfil</p>
                <span className="text-xs text-gray-500">Haz click para cambiar la imagen</span>
              </div>
            </div>
            {/* Columna 2 */}
            <div className="flex flex-col gap-4 w-full">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nombre</label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#f8fbfd] text-[#0A2A47] border border-[#dbe8f2] rounded-xl outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10 placeholder:text-gray-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Email</label>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#f8fbfd] text-[#0A2A47] border border-[#dbe8f2] rounded-xl outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10 placeholder:text-gray-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contraseña</label>
                <input
                  name="contrasena"
                  type="password"
                  value={form.contrasena}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#f8fbfd] text-[#0A2A47] border border-[#dbe8f2] rounded-xl outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10 placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Rol</label>
                <select
                  name="rol"
                  value={form.rol}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#f8fbfd] text-[#0A2A47] border border-[#dbe8f2] rounded-xl outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10 placeholder:text-gray-400"
                >
                  <option value="empleado">Empleado</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="cliente">Cliente</option>
                </select>
              </div>
            </div>
            {/* Columna 3 */}
            <div className="flex flex-col gap-4 w-full">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Número</label>
                <input
                  name="numero"
                  value={form.numero}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#f8fbfd] text-[#0A2A47] border border-[#dbe8f2] rounded-xl outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10 placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Dirección</label>
                <input
                  name="direccion"
                  value={form.direccion}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#f8fbfd] text-[#0A2A47] border border-[#dbe8f2] rounded-xl outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10 placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Identificación</label>
                <input
                  name="identificacion"
                  value={form.identificacion}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#f8fbfd] text-[#0A2A47] border border-[#dbe8f2] rounded-xl outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10 placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Área</label>
                <input
                  name="area_nombre"
                  value={form.area_nombre}
                  readOnly
                  className="w-full px-4 py-3 bg-[#eef5fa] text-[#0A2A47] border border-[#dbe8f2] rounded-xl outline-none cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {usuario && form.rol === "cliente" && (
        <div className="relative overflow-hidden border border-[#e6f0f8] rounded-3xl p-5 bg-white shadow-sm">
          <div className="absolute inset-0 pointer-events-none opacity-60 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.08),_transparent_35%)]" />
          <div className="relative flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-[#0A2A47] tracking-tight">Empresas asignadas</h3>
              <p className="text-xs text-[#5b6b79] mt-1">
                Gestiona las empresas cliente que este usuario podrá consultar más adelante.
              </p>
            </div>

            {!puedeConsultarEmpresasAsignadas ? (
              <div className="rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-4 text-sm text-[#5b6b79]">
                Guarda primero el usuario con rol cliente para habilitar la asignación de empresas.
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row gap-3">
                  <select
                    value={empresaSeleccionada}
                    onChange={(e) => setEmpresaSeleccionada(e.target.value)}
                    className="flex-1 px-4 py-3 bg-[#f8fbfd] text-[#0A2A47] border border-[#dbe8f2] rounded-xl outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10 disabled:opacity-60"
                    disabled={asignandoEmpresa}
                  >
                    <option value="">Selecciona una empresa</option>
                    {empresasDisponibles.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.nombre}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAsignarEmpresa}
                    disabled={!empresaSeleccionada || asignandoEmpresa}
                    className="bg-[#071f35] text-white px-5 py-3 rounded-xl font-semibold shadow-sm hover:bg-[#123b63] disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    {asignandoEmpresa ? "Asignando..." : "Asignar"}
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {cargandoEmpresasAsignadas ? (
                    <div className="rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-4 text-sm text-[#5b6b79]">
                      Cargando empresas asignadas...
                    </div>
                  ) : empresasAsignadas.length === 0 ? (
                    <div className="rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-4 text-sm text-[#5b6b79]">
                      Este cliente todavía no tiene empresas asignadas.
                    </div>
                  ) : (
                    empresasAsignadas.map((asignacion) => (
                      <div
                        key={asignacion.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 hover:border-[#3BAE3D]/40 transition"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#0A2A47]">
                            {asignacion.empresa?.nombre || "Empresa sin nombre"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleQuitarEmpresa(asignacion.empresa_id)}
                          disabled={quitandoEmpresa}
                          className="border border-[#dbe8f2] text-[#0A2A47] px-3 py-2 rounded-xl font-semibold hover:bg-red-50 hover:text-red-500 hover:border-red-100 disabled:opacity-60 disabled:cursor-not-allowed transition"
                        >
                          Quitar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Botones */}
      <div className="flex flex-col md:flex-row gap-3 mt-2">
        <button
          type="submit"
          disabled={creando || editando || (usuario?.rol === "admin" && !modoCrear)}
          className="flex-1 bg-[#071f35] text-white py-3 rounded-2xl font-semibold shadow-lg shadow-[#071f35]/10 hover:bg-[#123b63] disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {modoCrear ? "Crear Usuario" : "Guardar Cambios"}
        </button>
        <button
          type="button"
          onClick={handleEliminar}
          className="flex-1 border border-[#dbe8f2] text-[#0A2A47] py-3 rounded-2xl font-semibold hover:bg-red-50 hover:text-red-500 hover:border-red-100 disabled:opacity-60 disabled:cursor-not-allowed transition"
          disabled={modoCrear || usuario?.rol === "admin"}
        >
          Eliminar
        </button>
      </div>
    </form>
    {previewOpen && (
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
        onClick={() => setPreviewOpen(false)}
      >
        <img
          src={form.foto ? URL.createObjectURL(form.foto) : usuario?.foto}
          alt="Vista previa"
          className="max-w-[90%] max-h-[90%] object-contain rounded-3xl shadow-2xl border border-white/20"
        />
      </div>
    )}
  </div>
);
}

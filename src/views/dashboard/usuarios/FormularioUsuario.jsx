import { useState, useEffect, useRef } from "react";
import { useCrearUsuarioMutation, useEditarUsuarioMutation, useEliminarUsuarioMutation } from "../../../redux/api/userApi";
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

  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef(null);

  const [crearUsuario, { isLoading: creando }] = useCrearUsuarioMutation();
  const [editarUsuario, { isLoading: editando }] = useEditarUsuarioMutation();
  const [eliminarUsuario] = useEliminarUsuarioMutation();

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
  }, [usuario, modoCrear]);

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
    return <div className="h-full flex items-center justify-center text-[#333333]">Selecciona un usuario para editar</div>;
  }

  return (
    <div className="w-full">
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Columna 1: Solo Foto */}
          <div className="flex flex-col items-center gap-3 w-full">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative h-28 w-28 rounded-full border border-[#e6f0f8] overflow-hidden flex items-center justify-center hover:border-[#0A2A47] focus:outline-none focus:ring-2 focus:ring-[#0A2A47]"
              title="Seleccionar imagen"
            >
              {form.foto ? (
                <img src={URL.createObjectURL(form.foto)} alt="Foto" className="h-full w-full object-cover" />
              ) : usuario?.foto ? (
                <img src={usuario.foto} alt="Foto" className="h-full w-full object-cover" />
              ) : (
                <Camera className="text-gray-400 h-10 w-10" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
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
            <span className="text-xs text-[#0A2A47]">Haz click en la imagen</span>
          </div>
          {/* Columna 2 */}
          <div className="flex flex-col gap-4 w-full">
            <div>
              <label className="block text-xs font-semibold text-[#0A2A47] mb-1">Nombre</label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="w-full border border-[#0A2A47] rounded-md px-3 py-2 text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0A2A47] mb-1">Email</label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-[#0A2A47] rounded-md px-3 py-2 text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0A2A47] mb-1">Contraseña</label>
              <input
                name="contrasena"
                type="password"
                value={form.contrasena}
                onChange={handleChange}
                className="w-full border border-[#0A2A47] rounded-md px-3 py-2 text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0A2A47] mb-1">Rol</label>
              <select
                name="rol"
                value={form.rol}
                onChange={handleChange}
                className="w-full border border-[#0A2A47] rounded-md px-3 py-2 text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
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
              <label className="block text-xs font-semibold text-[#0A2A47] mb-1">Número</label>
              <input
                name="numero"
                value={form.numero}
                onChange={handleChange}
                className="w-full border border-[#0A2A47] rounded-md px-3 py-2 text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0A2A47] mb-1">Dirección</label>
              <input
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                className="w-full border border-[#0A2A47] rounded-md px-3 py-2 text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0A2A47] mb-1">Identificación</label>
              <input
                name="identificacion"
                value={form.identificacion}
                onChange={handleChange}
                className="w-full border border-[#0A2A47] rounded-md px-3 py-2 text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0A2A47] mb-1">Área</label>
              <input
                name="area_nombre"
                value={form.area_nombre}
                readOnly
                className="w-full border border-[#e6f0f8] bg-[#f5f9fc] rounded-md px-3 py-2 text-[#0A2A47]"
              />
            </div>
          </div>
        </div>
        {/* Botones */}
        <div className="flex flex-col md:flex-row gap-3 mt-4">
          <button
            type="submit"
            disabled={creando || editando || (usuario?.rol === "admin" && !modoCrear)}
            className="flex-1 bg-[#0A2A47] text-white py-2 rounded font-semibold shadow-sm hover:bg-[#123b63]"
          >
            {modoCrear ? "Crear Usuario" : "Guardar Cambios"}
          </button>
          <button
            type="button"
            onClick={handleEliminar}
            className="flex-1 border border-[#0A2A47] text-[#0A2A47] py-2 rounded font-semibold hover:bg-[#e6f0f8]"
            disabled={modoCrear || usuario?.rol === "admin"}
          >
            Eliminar
          </button>
        </div>
      </form>
      {previewOpen && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setPreviewOpen(false)}
        >
          <img
            src={form.foto ? URL.createObjectURL(form.foto) : usuario?.foto}
            alt="Vista previa"
            className="max-w-[90%] max-h-[90%] object-contain"
          />
        </div>
      )}
    </div>
  );
}
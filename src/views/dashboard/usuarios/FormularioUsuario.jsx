import { useState, useEffect } from "react";
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
    <div className="border-1 border-[#0A2A47] p-2 rounded-2xl">
      <h2 className="text-2xl font-bold text-[#0A2A47] mt-4 mb-5">
        {modoCrear ? "Crear Usuario" : "Editar Usuario"}
      </h2>
      <form className="flex flex-col gap-4 mt-4" onSubmit={handleSubmit}>
        <div className="flex flex-col md:grid md:grid-cols-3 gap-4">
          {/* Columna 1: Solo Foto */}
          <div className="flex flex-col items-center gap-2 w-full">
            {form.foto ? (
              <img
                src={URL.createObjectURL(form.foto)}
                alt="Foto"
                className="h-24 w-24 rounded-full object-cover cursor-pointer"
                onClick={() => setPreviewOpen(true)}
              />
            ) : usuario?.foto ? (
              <img
                src={usuario.foto}
                alt="Foto"
                className="h-24 w-24 rounded-full object-cover cursor-pointer"
                onClick={() => setPreviewOpen(true)}
              />
            ) : (
              <div className="h-24 w-24 rounded-full border flex items-center justify-center">
                <Camera className="text-gray-400 h-8 w-8" />
              </div>
            )}
            <input name="foto" type="file" onChange={handleChange} className="text-sm" />
          </div>

          {/* Columna 2 */}
          <div className="flex flex-col gap-4 w-full">
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Nombre"
              className="border-b-2 border-[#0A2A47] rounded px-2 py-1 focus:outline-none"
              required
            />
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              className="border-b-2 border-[#0A2A47] rounded px-2 py-1 focus:outline-none"
              required
            />
            <input
              name="contrasena"
              type="password"
              value={form.contrasena}
              onChange={handleChange}
              placeholder="Contraseña"
              className="border-b-2 border-[#0A2A47] rounded px-2 py-1 focus:outline-none"
            />
            <select
              name="rol"
              value={form.rol}
              onChange={handleChange}
              className="border-b-2 border-[#0A2A47] rounded px-2 py-1 focus:outline-none"
            >
              <option value="empleado">Empleado</option>
              <option value="supervisor">Supervisor</option>
              <option value="cliente">Cliente</option>
            </select>
          </div>

          {/* Columna 3 */}
          <div className="flex flex-col gap-4 w-full">
            <input
              name="numero"
              value={form.numero}
              onChange={handleChange}
              placeholder="Número"
              className="border-b-2 border-[#0A2A47] rounded px-2 py-1 focus:outline-none"
            />
            <input
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              placeholder="Dirección"
              className="border-b-2 border-[#0A2A47] rounded px-2 py-1 focus:outline-none"
            />
            <input
              name="identificacion"
              value={form.identificacion}
              onChange={handleChange}
              placeholder="Identificación"
              className="border-b-2 border-[#0A2A47] rounded px-2 py-1 focus:outline-none"
            />
            <input
              name="area_nombre"
              value={form.area_nombre}
              readOnly
              placeholder="Área"
              className="border-b-2 border-[#0A2A47] bg-gray-100 rounded px-2 py-1 focus:outline-none"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            disabled={creando || editando || (usuario?.rol === "admin" && !modoCrear)}
            className="flex-1 bg-[#0A2A47] text-white py-1 rounded hover:bg-[#3BAE3D]"
          >
            {modoCrear ? "Crear Usuario" : "Guardar Cambios"}
          </button>
          <button
            type="button"
            onClick={handleEliminar}
            className="flex-1 border border-[#0A2A47] text-[#0A2A47] py-1 rounded hover:bg-gray-100"
            disabled={modoCrear || usuario?.rol === "admin"}
          >
            Eliminar
          </button>
        </div>
      </form>
      {previewOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
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
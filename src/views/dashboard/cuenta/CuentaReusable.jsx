import { useSelector } from "react-redux";
import { useObtenerMiCompaniaQuery, useCambiarContrasenaMutation } from "../../../redux/api/userApi";
import { useState } from "react";
import { toast } from "react-toastify";

function CuentaReusable() {
  const usuario = useSelector((state) => state.usuarios.usuarioLogueado);
  const { data: compania } = useObtenerMiCompaniaQuery();
  const [cambiarContrasena, { isLoading }] = useCambiarContrasenaMutation();

  const [form, setForm] = useState({
    contrasena_actual: "",
    nueva_contrasena: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.contrasena_actual || !form.nueva_contrasena) {
      return toast.error("Completa ambos campos");
    }
    try {
      await cambiarContrasena({
        usuario_id: usuario.id,
        contrasena_actual: form.contrasena_actual,
        nueva_contrasena: form.nueva_contrasena,
      }).unwrap();
      toast.success("Contraseña actualizada correctamente");
      setForm({ contrasena_actual: "", nueva_contrasena: "" });
    } catch (error) {
      toast.error(error?.data?.detail || "Error al cambiar contraseña");
    }
  };

  return (
    <div className="w-full max-w-[100%] md:max-w-2xl mx-auto space-y-6">
      <div className="border-1 border-[#0A2A47] p-6 rounded-2xl">
        <h2 className="text-2xl font-bold text-[#0A2A47] mb-4">Mi Información</h2>
        <div className="flex justify-center mb-4">
            <img
            src={usuario?.foto || "https://via.placeholder.com/100"}
            alt="Foto de perfil"
            className="w-24 h-24 rounded-full object-cover"
            />
        </div>
        <div className="space-y-2 text-lg">
          <div className="flex justify-between">
            <label className="text-[#0A2A47] font-semibold">Nombre:</label>
            <p>{usuario?.nombre || "No disponible"}</p>
          </div>
          <div className="flex justify-between">
            <label className="text-[#0A2A47] font-semibold">Correo:</label>
            <p>{usuario?.email || "No disponible"}</p>
          </div>
          <div className="flex justify-between">
            <label className="text-[#0A2A47] font-semibold">Número:</label>
            <p>{usuario?.numero || "No disponible"}</p>
          </div>
          <div className="flex justify-between">
            <label className="text-[#0A2A47] font-semibold">Dirección:</label>
            <p>{usuario?.direccion || "No disponible"}</p>
          </div>
          <div className="flex justify-between">
            <label className="text-[#0A2A47] font-semibold">Identificación:</label>
            <p>{usuario?.identificacion || "No disponible"}</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-[#0A2A47] mt-8 mb-4">Cambiar Contraseña</h2>
        <div className="space-y-4 border-1 border-[#0A2A47] p-6 rounded-2xl">
            <div>
            <label className="text-[#0A2A47] font-semibold">Contraseña Actual:</label>
            <input
                type="password"
                name="contrasena_actual"
                value={form.contrasena_actual}
                onChange={handleChange}
                className="w-full border border-[#0A2A47] rounded px-3 py-2"
            />
            </div>
            <div>
            <label className="text-[#0A2A47] font-semibold">Nueva Contraseña:</label>
            <input
                type="password"
                name="nueva_contrasena"
                value={form.nueva_contrasena}
                onChange={handleChange}
                className="w-full border border-[#0A2A47] rounded px-3 py-2"
            />
            </div>
            <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-[#3BAE3D] text-white font-bold py-2 px-4 rounded w-full hover:bg-[#a0dea1]"
            >
            {isLoading ? "Actualizando..." : "Cambiar Contraseña"}
            </button>
        </div>
      </div>

      <div className="border-1 border-[#0A2A47] p-6 rounded-2xl">
        <h2 className="text-2xl font-bold text-[#0A2A47] mb-4 text-center">Miembro De</h2>
        {compania ? (
          <div className="space-y-2">
            {compania?.logo && (
              <img
                src={compania.logo}
                alt="Logo de la empresa"
                className="w-[90%] md:w-[40%] object-contain mb-4 mx-auto"
              />
            )}
            <div className="flex justify-between">
              <label className="text-[#0A2A47] font-semibold">Empresa:</label>
              <p>{compania?.nombre || "No disponible"}</p>
            </div>
            <div className="flex justify-between">
              <label className="text-[#0A2A47] font-semibold">Dirección:</label>
              <p>{compania?.direccion || "No disponible"}</p>
            </div>
            <div className="flex justify-between">
              <label className="text-[#0A2A47] font-semibold">Teléfono:</label>
              <p>{compania?.telefono || "No disponible"}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Cargando información de la empresa...</p>
        )}
      </div>
    </div>
  );
}

export default CuentaReusable;
import { useSelector } from "react-redux";
import { useObtenerMiCompaniaQuery, useCambiarContrasenaMutation } from "../../../redux/api/userApi";
import { useState } from "react";
import { toast } from "react-toastify";
import { Building2, KeyRound, Mail, MapPin, Phone, ShieldCheck, User2 } from "lucide-react";

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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-[28px] border border-[#e6f0f8] bg-white shadow-sm">
          <div className="border-b border-[#edf3f8] px-5 py-5 md:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#dbe8f2] bg-[#f8fbfd] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3BAE3D]">
                  <ShieldCheck size={14} />
                  Mi informaci&oacute;n
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-[#0A2A47]">
                  Perfil personal
                </h2>
                <p className="mt-1 text-sm text-[#5b6b79]">
                  Datos visibles de tu cuenta y acceso dentro de TYDY.
                </p>
              </div>
              <div className="flex items-center gap-4 rounded-3xl border border-[#e6f0f8] bg-[#fbfdff] px-4 py-3">
                <img
                  src={usuario?.foto || "https://via.placeholder.com/100"}
                  alt="Foto de perfil"
                  className="h-16 w-16 rounded-2xl object-cover ring-4 ring-[#f4f8fb]"
                />
                <div>
                  <p className="text-base font-semibold text-[#0A2A47]">
                    {usuario?.nombre || "Usuario"}
                  </p>
                  <p className="text-sm text-[#5b6b79]">
                    {usuario?.email || "Sin correo disponible"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-5 md:grid-cols-2 md:p-6">
            <div className="rounded-2xl border border-[#e6f0f8] bg-[#fbfdff] p-4">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#dbe8f2] bg-white text-[#0A2A47]">
                <User2 size={18} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">
                Nombre
              </p>
              <p className="mt-2 text-sm font-semibold text-[#0A2A47]">
                {usuario?.nombre || "No disponible"}
              </p>
            </div>

            <div className="rounded-2xl border border-[#e6f0f8] bg-[#fbfdff] p-4">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#dbe8f2] bg-white text-[#0A2A47]">
                <Mail size={18} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">
                Correo
              </p>
              <p className="mt-2 break-all text-sm font-semibold text-[#0A2A47]">
                {usuario?.email || "No disponible"}
              </p>
            </div>

            <div className="rounded-2xl border border-[#e6f0f8] bg-[#fbfdff] p-4">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#dbe8f2] bg-white text-[#0A2A47]">
                <Phone size={18} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">
                N&uacute;mero
              </p>
              <p className="mt-2 text-sm font-semibold text-[#0A2A47]">
                {usuario?.numero || "No disponible"}
              </p>
            </div>

            <div className="rounded-2xl border border-[#e6f0f8] bg-[#fbfdff] p-4">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#dbe8f2] bg-white text-[#0A2A47]">
                <MapPin size={18} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">
                Direcci&oacute;n
              </p>
              <p className="mt-2 text-sm font-semibold text-[#0A2A47]">
                {usuario?.direccion || "No disponible"}
              </p>
            </div>

            <div className="rounded-2xl border border-[#e6f0f8] bg-[#fbfdff] p-4 md:col-span-2">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#dbe8f2] bg-white text-[#0A2A47]">
                <ShieldCheck size={18} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">
                Identificaci&oacute;n
              </p>
              <p className="mt-2 text-sm font-semibold text-[#0A2A47]">
                {usuario?.identificacion || "No disponible"}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-[#e6f0f8] bg-white shadow-sm">
          <div className="border-b border-[#edf3f8] px-5 py-5 md:px-6">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#dbe8f2] bg-[#f8fbfd] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3BAE3D]">
              <KeyRound size={14} />
              Seguridad
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#0A2A47]">
              Cambiar contrase&ntilde;a
            </h2>
            <p className="mt-1 text-sm text-[#5b6b79]">
              Actualiza tu acceso sin salir de esta vista.
            </p>
          </div>

          <div className="space-y-4 p-5 md:p-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#0A2A47]">
                Contrase&ntilde;a actual
              </label>
              <input
                type="password"
                name="contrasena_actual"
                value={form.contrasena_actual}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-sm text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#0A2A47]">
                Nueva contrase&ntilde;a
              </label>
              <input
                type="password"
                name="nueva_contrasena"
                value={form.nueva_contrasena}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-sm text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-[#3BAE3D] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#3BAE3D]/20 transition hover:-translate-y-0.5 hover:bg-[#329734] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "Actualizando..." : "Cambiar contrase\u00f1a"}
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#e6f0f8] bg-white shadow-sm">
        <div className="border-b border-[#edf3f8] px-5 py-5 md:px-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#dbe8f2] bg-[#f8fbfd] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3BAE3D]">
            <Building2 size={14} />
            Miembro de
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0A2A47]">
            Compa&ntilde;&iacute;a asociada
          </h2>
          <p className="mt-1 text-sm text-[#5b6b79]">
            Informaci&oacute;n base de la empresa vinculada a tu cuenta.
          </p>
        </div>

        {compania ? (
          <div className="grid gap-6 p-5 md:grid-cols-[0.8fr_1.2fr] md:p-6">
            <div className="flex min-h-[220px] items-center justify-center rounded-[24px] border border-[#e6f0f8] bg-[#fbfdff] p-6">
              {compania?.logo ? (
                <img
                  src={compania.logo}
                  alt="Logo de la empresa"
                  className="max-h-36 w-full object-contain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-[20px] border border-dashed border-[#dbe8f2] bg-white text-sm font-medium text-[#7b8a97]">
                  Sin logo disponible
                </div>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-[#e6f0f8] bg-[#fbfdff] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">
                  Empresa
                </p>
                <p className="mt-2 text-sm font-semibold text-[#0A2A47]">
                  {compania?.nombre || "No disponible"}
                </p>
              </div>
              <div className="rounded-2xl border border-[#e6f0f8] bg-[#fbfdff] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">
                  Direcci&oacute;n
                </p>
                <p className="mt-2 text-sm font-semibold text-[#0A2A47]">
                  {compania?.direccion || "No disponible"}
                </p>
              </div>
              <div className="rounded-2xl border border-[#e6f0f8] bg-[#fbfdff] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">
                  Tel&eacute;fono
                </p>
                <p className="mt-2 text-sm font-semibold text-[#0A2A47]">
                  {compania?.telefono || "No disponible"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-5 py-10 text-center text-sm font-medium text-[#7b8a97] md:px-6">
            Cargando informaci&oacute;n de la empresa...
          </div>
        )}
      </section>
    </div>
  );
}

export default CuentaReusable;

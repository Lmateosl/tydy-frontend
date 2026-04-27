import { useObtenerEstructuraUsuarioQuery } from "../../redux/api/userApi";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Layout from "../../components/Layout";
import { Building2, MapPin, Play, ShieldCheck } from "lucide-react";

function Lugar() {
  const usuario = useSelector((state) => state.usuarios.usuarioLogueado);
  const navigate = useNavigate();

  const { data, isLoading, error } = useObtenerEstructuraUsuarioQuery(usuario?.id);

  if (error) {
    toast.error(error?.data?.detail || "Error al obtener la información");
  }

  return (
    <Layout>
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-5 md:px-6">
        <section className="relative overflow-hidden rounded-[28px] border border-[#e6f0f8] bg-white p-5 shadow-xl shadow-[#0A2A47]/5 md:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.16),_transparent_38%),radial-gradient(circle_at_bottom_left,_rgba(10,42,71,0.1),_transparent_42%)]" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#3BAE3D]">
                Verificación
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight text-[#0A2A47] md:text-4xl">
                Lugar de trabajo
              </h2>
              <p className="mt-2 text-sm text-[#5b6b79]">
                Revisa la ubicación asignada antes de empezar tus actividades y valida que te
                encuentras en el punto correcto.
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-2 text-sm font-semibold text-[#0A2A47]">
              <ShieldCheck size={16} />
              Acceso verificado
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-[#e6f0f8] bg-white shadow-sm">
          <div className="border-b border-[#edf3f8] px-5 py-5 md:px-6">
            <h3 className="text-2xl font-bold tracking-tight text-[#0A2A47]">
              Información asignada
            </h3>
            <p className="mt-1 text-sm text-[#5b6b79]">
              Datos de empresa, locación y área configurados para tu jornada.
            </p>
          </div>

          <div className="p-5 md:p-6">
            {isLoading ? (
              <div className="rounded-[24px] border border-dashed border-[#dbe8f2] bg-[#f8fbfd] px-5 py-10 text-center text-sm font-medium text-[#6b7b88]">
                Cargando información...
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[24px] border border-[#e6f0f8] bg-[#fbfdff] p-6 text-center">
                  <img
                    src={data?.locacion?.empresa?.imagen || "https://via.placeholder.com/100"}
                    alt="Logo empresa"
                    className="h-24 w-24 rounded-3xl object-cover ring-4 ring-white"
                  />
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">
                    Empresa
                  </p>
                  <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#0A2A47]">
                    {data?.locacion?.empresa?.nombre || "Empresa desconocida"}
                  </h3>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-[#e6f0f8] bg-[#fbfdff] p-4">
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#dbe8f2] bg-white text-[#0A2A47]">
                      <MapPin size={18} />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">
                      Locación
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#0A2A47]">
                      {data?.locacion?.nombre || "No disponible"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#e6f0f8] bg-[#fbfdff] p-4">
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#dbe8f2] bg-white text-[#0A2A47]">
                      <Building2 size={18} />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">
                      Área
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#0A2A47]">
                      {data?.nombre || "No disponible"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#e6f0f8] bg-[#fbfdff] p-4 md:col-span-2">
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#dbe8f2] bg-white text-[#0A2A47]">
                      <MapPin size={18} />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">
                      Dirección
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#0A2A47]">
                      {data?.locacion?.direccion || "No disponible"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-[#e6f0f8] bg-white shadow-sm">
          <div className="p-5 text-center md:p-6">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] text-[#3BAE3D]">
              <ShieldCheck size={22} />
            </div>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[#0A2A47]">
              Para iniciar tus actividades debes encontrarte dentro de tu <strong className="text-[#3BAE3D]">lugar de trabajo</strong>. Una vez allí, podrás comenzar a escanear los códigos QR y completar tus tareas de manera segura y eficiente con <span className="font-bold text-[#3BAE3D]">TYDY</span>.
            </p>

            <button
              onClick={() => navigate("/main")}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#3BAE3D] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#3BAE3D]/20 transition hover:-translate-y-0.5 hover:bg-[#329734]"
            >
              <Play size={16} />
              Empezar Actividades
            </button>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default Lugar;

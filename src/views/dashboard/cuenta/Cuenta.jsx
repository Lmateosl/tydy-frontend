import Layout from "../../../components/Layout";
import CuentaReusable from "./CuentaReusable";

export default function Cuenta() {
  return (
    <Layout>
      <div className="px-4 py-5 md:px-6">
        <section className="relative mb-6 overflow-hidden rounded-[28px] border border-[#e6f0f8] bg-white p-5 shadow-xl shadow-[#0A2A47]/5 md:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.16),_transparent_38%),radial-gradient(circle_at_bottom_left,_rgba(10,42,71,0.1),_transparent_42%)]" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#3BAE3D]">
                Cuenta
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#0A2A47] md:text-4xl">
                Tu perfil y acceso
              </h1>
              <p className="mt-2 max-w-xl text-sm text-[#5b6b79]">
                Consulta tu informaci&oacute;n, actualiza tu contrase&ntilde;a y revisa los
                datos de la compa&ntilde;&iacute;a desde un espacio m&aacute;s claro y ordenado.
              </p>
            </div>
            <div className="inline-flex w-fit items-center rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-2 text-sm font-semibold text-[#0A2A47]">
              Panel personal
            </div>
          </div>
        </section>
        <CuentaReusable />
      </div>
    </Layout>
  );
}

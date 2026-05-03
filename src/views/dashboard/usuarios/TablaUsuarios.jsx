import { useState } from "react";
import { ArrowUpDown, Building2, CircleHelp, MapPin } from "lucide-react";
import defaultFoto from "../../../assets/imgs/userFoto.png";

export default function TablaUsuarios({
  usuarios,
  isLoading,
  isError,
  usuarioSeleccionado,
  setUsuarioSeleccionado,
  setModoCrear,
}) {
  const [orden, setOrden] = useState({ campo: "", asc: true });
  const [detalleSupervisor, setDetalleSupervisor] = useState(null);

  const ordenarPor = (campo) => {
    const asc = orden.campo === campo ? !orden.asc : true;
    setOrden({ campo, asc });
  };

  const usuariosOrdenados = [...usuarios].sort((a, b) => {
    if (!orden.campo) return 0;
    const valA = a[orden.campo]?.toString().toLowerCase() || "";
    const valB = b[orden.campo]?.toString().toLowerCase() || "";
    if (valA < valB) return orden.asc ? -1 : 1;
    if (valA > valB) return orden.asc ? 1 : -1;
    return 0;
  });

  if (isLoading) return <p className="text-center">Cargando usuarios...</p>;
  if (isError) return <p className="text-center text-red-500">Error al cargar usuarios</p>;
  if (!usuarios.length) return <p className="text-center">No hay usuarios para mostrar</p>;

  return (
    <>
      <div className="bg-white/95 backdrop-blur-md rounded-2xl w-full h-full max-h-[calc(100vh-200px)] overflow-auto border border-[#e6f0f8] shadow-md">
        <table className="w-full text-[#0A2A47] text-sm">
          <thead className="bg-white/90 backdrop-blur sticky top-0 z-10 border-b border-[#e6f0f8]">
            <tr>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Foto</th>
              {['nombre', 'email', 'rol', 'numero', 'direccion', 'identificacion', 'cobertura_supervision'].map((campo) => (
                <th key={campo} className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none" onClick={() => ordenarPor(campo)}>
                  <div className="flex items-center gap-1 justify-center text-gray-600">
                    {campo === "cobertura_supervision" ? "Cobertura" : campo.charAt(0).toUpperCase() + campo.slice(1)}
                    <ArrowUpDown size={14} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuariosOrdenados.map((u) => (
              <tr
                key={u.id}
                className={`cursor-pointer transition-all border-b border-[#edf3f8] hover:bg-[#f4f8fb] ${usuarioSeleccionado?.id === u.id ? 'bg-[#eaf3fb] border-l-4 border-[#071f35]' : ''}`}
                onClick={() => {
                  setUsuarioSeleccionado(u);
                  setModoCrear(false);
                }}
              >
                <td className="py-3 px-4">
                  <img
                    src={u.foto ? u.foto : defaultFoto}
                    alt="foto"
                    className="h-10 w-10 rounded-xl object-cover border border-[#e6f0f8] shadow-sm"
                  />
                </td>
                <td className="py-3 px-4 font-semibold text-[#0A2A47]">{u.nombre}</td>
                <td className="py-3 px-4">{u.email}</td>
                <td className="py-3 px-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f4f8fb] border border-[#e6f0f8] capitalize">
                    {u.rol}
                  </span>
                </td>
                <td className="py-3 px-4">{u.numero || "-"}</td>
                <td className="py-3 px-4">{u.direccion || "-"}</td>
                <td className="py-3 px-4">{u.identificacion || "-"}</td>
                <td className="py-3 px-4">
                  {u.rol === "supervisor" ? (
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          u.cobertura_supervision === "Sin locaciones asignadas"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-[#dbe8f2] bg-[#f4f8fb] text-[#0A2A47]"
                        }`}
                      >
                        {u.cobertura_supervision}
                      </span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDetalleSupervisor(u);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#dbe8f2] bg-white text-[#5b6b79] transition hover:border-[#0A2A47] hover:text-[#0A2A47]"
                        title="Ver detalle de cobertura"
                      >
                        <CircleHelp size={16} />
                      </button>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detalleSupervisor && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-3xl border border-[#e6f0f8] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e6f0f8] px-5 py-5 md:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7b8a97]">
                  Cobertura de supervisión
                </p>
                <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0A2A47]">
                  {detalleSupervisor.nombre}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetalleSupervisor(null)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f4f8fb] text-[#0A2A47] transition hover:bg-[#e6f0f8]"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-2 md:px-6 md:py-6">
              <div className="rounded-3xl border border-[#e6f0f8] bg-[#f8fbfd] p-4">
                <div className="mb-3 flex items-center gap-2 text-[#0A2A47]">
                  <MapPin size={16} />
                  <h4 className="text-sm font-bold">Locaciones</h4>
                </div>
                {detalleSupervisor.supervision_locaciones?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {detalleSupervisor.supervision_locaciones.map((locacion) => (
                      <span
                        key={locacion}
                        className="inline-flex rounded-full border border-[#dbe8f2] bg-white px-3 py-1 text-xs font-semibold text-[#0A2A47]"
                      >
                        {locacion}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#7b8a97]">Sin locaciones asignadas.</p>
                )}
              </div>

              <div className="rounded-3xl border border-[#e6f0f8] bg-[#f8fbfd] p-4">
                <div className="mb-3 flex items-center gap-2 text-[#0A2A47]">
                  <Building2 size={16} />
                  <h4 className="text-sm font-bold">Empresas</h4>
                </div>
                {detalleSupervisor.supervision_empresas?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {detalleSupervisor.supervision_empresas.map((empresa) => (
                      <span
                        key={empresa}
                        className="inline-flex rounded-full border border-[#dbe8f2] bg-white px-3 py-1 text-xs font-semibold text-[#0A2A47]"
                      >
                        {empresa}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#7b8a97]">Sin empresas relacionadas.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

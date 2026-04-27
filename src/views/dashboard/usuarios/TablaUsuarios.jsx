import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
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
    <div className="bg-white/95 backdrop-blur-md rounded-2xl w-full h-full max-h-[calc(100vh-200px)] overflow-auto border border-[#e6f0f8] shadow-md">
      <table className="w-full text-[#0A2A47] text-sm">
        <thead className="bg-white/90 backdrop-blur sticky top-0 z-10 border-b border-[#e6f0f8]">
          <tr>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Foto</th>
            {['nombre', 'email', 'rol', 'numero', 'direccion', 'identificacion'].map((campo) => (
              <th key={campo} className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none" onClick={() => ordenarPor(campo)}>
                <div className="flex items-center gap-1 justify-center text-gray-600">
                  {campo.charAt(0).toUpperCase() + campo.slice(1)}
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
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
    <div className="bg-white rounded-xl w-full h-full max-h-[calc(100vh-200px)] overflow-auto border border-[#e6f0f8] shadow-sm">
      <table className="w-full text-[#0A2A47]">
        <thead className="bg-white text-[#0A2A47] border-b border-[#e6f0f8] sticky top-0 z-10">
          <tr>
            <th className="py-2 px-3">Foto</th>
            {['nombre', 'email', 'rol', 'numero', 'direccion', 'identificacion'].map((campo) => (
              <th key={campo} className="py-2 px-3 cursor-pointer" onClick={() => ordenarPor(campo)}>
                <div className="flex items-center gap-1 justify-center">
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
              className={`cursor-pointer transition-colors border-b border-[#e6f0f8] hover:bg-[#e6f0f8] ${usuarioSeleccionado?.id === u.id ? 'bg-[#d6e6f5] border-l-4 border-[#0A2A47]' : ''}`}
              onClick={() => {
                setUsuarioSeleccionado(u);
                setModoCrear(false);
              }}
            >
              <td className="py-2 px-3">
                <img
                  src={u.foto ? u.foto : defaultFoto}
                  alt="foto"
                  className="h-10 w-10 rounded-full object-cover border border-[#e6f0f8]"
                />
              </td>
              <td className="py-2 px-3 font-medium">{u.nombre}</td>
              <td className="py-2 px-3">{u.email}</td>
              <td className="py-2 px-3 capitalize">{u.rol}</td>
              <td className="py-2 px-3">{u.numero || "-"}</td>
              <td className="py-2 px-3">{u.direccion || "-"}</td>
              <td className="py-2 px-3">{u.identificacion || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
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
    <div className="bg-white rounded-xl max-h-[20vh] xl:max-h-[40vh] w-full overflow-auto">
      <table className="w-full text-[#333333]">
        <thead className="bg-[#0A2A47] text-white sticky top-0 z-10">
          <tr>
            <th className="p-2">Foto</th>
            {['nombre', 'email', 'rol', 'numero', 'direccion', 'identificacion'].map((campo) => (
              <th key={campo} className="p-2 cursor-pointer" onClick={() => ordenarPor(campo)}>
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
              className={`hover:bg-gray-100 cursor-pointer ${usuarioSeleccionado?.id === u.id ? 'bg-gray-200' : 'bg-white'}`}
              onClick={() => {
                setUsuarioSeleccionado(u);
                setModoCrear(false);
              }}
            >
              <td className="p-2">
                <img
                  src={u.foto ? u.foto : defaultFoto}
                  alt="foto"
                  className="h-10 w-10 rounded-full object-cover"
                />
              </td>
              <td className="p-2">{u.nombre}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2 capitalize">{u.rol}</td>
              <td className="p-2">{u.numero || "-"}</td>
              <td className="p-2">{u.direccion || "-"}</td>
              <td className="p-2">{u.identificacion || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
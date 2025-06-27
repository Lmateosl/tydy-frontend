import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import { Plus, Trash2, Save, ArrowDown, ArrowUp, Camera } from "lucide-react";
import {
  useCrearEmpresaMutation,
  useEditarEmpresaMutation,
  useEliminarEmpresaMutation
} from '../../../redux/api/empresasApi'

export default function CardEmpresas({ empresas, setEmpresaSeleccionada, empresaSeleccionada, refetch, refreshTotales }) {
  const [filtro, setFiltro] = useState("");
  const [modoCrear, setModoCrear] = useState(false);
  const [ordenAsc, setOrdenAsc] = useState(true);
  const [form, setForm] = useState({ nombre: "", foto: null });

  const [crearEmpresa] = useCrearEmpresaMutation();
  const [editarEmpresa] = useEditarEmpresaMutation();
  const [eliminarEmpresa] = useEliminarEmpresaMutation();

  const empresasFiltradas = useMemo(() => {
    let filtradas = empresas.filter((e) => e.nombre.toLowerCase().includes(filtro.toLowerCase()));
    return filtradas.sort((a, b) => {
      if (ordenAsc) return a.nombre.localeCompare(b.nombre);
      else return b.nombre.localeCompare(a.nombre);
    });
  }, [filtro, empresas, ordenAsc]);

  const handleSelect = (empresa) => {
    setEmpresaSeleccionada(empresa);
    setModoCrear(false);
    setForm({ nombre: empresa.nombre, foto: null });
  };

  const handleCrear = async () => {
    if (!form.nombre) return toast.error("El nombre es obligatorio");
    const formData = new FormData();
    formData.append("nombre", form.nombre);
    if (form.foto) formData.append("imagen", form.foto);
    try {
      await crearEmpresa(formData).unwrap();
      toast.success("Empresa creada con éxito");
      refetch();
      refreshTotales();
      setForm({ nombre: "", foto: null });
      setModoCrear(false);
    } catch {
      toast.error("Error al crear empresa");
    }
  };

  const handleEditar = async () => {
    if (!form.nombre) return toast.error("El nombre es obligatorio");
    const formData = new FormData();
    formData.append("nombre", form.nombre);
    if (form.foto) formData.append("imagen", form.foto);
    try {
      await editarEmpresa({ empresa_id: empresaSeleccionada.id, datos: formData }).unwrap();
      toast.success("Empresa actualizada con éxito");
      refetch();
    } catch {
      toast.error("Error al actualizar empresa");
    }
  };

  const handleEliminar = async () => {
    try {
      await eliminarEmpresa(empresaSeleccionada.id).unwrap();
      toast.success("Empresa eliminada");
      setEmpresaSeleccionada(null);
      refetch();
      refreshTotales();
    } catch {
      toast.error("Error al eliminar empresa");
    }
  };

  return (
    <div className="bg-[#0A2A47] p-4 rounded-xl flex flex-col h-full">
      <h2 className="text-xl font-bold text-white mb-4 text-center">Empresas</h2>
      <button onClick={() => { setModoCrear(true); setEmpresaSeleccionada(null); setForm({ nombre: "", foto: null }); }} className="bg-[#3BAE3D] text-white w-full py-1 mb-2 rounded hover:bg-[#a0dea1]">
        <Plus className="inline mr-1" size={16} /> Crear Empresa
      </button>
      <input
        placeholder="Buscar empresa"
        className="border border-white bg-white rounded px-2 py-1 mb-4 w-full text-[#333333] placeholder:text-[#333333]"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
      />

      <div className="flex-1 overflow-auto rounded-xl">
        <table className="w-full text-center text-white rounded-xl">
          <thead className="sticky top-0 bg-white text-[#0A2A47] rounded-2xl">
            <tr>
              <th className="py-1">Foto</th>
              <th className="py-1 cursor-pointer flex items-center justify-center" onClick={() => setOrdenAsc(!ordenAsc)}>Nombre {ordenAsc ? <ArrowUp size={14} /> : <ArrowDown size={14} />}</th>
            </tr>
          </thead>
          <tbody>
            {empresasFiltradas.map((e) => (
              <tr key={e.id} className={`cursor-pointer hover:bg-[#a0dea1] ${empresaSeleccionada?.id === e.id ? "bg-[#3BAE3D]" : ""}`} onClick={() => handleSelect(e)}>
                <td className="py-1 flex justify-center">
                  {e.imagen ? <img src={e.imagen} alt="Foto" className="h-8 w-8 rounded-full object-cover" /> : <div className="h-8 w-8 rounded-full border flex items-center justify-center"><Camera size={14} className="text-gray-400" /></div>}
                </td>
                <td className="py-1">{e.nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(modoCrear || empresaSeleccionada) && (
        <div className="pt-2">
          <h3 className="font-bold mb-4 text-[18px] text-white">{modoCrear ? "Crear Empresa" : "Editar Empresa"}</h3>
          <div className="flex flex-col items-center gap-2 mb-2 text-white text-wrap w-full">
            {form.foto ? (
              <img src={URL.createObjectURL(form.foto)} alt="Foto" className="h-24 w-24 rounded-full object-cover" />
            ) : empresaSeleccionada?.imagen ? (
              <img src={empresaSeleccionada.imagen} alt="Foto" className="h-24 w-24 rounded-full object-cover" />
            ) : (
              <div className="h-24 w-24 rounded-full border flex items-center justify-center">
                <Camera className="text-gray-400 h-8 w-8" />
              </div>
            )}
            <input type="file" onChange={(e) => setForm({ ...form, foto: e.target.files[0] })} className="text-sm w-[95%] text-wrap text-center" />
          </div>
          <input
            placeholder="Nombre de la empresa"
            className="border border-white bg-white rounded-md px-2 py-1 mb-2 w-full text-[#333333] placeholder:text-[#333333]"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
          {modoCrear ? (
            <button onClick={handleCrear} className="bg-[#3BAE3D] text-white w-full py-1 rounded hover:bg-[#0A2A47]">Crear</button>
          ) : (
            <>
              <button onClick={handleEditar} className="bg-[#3BAE3D] text-white w-full py-1 mb-2 rounded hover:bg-[#a0dea1]">Actualizar</button>
              <button onClick={handleEliminar} className="border border-white text-white w-full py-1 rounded hover:bg-[#a0dea1]">Eliminar</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

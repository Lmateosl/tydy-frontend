import { useState, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import { Plus, ArrowDown, ArrowUp, Camera, Pencil } from "lucide-react";
import {
  useCrearEmpresaMutation,
  useEditarEmpresaMutation,
  useEliminarEmpresaMutation
} from '../../../redux/api/empresasApi'

export default function CardEmpresas({ empresas, setEmpresaSeleccionada, empresaSeleccionada, refetch, refreshTotales }) {
  const [filtro, setFiltro] = useState("");
  const [modoCrear, setModoCrear] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [ordenAsc, setOrdenAsc] = useState(true);
  const [form, setForm] = useState({ nombre: "", foto: null });
  const fileInputRef = useRef(null);

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
    setModalEditarAbierto(false);
  };

  const handleOpenEditar = (empresa) => {
    setEmpresaSeleccionada(empresa);
    setModoCrear(false);
    setModalEditarAbierto(true);
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
      setModalEditarAbierto(false);
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
      setModalEditarAbierto(false);
    } catch {
      toast.error("Error al actualizar empresa");
    }
  };

  const handleEliminar = async () => {
    try {
      await eliminarEmpresa(empresaSeleccionada.id).unwrap();
      toast.success("Empresa eliminada");
      setEmpresaSeleccionada(null);
      setModalEditarAbierto(false);
      refetch();
      refreshTotales();
    } catch {
      toast.error("Error al eliminar empresa");
    }
  };

  return (
    <div className="bg-white border border-[#0A2A47] p-4 rounded-xl flex flex-col h-full">
      <h2 className="text-xl font-bold text-[#0A2A47] mb-4 text-center">Empresas</h2>
      <button onClick={() => { setModoCrear(true); setModalEditarAbierto(false); setEmpresaSeleccionada(null); setForm({ nombre: "", foto: null }); }} className="bg-[#0A2A47] text-white w-full py-1 mb-2 rounded font-semibold shadow-sm hover:bg-[#123b63]">
        <Plus className="inline mr-1" size={16} /> Crear Empresa
      </button>
      <input
        placeholder="Buscar empresa"
        className="border border-[#0A2A47] bg-white rounded px-2 py-1 mb-4 w-full text-[#0A2A47] placeholder:text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
      />

      <div className="flex-1 overflow-auto rounded-xl border border-[#e6f0f8]">
        <table className="w-full text-center text-[#0A2A47]">
          <thead className="sticky top-0 bg-white text-[#0A2A47] border-b border-[#e6f0f8]">
            <tr>
              <th className="py-2 px-3">Foto</th>
              <th className="py-2 px-3 cursor-pointer flex items-center justify-center" onClick={() => setOrdenAsc(!ordenAsc)}>Nombre {ordenAsc ? <ArrowUp size={14} /> : <ArrowDown size={14} />}</th>
            </tr>
          </thead>
          <tbody>
            {empresasFiltradas.map((e) => (
              <tr
                key={e.id}
                className={`cursor-pointer transition-colors border-b border-[#e6f0f8] hover:bg-[#e6f0f8] ${empresaSeleccionada?.id === e.id ? "bg-[#d6e6f5] border-l-4 border-[#0A2A47]" : ""}`}
                onClick={() => handleSelect(e)}
              >
                <td className="py-2 px-3 flex justify-center">
                  {e.imagen ? <img src={e.imagen} alt="Foto" className="h-8 w-8 rounded-full object-cover" /> : <div className="h-8 w-8 rounded-full border flex items-center justify-center"><Camera size={14} className="text-gray-400" /></div>}
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center justify-center gap-2">
                    <span>{e.nombre}</span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenEditar(e);
                      }}
                      className="rounded-full p-1 text-[#0A2A47] hover:bg-[#d6e6f5]"
                      title="Editar empresa"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(modoCrear || modalEditarAbierto) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white border border-[#0A2A47] shadow-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[18px] text-[#0A2A47]">
                {modoCrear ? "Crear Empresa" : "Editar Empresa"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setModoCrear(false);
                  setModalEditarAbierto(false);
                  setForm({ nombre: "", foto: null });
                }}
                className="text-[#0A2A47] hover:bg-[#e6f0f8] rounded-full px-2 py-1 font-bold"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col items-center gap-2 mb-4 text-[#0A2A47] text-wrap w-full">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative h-24 w-24 rounded-full border border-[#e6f0f8] overflow-hidden flex items-center justify-center hover:border-[#0A2A47] focus:outline-none focus:ring-2 focus:ring-[#0A2A47]"
                title="Seleccionar imagen"
              >
                {form.foto ? (
                  <img src={URL.createObjectURL(form.foto)} alt="Foto" className="h-full w-full object-cover" />
                ) : empresaSeleccionada?.imagen ? (
                  <img src={empresaSeleccionada.imagen} alt="Foto" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="text-gray-400 h-8 w-8" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Cambiar
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setForm({ ...form, foto: e.target.files[0] })}
                className="hidden"
              />
              <p className="text-xs text-[#0A2A47]">Haz click en la imagen para cambiarla</p>
            </div>

            <input
              placeholder="Nombre de la empresa"
              className="border border-[#0A2A47] bg-white rounded-md px-2 py-2 mb-4 w-full text-[#0A2A47] placeholder:text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />

            {modoCrear ? (
              <button onClick={handleCrear} className="bg-[#0A2A47] text-white w-full py-2 rounded font-semibold shadow-sm hover:bg-[#123b63]">
                Crear
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <button onClick={handleEditar} className="bg-[#0A2A47] text-white w-full py-2 rounded font-semibold shadow-sm hover:bg-[#123b63]">
                  Actualizar
                </button>
                <button onClick={handleEliminar} className="border border-[#0A2A47] text-[#0A2A47] w-full py-2 rounded font-semibold hover:bg-[#e6f0f8]">
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

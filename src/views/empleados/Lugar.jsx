import { useObtenerEstructuraUsuarioQuery } from "../../redux/api/userApi";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Layout from "../../components/Layout";

function Lugar() {
  const usuario = useSelector((state) => state.usuarios.usuarioLogueado);
  const navigate = useNavigate();

  const { data, isLoading, error } = useObtenerEstructuraUsuarioQuery(usuario?.id);

  if (error) {
    toast.error(error?.data?.detail || "Error al obtener la información");
  }

  return (
    <Layout>
      <div className="p-4 max-w-xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-[#0A2A47] mb-4 text-center">Lugar de Trabajo</h2>

        <div className="border-1 border-[#0A2A47] p-6 rounded-2xl text-center space-y-4">
          {isLoading ? (
            <p className="text-gray-500">Cargando información...</p>
          ) : (
            <>
              <h3 className="text-xl font-bold text-[#0A2A47]">{data?.locacion?.empresa?.nombre || "Empresa desconocida"}</h3>
              <div className="flex justify-center mb-4">
                <img
                  src={data?.locacion?.empresa?.imagen || "https://via.placeholder.com/100"}
                  alt="Logo empresa"
                  className="w-24 h-24 object-cover"
                />
              </div>

              <div>
                <label className="text-[#0A2A47] font-semibold">Locación:</label>
                <p>{data?.locacion?.nombre || "No disponible"}</p>
              </div>

              <div>
                <label className="text-[#0A2A47] font-semibold">Dirección:</label>
                <p>{data?.locacion?.direccion || "No disponible"}</p>
              </div>

              <div>
                <label className="text-[#0A2A47] font-semibold">Área:</label>
                <p>{data?.nombre || "No disponible"}</p>
              </div>
            </>
          )}
        </div>

        <div className="border-1 border-[#0A2A47] p-6 rounded-2xl space-y-4 text-center">
          <p className="text-[#0A2A47]">
            Para iniciar tus actividades debes encontrarte dentro de tu<strong className="text-[#3BAE3D]"> lugar de trabajo</strong>. Una vez allí, podrás comenzar a escanear los códigos QR y completar tus tareas de manera segura y eficiente con <span className="font-bold text-[#3BAE3D]">TYDY</span>.
          </p>

          <button
            onClick={() => navigate("/main")}
            className="bg-[#3BAE3D] text-white font-bold py-2 px-6 rounded"
          >
            Empezar Actividades
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default Lugar;
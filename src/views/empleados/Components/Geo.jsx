import { toast } from "react-toastify";
import { useObtenerEstructuraUsuarioQuery } from "../../../redux/api/userApi";
import { useSelector } from "react-redux";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";

const Geo = ({ setDentroArea }) => {
  const usuario = useSelector((state) => state.usuarios.usuarioLogueado);
  const { data, isLoading, isError } = useObtenerEstructuraUsuarioQuery(usuario.id);
  const [mensajeError, setMensajeError] = useState(false);
  const navigate = useNavigate();

  const calcularDistancia = (lat1, lon1, lat2, lon2) => {
    const toRad = (valor) => (valor * Math.PI) / 180;
    const R = 6371e3; // Radio de la tierra en metros

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en metros
  };

  const verificarUbicacion = () => {
    if (!data?.locacion?.latitud || !data?.locacion?.longitud) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const distancia = calcularDistancia(
          position.coords.latitude,
          position.coords.longitude,
          parseFloat(data.locacion.latitud),
          parseFloat(data.locacion.longitud)
        );

        if (distancia <= 100) {
          setDentroArea(true);
          setMensajeError(false);
          console.log('Dentro Area');
        } else {
          setDentroArea(false);
          setMensajeError(true);
        }
      },
      (error) => {
        console.error("Error al obtener ubicación:", error);
        setMensajeError(true);
        toast.error("Debes permitir el acceso a la ubicación para verificar el área de trabajo.");
      }
    );
  };

  if (isLoading) return <p className="text-center">Cargando...</p>;
  if (isError || !data) return <p className="text-center text-red-500">Error al obtener datos.</p>;

  return (
    <div className="bg-white rounded-2xl border-1 border-[#0A2A47] p-6 text-center flex flex-col items-center gap-4">
      <h2 className="text-xl font-bold text-[#0A2A47] flex items-center gap-2">
        <MapPin size={20} className="text-[#3BAE3D]" /> Área de trabajo
      </h2>
      <p className="text-gray-700">
        Dirígete a tu lugar de trabajo y confirma tu ubicación para poder iniciar tus actividades.
      </p>
      <button
        onClick={verificarUbicacion}
        className="bg-[#3BAE3D] text-white font-bold px-6 py-2 rounded hover:opacity-90 transition"
      >
        Empezar
      </button>

      {mensajeError && (
        <div className="mt-4 text-center text-red-600 flex flex-col items-center gap-2">
          <p>Parece que no estás cerca de tu lugar de trabajo.</p>
          <button
            onClick={() => navigate("/lugar")}
            className="border border-[#3BAE3D] text-[#3BAE3D] font-bold px-4 py-1 rounded hover:bg-[#3BAE3D] hover:text-white transition"
          >
            Ver lugar de trabajo
          </button>
        </div>
      )}
    </div>
  );
};

export default Geo;
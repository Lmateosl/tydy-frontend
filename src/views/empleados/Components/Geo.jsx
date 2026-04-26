import { toast } from "react-toastify";
import { useObtenerEstructuraUsuarioQuery } from "../../../redux/api/userApi";
import { useSelector } from "react-redux";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";

const Geo = ({ setDentroArea, setValidacionUbicacion }) => {
  const usuario = useSelector((state) => state.usuarios.usuarioLogueado);
  const { data, isLoading, isError } = useObtenerEstructuraUsuarioQuery(usuario.id);
  const [estadoUbicacion, setEstadoUbicacion] = useState("idle");
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
    navigator.geolocation.getCurrentPosition(
      (position) => {
        let distancia = null;
        let radioPermitido = Number(data?.locacion?.radio_verificacion_metros || 1000);

        if (data?.locacion?.latitud && data?.locacion?.longitud) {
          distancia = calcularDistancia(
            position.coords.latitude,
            position.coords.longitude,
            parseFloat(data.locacion.latitud),
            parseFloat(data.locacion.longitud)
          );
        }

        setDentroArea(true);
        setValidacionUbicacion?.({
          latitud_inicio: position.coords.latitude,
          longitud_inicio: position.coords.longitude,
          precision_inicio: position.coords.accuracy,
          distancia_validacion: distancia,
        });

        if (distancia === null) {
          setEstadoUbicacion("sin_referencia");
          toast.warning(
            "Esta locación todavía no tiene un punto GPS de referencia. La actividad quedará registrada para revisión."
          );
        } else if (distancia <= radioPermitido) {
          setEstadoUbicacion("dentro");
        } else {
          setEstadoUbicacion("fuera");
          toast.warning(
            "Estás fuera del radio configurado. Puedes continuar, pero la verificación quedará marcada para revisión."
          );
        }
      },
      (error) => {
        console.error("Error al obtener ubicación:", error);
        setDentroArea(false);
        setValidacionUbicacion?.(null);
        setEstadoUbicacion("sin_gps");
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

      {estadoUbicacion === "fuera" && (
        <div className="mt-4 text-center text-amber-700 flex flex-col items-center gap-2">
          <p>
            Estás fuera del radio permitido para este lugar de trabajo. Puedes continuar, pero esta
            actividad quedará marcada para revisión.
          </p>
          <button
            onClick={() => navigate("/lugar")}
            className="border border-amber-500 text-amber-700 font-bold px-4 py-1 rounded hover:bg-amber-500 hover:text-white transition"
          >
            Ver lugar de trabajo
          </button>
        </div>
      )}

      {estadoUbicacion === "sin_referencia" && (
        <div className="mt-4 text-center text-amber-700">
          <p>
            Esta locación todavía no tiene un punto GPS de referencia. Podrás continuar, pero la
            verificación quedará marcada para revisión.
          </p>
        </div>
      )}

      {estadoUbicacion === "sin_gps" && (
        <div className="mt-4 text-center text-red-600 flex flex-col items-center gap-2">
          <p>Necesitamos tu ubicación para poder iniciar tus actividades.</p>
        </div>
      )}
    </div>
  );
};

export default Geo;

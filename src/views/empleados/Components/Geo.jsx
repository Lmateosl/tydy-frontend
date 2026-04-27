import { toast } from "react-toastify";
import { useObtenerEstructuraUsuarioQuery } from "../../../redux/api/userApi";
import { useSelector } from "react-redux";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, MapPin, Navigation, ShieldCheck } from "lucide-react";

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

  if (isLoading) {
    return (
      <div className="rounded-[28px] border border-[#e6f0f8] bg-white px-5 py-10 text-center text-sm font-medium text-[#6b7b88] shadow-sm">
        Cargando...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-white px-5 py-10 text-center text-sm font-medium text-red-600 shadow-sm">
        Error al obtener datos.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#e6f0f8] bg-white shadow-sm">
      <div className="border-b border-[#edf3f8] px-5 py-5 md:px-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#dbe8f2] bg-[#f8fbfd] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3BAE3D]">
          <ShieldCheck size={14} />
          Validación GPS
        </div>
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#0A2A47]">
          <MapPin size={22} className="text-[#3BAE3D]" />
          Área de trabajo
        </h2>
        <p className="mt-2 max-w-xl text-sm text-[#5b6b79]">
          Dirígete a tu lugar de trabajo y confirma tu ubicación para poder iniciar tus actividades.
        </p>
      </div>

      <div className="space-y-4 px-5 py-5 text-center md:px-6 md:py-6">
        <div className="mx-auto flex max-w-md flex-col items-center rounded-[24px] border border-[#e6f0f8] bg-[#fbfdff] px-5 py-6">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[#dbe8f2] bg-white text-[#3BAE3D]">
            <Navigation size={24} />
          </div>
          <p className="text-sm leading-relaxed text-[#0A2A47]">
            Verificaremos tu posición actual para confirmar que estás en el punto correcto antes de comenzar.
          </p>
        </div>

        <button
          onClick={verificarUbicacion}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#3BAE3D] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#3BAE3D]/20 transition hover:-translate-y-0.5 hover:bg-[#329734]"
        >
          <Navigation size={16} />
          Empezar
        </button>

        {estadoUbicacion === "fuera" && (
          <div className="mx-auto mt-2 flex max-w-2xl flex-col items-center gap-3 rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-5 text-center text-amber-800">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-amber-600">
              <AlertTriangle size={20} />
            </div>
            <p className="text-sm leading-relaxed">
              Estás fuera del radio permitido para este lugar de trabajo. Puedes continuar, pero esta
              actividad quedará marcada para revisión.
            </p>
            <button
              onClick={() => navigate("/lugar")}
              className="rounded-2xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
            >
              Ver lugar de trabajo
            </button>
          </div>
        )}

        {estadoUbicacion === "sin_referencia" && (
          <div className="mx-auto mt-2 max-w-2xl rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-5 text-center text-sm leading-relaxed text-amber-800">
            Esta locación todavía no tiene un punto GPS de referencia. Podrás continuar, pero la
            verificación quedará marcada para revisión.
          </div>
        )}

        {estadoUbicacion === "sin_gps" && (
          <div className="mx-auto mt-2 max-w-2xl rounded-[24px] border border-red-200 bg-red-50 px-5 py-5 text-center text-sm leading-relaxed text-red-600">
            Necesitamos tu ubicación para poder iniciar tus actividades.
          </div>
        )}
      </div>
    </div>
  );
};

export default Geo;

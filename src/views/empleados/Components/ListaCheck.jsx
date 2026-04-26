import { useSelector, useDispatch } from "react-redux";
import { borrarListaActiva, borrarHistorialId } from "../../../redux/slices/listasSlice";
import { useFinalizarActividadUsuarioMutation } from "../../../redux/api/historialApi";
import { toast } from "react-toastify";
import { useState, useRef, useEffect } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { QrCode, Camera, CheckCircle2, X } from "lucide-react";

const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  const toRad = (valor) => (valor * Math.PI) / 180;
  const R = 6371e3;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const obtenerUbicacionActual = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalización no disponible."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  });

function ListaCheck() {
  const dispatch = useDispatch();
  const listaActiva = useSelector((state) => state.listas.listaActiva);
  const historialId = useSelector((state) => state.listas.historialId);
  const [comentario, setComentario] = useState("");
  const [codigoIngresado, setCodigoIngresado] = useState("");
  const [actividadesFinalizadas, setActividadesFinalizadas] = useState([]);
  const [imagen, setImagen] = useState(null);
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const scannerRef = useRef(null);
  const imagenPreviewUrl = imagen ? URL.createObjectURL(imagen) : null;

  const [finalizarActividad] = useFinalizarActividadUsuarioMutation();

  const toggleActividad = (actividadId) => {
    if (actividadesFinalizadas.includes(actividadId)) {
      setActividadesFinalizadas(actividadesFinalizadas.filter((id) => id !== actividadId));
    } else {
      setActividadesFinalizadas([...actividadesFinalizadas, actividadId]);
    }
  };

  const handleEscanearQR = () => {
    setMostrarScanner(true);
  };

  useEffect(() => {
    if (mostrarScanner && scannerRef.current) {
      const codeReader = new BrowserQRCodeReader();

      codeReader.decodeFromVideoDevice(null, scannerRef.current, (result, err, controls) => {
        if (result) {
          const decodedText = result.text;
          try {
            if (!decodedText.startsWith("{") || !decodedText.endsWith("}")) {
              return;
            }

            const decodedTextLimpio = decodedText
              .replace(/'/g, '"')
              .replace(/\bFalse\b/g, 'false')
              .replace(/\bTrue\b/g, 'true');

            const qrData = JSON.parse(decodedTextLimpio);

            if (qrData.lista_id === listaActiva.id && qrData.finalizada) {
                controls.stop();
                setMostrarScanner(false);
                finalizarProceso("qr");
            } else {
                controls.stop();
                setMostrarScanner(false);
                toast.error("El código QR no corresponde a esta lista.");
            }

            controls.stop();
            setMostrarScanner(false);
          } catch {
            toast.error("Código QR inválido.");
          }
        }
        if (err && !err.name?.toLowerCase().includes("notfoundexception")) {
          console.error(err);
        }
      });

      return () => {
        codeReader.stopContinuousDecode?.();
      };
    }
  }, [mostrarScanner]);

  useEffect(() => {
    return () => {
      if (imagenPreviewUrl) {
        URL.revokeObjectURL(imagenPreviewUrl);
      }
    };
  }, [imagenPreviewUrl]);

  const finalizarProceso = async (metodoFin = "manual") => {
    if (actividadesFinalizadas.length !== listaActiva.actividades.length) {
      toast.error("Debes marcar todas las actividades como finalizadas.");
      return;
    }

    if (listaActiva.imagen && !imagen) {
      toast.error("No puedes finalizar esta actividad sin subir una imagen de prueba.");
      return;
    }

    const formData = new FormData();
    if (comentario) formData.append("comentario", comentario);
    formData.append("metodo_fin", metodoFin);

    try {
      const posicion = await obtenerUbicacionActual();
      const latitudFin = posicion.coords.latitude;
      const longitudFin = posicion.coords.longitude;
      formData.append("latitud_fin", latitudFin);
      formData.append("longitud_fin", longitudFin);
      formData.append("precision_fin", posicion.coords.accuracy);

      if (listaActiva.latitud && listaActiva.longitud) {
        formData.append(
          "distancia_fin",
          calcularDistancia(
            latitudFin,
            longitudFin,
            Number(listaActiva.latitud),
            Number(listaActiva.longitud)
          )
        );
      }
    } catch {
      toast.error("Debes permitir el acceso a la ubicación para verificar el cierre.");
      return;
    }

    if (imagen) formData.append("imagen", imagen);

    try {
      setSubiendo(true);
      await finalizarActividad({ actividad_id: historialId, datos: formData }).unwrap();
      toast.success("Lista finalizada correctamente.");
      dispatch(borrarListaActiva());
      dispatch(borrarHistorialId());
    } catch (error) {
      toast.error(error?.data?.detail || "Error al finalizar la actividad.");
    } finally {
      setSubiendo(false);
    }
  };

  const handleFinalizarManual = async () => {
    if (actividadesFinalizadas.length !== listaActiva.actividades.length) {
      toast.error("Debes marcar todas las actividades como finalizadas.");
      return;
    }

    if (listaActiva.codeout) {
      if (codigoIngresado === listaActiva.codeout) {
        await finalizarProceso("codigo");
      } else {
        toast.error("El código ingresado es incorrecto.");
      }
    } else {
      await finalizarProceso("manual");
    }
  };

  if (!listaActiva) return <p className="text-center mt-5">No hay una lista activa.</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-[#0A2A47] mb-4">{listaActiva.nombre}</h2>

      <div className="grid gap-2 mb-4">
        {listaActiva.actividades.map((actividad) => (
          <div
            key={actividad.id}
            className={`flex items-center justify-between border rounded p-3 ${
              actividadesFinalizadas.includes(actividad.id) ? "bg-[#3BAE3D] text-white" : "border-[#0A2A47]"
            }`}
          >
            <span>{actividad.nombre}</span>
            <input
              type="checkbox"
              checked={actividadesFinalizadas.includes(actividad.id)}
              onChange={() => toggleActividad(actividad.id)}
              className="w-5 h-5"
            />
          </div>
        ))}
      </div>

      {listaActiva.imagen && (
        <div className="mb-4">
          <label className="block mb-2 font-bold text-[#0A2A47]">Adjuntar Imagen *</label>
          <input
            id="imagen-upload"
            type="file"
            accept="image/*"
            onChange={(e) => setImagen(e.target.files?.[0] || null)}
            className="hidden"
          />

          {!imagen ? (
            <label
              htmlFor="imagen-upload"
              className="cursor-pointer flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#0A2A47] p-5 rounded-xl text-[#0A2A47] hover:bg-[#e6f0f8] transition-colors"
            >
              <Camera size={28} />
              <span className="font-semibold">Haz clic aquí para subir imagen</span>
              <span className="text-xs opacity-80">La imagen es obligatoria para finalizar esta lista</span>
            </label>
          ) : (
            <div className="rounded-xl border border-[#e6f0f8] bg-white shadow-sm overflow-hidden">
              <img
                src={imagenPreviewUrl}
                alt="Vista previa de evidencia"
                className="h-44 w-full object-cover"
              />
              <div className="flex items-center justify-between gap-3 p-3">
                <div className="flex items-center gap-2 text-[#0A2A47] min-w-0">
                  <CheckCircle2 size={18} className="text-[#3BAE3D] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Imagen cargada correctamente</p>
                    <p className="text-xs text-gray-500 truncate">{imagen.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setImagen(null)}
                  className="flex items-center gap-1 rounded-md border border-red-500 px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50"
                >
                  <X size={14} />
                  Quitar
                </button>
              </div>
              <label
                htmlFor="imagen-upload"
                className="block cursor-pointer border-t border-[#e6f0f8] px-3 py-2 text-center text-sm font-semibold text-[#0A2A47] hover:bg-[#e6f0f8]"
              >
                Cambiar imagen
              </label>
            </div>
          )}
        </div>
      )}

      <div className="mb-4">
        <label className="block mb-1 font-bold text-[#0A2A47]">Comentario (opcional)</label>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          className="w-full p-2 border rounded border-[#0A2A47]"
          rows="3"
        />
      </div>

      {listaActiva.qrout && (
        <>
          <button
            onClick={handleEscanearQR}
            disabled={subiendo}
            className={`flex items-center justify-center gap-2 w-full bg-[#3BAE3D] text-white py-2 rounded mb-4 ${subiendo ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <QrCode /> {subiendo ? "Procesando..." : "Escanear QR"}
          </button>
          {mostrarScanner && (
            <video
              ref={scannerRef}
              style={{
                width: "100%",
                maxWidth: "400px",
                height: "auto",
                border: "2px solid #0A2A47",
                borderRadius: "8px",
              }}
              autoPlay
              muted
            />
          )}
        </>
      )}

      {listaActiva.codeout && (
        <>
          <label className="block mb-1 font-bold text-[#0A2A47]">Código de Finalización *</label>
          <input
            type="text"
            value={codigoIngresado}
            onChange={(e) => setCodigoIngresado(e.target.value)}
            className="w-full p-2 border rounded border-[#0A2A47] mb-4"
          />
          <button
            onClick={handleFinalizarManual}
            disabled={subiendo}
            className={`w-full bg-[#3BAE3D] text-white py-2 rounded ${subiendo ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {subiendo ? "Subiendo..." : "Finalizar"}
          </button>
        </>
      )}

      {!listaActiva.qrout && !listaActiva.codeout && (
        <button
          onClick={handleFinalizarManual}
          disabled={subiendo}
          className={`w-full bg-[#3BAE3D] text-white py-2 rounded ${subiendo ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {subiendo ? "Subiendo..." : "Finalizar"}
        </button>
      )}
    </div>
  );
}

export default ListaCheck;

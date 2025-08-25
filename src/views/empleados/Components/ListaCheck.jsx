import { useSelector, useDispatch } from "react-redux";
import { borrarListaActiva, borrarHistorialId } from "../../../redux/slices/listasSlice";
import { useFinalizarActividadUsuarioMutation } from "../../../redux/api/historialApi";
import { toast } from "react-toastify";
import { useState, useRef, useEffect } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { Camera, CameraIcon, CheckCircle, QrCode } from "lucide-react";

function ListaCheck() {
  const dispatch = useDispatch();
  const listaActiva = useSelector((state) => state.listas.listaActiva);
  const historialId = useSelector((state) => state.listas.historialId);
  const [comentario, setComentario] = useState("");
  const [codigoIngresado, setCodigoIngresado] = useState("");
  const [actividadesFinalizadas, setActividadesFinalizadas] = useState([]);
  const [imagen, setImagen] = useState(null);
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const scannerRef = useRef(null);

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
                finalizarProceso();
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

  const finalizarProceso = () => {
    if (actividadesFinalizadas.length !== listaActiva.actividades.length) {
      toast.error("Debes marcar todas las actividades como finalizadas.");
      return;
    }

    const formData = new FormData();
    if (comentario) formData.append("comentario", comentario);
    if (listaActiva.imagen && !imagen) {
        toast.error("No puedes finalizar esta actividad sin subir una imagen de prueba.");
        return;
    }
    if (imagen) formData.append("imagen", imagen);

    finalizarActividad({ actividad_id: historialId, datos: formData })
      .unwrap()
      .then(() => {
        toast.success("Lista finalizada correctamente.");
        dispatch(borrarListaActiva());
        dispatch(borrarHistorialId());
      })
      .catch((error) => {
        toast.error(error?.data?.detail || "Error al finalizar la actividad.");
      });
  };

  const handleFinalizarManual = () => {
    if (actividadesFinalizadas.length !== listaActiva.actividades.length) {
      toast.error("Debes marcar todas las actividades como finalizadas.");
      return;
    }

    if (listaActiva.codeout) {
      if (codigoIngresado === listaActiva.codeout) {
        finalizarProceso();
      } else {
        toast.error("El código ingresado es incorrecto.");
      }
    } else {
      finalizarProceso();
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
          <label className="block mb-1 font-bold text-[#0A2A47]">Adjuntar Imagen *</label>
          <input
            id="imagen-upload"
            type="file"
            accept="image/*"
            onChange={(e) => setImagen(e.target.files[0])}
            className="hidden"
          />
          <label
            htmlFor="imagen-upload"
            className="cursor-pointer flex items-center justify-center border-2 border-dashed border-[#0A2A47] p-4 rounded text-[#0A2A47] hover:bg-gray-100"
          >
            Haz clic aquí para subir imagen
          </label>
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
            className="flex items-center justify-center gap-2 w-full bg-[#3BAE3D] text-white py-2 rounded mb-4"
          >
            <QrCode /> Escanear QR
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
            className="w-full bg-[#3BAE3D] text-white py-2 rounded"
          >
            Finalizar
          </button>
        </>
      )}

      {!listaActiva.qrout && !listaActiva.codeout && (
        <button
          onClick={handleFinalizarManual}
          className="w-full bg-[#3BAE3D] text-white py-2 rounded"
        >
          Finalizar
        </button>
      )}
    </div>
  );
}

export default ListaCheck;
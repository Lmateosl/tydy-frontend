import { useSelector, useDispatch } from "react-redux";
import { borrarListaActiva, borrarHistorialId } from "../../../redux/slices/listasSlice";
import { useFinalizarActividadUsuarioMutation } from "../../../redux/api/historialApi";
import { toast } from "react-toastify";
import { useState, useRef, useEffect } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { QrCode, Camera, CheckCircle2, X, ClipboardList, MessageSquare, ShieldCheck, Keyboard } from "lucide-react";

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

  if (!listaActiva) {
    return (
      <div className="mt-5 rounded-[28px] border border-[#e6f0f8] bg-white px-5 py-10 text-center text-sm font-medium text-[#6b7b88] shadow-sm">
        No hay una lista activa.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <section className="relative overflow-hidden rounded-[28px] border border-[#e6f0f8] bg-white p-5 shadow-xl shadow-[#0A2A47]/5 md:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.16),_transparent_38%),radial-gradient(circle_at_bottom_left,_rgba(10,42,71,0.1),_transparent_42%)]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#3BAE3D]">
              Actividad en curso
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0A2A47] md:text-4xl">
              {listaActiva.nombre}
            </h2>
            <p className="mt-2 text-sm text-[#5b6b79]">
              Marca cada tarea completada, agrega evidencia si aplica y finaliza el proceso con el método configurado.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-2 text-sm font-semibold text-[#0A2A47]">
            <ShieldCheck size={16} />
            {actividadesFinalizadas.length}/{listaActiva.actividades.length} completadas
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#e6f0f8] bg-white shadow-sm">
        <div className="border-b border-[#edf3f8] px-5 py-5 md:px-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#dbe8f2] bg-[#f8fbfd] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3BAE3D]">
            <ClipboardList size={14} />
            Checklist
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-[#0A2A47]">
            Tareas a completar
          </h3>
        </div>

        <div className="grid gap-3 p-5 md:p-6">
          {listaActiva.actividades.map((actividad) => (
            <label
              key={actividad.id}
              className={`flex cursor-pointer items-center justify-between gap-4 rounded-[22px] border p-4 transition ${
                actividadesFinalizadas.includes(actividad.id)
                  ? "border-[#3BAE3D] bg-[#3BAE3D] text-white shadow-lg shadow-[#3BAE3D]/15"
                  : "border-[#e6f0f8] bg-[#fbfdff] text-[#0A2A47] hover:border-[#0A2A47]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border ${
                    actividadesFinalizadas.includes(actividad.id)
                      ? "border-white/20 bg-white/10 text-white"
                      : "border-[#dbe8f2] bg-white text-[#0A2A47]"
                  }`}
                >
                  <CheckCircle2 size={18} />
                </div>
                <span className="text-sm font-semibold">{actividad.nombre}</span>
              </div>
              <input
                type="checkbox"
                checked={actividadesFinalizadas.includes(actividad.id)}
                onChange={() => toggleActividad(actividad.id)}
                className="h-5 w-5"
              />
            </label>
          ))}
        </div>
      </section>

      {listaActiva.imagen && (
        <section className="overflow-hidden rounded-[28px] border border-[#e6f0f8] bg-white shadow-sm">
          <div className="border-b border-[#edf3f8] px-5 py-5 md:px-6">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#dbe8f2] bg-[#f8fbfd] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3BAE3D]">
              <Camera size={14} />
              Evidencia requerida
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-[#0A2A47]">
              Adjuntar imagen
            </h3>
          </div>

          <div className="p-5 md:p-6">
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
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-dashed border-[#dbe8f2] bg-[#fbfdff] p-8 text-[#0A2A47] transition-colors hover:bg-[#f4f8fb]"
            >
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[#dbe8f2] bg-white text-[#3BAE3D]">
                <Camera size={26} />
              </div>
              <span className="text-sm font-semibold">Haz clic aquí para subir imagen</span>
              <span className="text-xs text-[#7b8a97]">La imagen es obligatoria para finalizar esta lista</span>
            </label>
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-[#e6f0f8] bg-white shadow-sm">
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
                    <p className="truncate text-xs text-gray-500">{imagen.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setImagen(null)}
                  className="flex items-center gap-1 rounded-xl border border-red-300 px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                >
                  <X size={14} />
                  Quitar
                </button>
              </div>
              <label
                htmlFor="imagen-upload"
                className="block cursor-pointer border-t border-[#e6f0f8] px-3 py-3 text-center text-sm font-semibold text-[#0A2A47] transition hover:bg-[#f4f8fb]"
              >
                Cambiar imagen
              </label>
            </div>
          )}
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-[28px] border border-[#e6f0f8] bg-white shadow-sm">
        <div className="border-b border-[#edf3f8] px-5 py-5 md:px-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#dbe8f2] bg-[#f8fbfd] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3BAE3D]">
            <MessageSquare size={14} />
            Comentario
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-[#0A2A47]">
            Notas de cierre
          </h3>
        </div>

        <div className="p-5 md:p-6">
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] p-4 text-sm text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
            rows="4"
            placeholder="Agrega un comentario opcional sobre la actividad..."
          />
        </div>
      </section>

      {listaActiva.qrout && (
        <section className="overflow-hidden rounded-[28px] border border-[#e6f0f8] bg-white shadow-sm">
          <div className="border-b border-[#edf3f8] px-5 py-5 md:px-6">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#dbe8f2] bg-[#f8fbfd] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3BAE3D]">
              <QrCode size={14} />
              Cierre con QR
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-[#0A2A47]">
              Escanear QR de salida
            </h3>
          </div>

          <div className="space-y-4 p-5 md:p-6">
          <button
            onClick={handleEscanearQR}
            disabled={subiendo}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3BAE3D] py-3 text-sm font-semibold text-white shadow-lg shadow-[#3BAE3D]/20 transition hover:-translate-y-0.5 hover:bg-[#329734] ${subiendo ? "cursor-not-allowed opacity-60" : ""}`}
          >
            <QrCode /> {subiendo ? "Procesando..." : "Escanear QR"}
          </button>
          {mostrarScanner && (
            <div className="flex justify-center rounded-[24px] border border-[#dbe8f2] bg-[#fbfdff] p-4">
              <video
                ref={scannerRef}
                style={{
                  width: "100%",
                  maxWidth: "400px",
                  height: "auto",
                  border: "2px solid #0A2A47",
                  borderRadius: "18px",
                }}
                autoPlay
                muted
              />
            </div>
          )}
          </div>
        </section>
      )}

      {listaActiva.codeout && (
        <section className="overflow-hidden rounded-[28px] border border-[#e6f0f8] bg-white shadow-sm">
          <div className="border-b border-[#edf3f8] px-5 py-5 md:px-6">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#dbe8f2] bg-[#f8fbfd] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3BAE3D]">
              <Keyboard size={14} />
              Código de cierre
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-[#0A2A47]">
              Código de finalización
            </h3>
          </div>

          <div className="space-y-4 p-5 md:p-6">
          <input
            type="text"
            value={codigoIngresado}
            onChange={(e) => setCodigoIngresado(e.target.value)}
            className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-sm text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
            placeholder="Ingresa el código de finalización"
          />
          <button
            onClick={handleFinalizarManual}
            disabled={subiendo}
            className={`w-full rounded-2xl bg-[#3BAE3D] py-3 text-sm font-semibold text-white shadow-lg shadow-[#3BAE3D]/20 transition hover:-translate-y-0.5 hover:bg-[#329734] ${subiendo ? "cursor-not-allowed opacity-60" : ""}`}
          >
            {subiendo ? "Subiendo..." : "Finalizar"}
          </button>
          </div>
        </section>
      )}

      {!listaActiva.qrout && !listaActiva.codeout && (
        <section className="rounded-[28px] border border-[#e6f0f8] bg-white p-5 shadow-sm md:p-6">
          <button
            onClick={handleFinalizarManual}
            disabled={subiendo}
            className={`w-full rounded-2xl bg-[#3BAE3D] py-3 text-sm font-semibold text-white shadow-lg shadow-[#3BAE3D]/20 transition hover:-translate-y-0.5 hover:bg-[#329734] ${subiendo ? "cursor-not-allowed opacity-60" : ""}`}
          >
            {subiendo ? "Subiendo..." : "Finalizar"}
          </button>
        </section>
      )}
    </div>
  );
}

export default ListaCheck;

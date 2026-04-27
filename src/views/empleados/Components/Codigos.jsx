import { useState, useEffect, useRef } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { useLazyObtenerListaPorCodigoQuery, useLazyObtenerListaQuery } from "../../../redux/api/listasApi";
import { useCrearActividadUsuarioMutation } from "../../../redux/api/historialApi";
import { useDispatch } from "react-redux";
import { setListaActiva, setHistorialId } from "../../../redux/slices/listasSlice";
import { toast } from "react-toastify";
import { Keyboard, QrCode, ScanLine } from "lucide-react";

export default function Codigos({ validacionUbicacion }) {
  const [mostrarQR, setMostrarQR] = useState(false);
  const [mostrarCodigo, setMostrarCodigo] = useState(false);
  const [codigo, setCodigo] = useState("");
  const dispatch = useDispatch();
  const videoRef = useRef(null);

  const [crearActividadUsuario] = useCrearActividadUsuarioMutation();
  const [dispararObtenerLista] = useLazyObtenerListaQuery();
  const [dispararObtenerListaCodigo] = useLazyObtenerListaPorCodigoQuery();

  useEffect(() => {
    if (mostrarQR && videoRef.current) {
      const codeReader = new BrowserQRCodeReader();

      codeReader.decodeFromVideoDevice(null, videoRef.current, async (result, err, controls) => {
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

            const datos = JSON.parse(decodedTextLimpio);
            if (!datos.lista_id) throw new Error("QR inválido");

            controls.stop();
            setMostrarQR(false);

            const lista = await dispararObtenerLista(datos.lista_id).unwrap();
            dispatch(setListaActiva(lista));

            const { data: actividad } = await crearActividadUsuario({
              lista_id: lista.id,
              finalizada: false,
              metodo_inicio: "qr",
              ...validacionUbicacion,
            });
            dispatch(setHistorialId(actividad.id));
            toast.success("Actividad iniciada correctamente");

          } catch (error) {
            console.log(error);
            if (decodedText.startsWith("{") && decodedText.endsWith("}")) {
              toast.error("QR inválido o error al iniciar actividad");
            }
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
  }, [mostrarQR]);

  const manejarBuscarPorCodigo = async () => {
    if (codigo.length !== 6) {
      toast.error("El código debe tener 6 dígitos");
      return;
    }
    try {
      const lista = await dispararObtenerListaCodigo(codigo).unwrap();
      dispatch(setListaActiva(lista));

      const { data: actividad } = await crearActividadUsuario({
        lista_id: lista.id,
        metodo_inicio: "codigo",
        ...validacionUbicacion,
      });
      dispatch(setHistorialId(actividad.id));
      toast.success("Actividad iniciada correctamente");
    } catch (error) {
      console.log(error);
      toast.error("Código inválido o error al iniciar actividad");
    }
  };

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#e6f0f8] bg-white shadow-sm">
      <div className="border-b border-[#edf3f8] px-5 py-5 md:px-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#dbe8f2] bg-[#f8fbfd] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3BAE3D]">
          <ScanLine size={14} />
          Inicio de actividad
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0A2A47]">
          Comienza tus actividades
        </h2>
        <p className="mt-2 max-w-xl text-sm text-[#5b6b79]">
          Escanea un QR o ingresa el código manual para abrir la lista correcta y registrar el inicio.
        </p>
      </div>

      <div className="space-y-4 px-5 py-5 md:px-6 md:py-6">
        <div className="rounded-[24px] border border-[#e6f0f8] bg-[#fbfdff] p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#dbe8f2] bg-white text-[#3BAE3D]">
                <QrCode size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#0A2A47]">Escanear código QR</h3>
                <p className="mt-1 text-sm text-[#5b6b79]">
                  Usa la cámara para detectar el código de la actividad.
                </p>
              </div>
            </div>

            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#3BAE3D] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#3BAE3D]/20 transition hover:-translate-y-0.5 hover:bg-[#329734]"
              onClick={() => {
                setMostrarQR(!mostrarQR);
                setMostrarCodigo(false);
              }}
            >
              <ScanLine size={16} />
              Escanear QR
            </button>
          </div>

          {mostrarQR && (
            <div className="mt-4 flex justify-center rounded-[24px] border border-[#dbe8f2] bg-white p-4">
              <video
                ref={videoRef}
                style={{
                  width: "100%",
                  maxWidth: "400px",
                  height: "auto",
                  border: "2px solid #0A2A47",
                  borderRadius: "18px",
                }}
              />
            </div>
          )}
        </div>

        <div className="rounded-[24px] border border-[#e6f0f8] bg-[#fbfdff] p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#dbe8f2] bg-white text-[#0A2A47]">
                <Keyboard size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#0A2A47]">Ingresar código manualmente</h3>
                <p className="mt-1 text-sm text-[#5b6b79]">
                  Si no puedes escanear, usa el código de 6 dígitos.
                </p>
              </div>
            </div>

            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dbe8f2] bg-white px-5 py-3 text-sm font-semibold text-[#0A2A47] transition hover:border-[#0A2A47] hover:bg-[#f8fbfd]"
              onClick={() => {
                setMostrarCodigo(!mostrarCodigo);
                setMostrarQR(false);
              }}
            >
              <Keyboard size={16} />
              Ingresar código
            </button>
          </div>

          {mostrarCodigo && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="w-full rounded-2xl border border-[#dbe8f2] bg-white px-4 py-3 text-sm text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                placeholder="Código de 6 dígitos"
              />
              <button
                className="rounded-2xl bg-[#071f35] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#071f35]/10 transition hover:-translate-y-0.5 hover:bg-[#0c2a47]"
                onClick={manejarBuscarPorCodigo}
              >
                Buscar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

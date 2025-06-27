import { useState, useEffect, useRef } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { useLazyObtenerListaPorCodigoQuery, useLazyObtenerListaQuery } from "../../../redux/api/listasApi";
import { useCrearActividadUsuarioMutation } from "../../../redux/api/historialApi";
import { useDispatch } from "react-redux";
import { setListaActiva, setHistorialId } from "../../../redux/slices/listasSlice";
import { toast } from "react-toastify";

export default function Codigos() {
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

            const { data: actividad } = await crearActividadUsuario({ lista_id: lista.id, finalizada: false });
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

      const { data: actividad } = await crearActividadUsuario({ lista_id: lista.id });
      dispatch(setHistorialId(actividad.id));
      toast.success("Actividad iniciada correctamente");
    } catch (error) {
      console.log(error);
      toast.error("Código inválido o error al iniciar actividad");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-[#0A2A47] mb-4">Comienza tus actividades</h2>

      <div className="flex flex-col gap-4">
        <button
          className="bg-[#3BAE3D] text-white py-2 px-4 rounded"
          onClick={() => {
            setMostrarQR(!mostrarQR);
            setMostrarCodigo(false);
          }}
        >
          Escanear código QR
        </button>

        {mostrarQR && (
          <div className="mt-4">
            <video ref={videoRef} style={{
                width: "100%",
                maxWidth: "400px",
                height: "auto",
                border: "2px solid #0A2A47",
                borderRadius: "8px",
              }} />
          </div>
        )}

        <button
          className="bg-[#3BAE3D] text-white py-2 px-4 rounded"
          onClick={() => {
            setMostrarCodigo(!mostrarCodigo);
            setMostrarQR(false);
          }}
        >
          Ingresar código manualmente
        </button>

        {mostrarCodigo && (
          <div className="flex gap-2 mt-4">
            <input
              type="text"
              maxLength={6}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="border border-[#0A2A47] rounded px-2 py-1 w-full"
              placeholder="Código de 6 dígitos"
            />
            <button className="bg-[#0A2A47] text-white px-4 rounded" onClick={manejarBuscarPorCodigo}>
              Buscar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
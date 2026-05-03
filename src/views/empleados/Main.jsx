import { useState } from "react";
import { useSelector } from "react-redux";
import { ClipboardList, RotateCcw } from "lucide-react";
import Layout from "../../components/Layout";
import Geo from "./Components/Geo";
import Codigos from "./Components/Codigos";
import ListaCheck from "./Components/ListaCheck";

export default function Main() {
  const [dentroArea, setDentroArea] = useState(false);
  const [validacionUbicacion, setValidacionUbicacion] = useState(null);
  const listaActiva = useSelector((state) => state.listas.listaActiva);
  const historialId = useSelector((state) => state.listas.historialId);
  const tieneActividadAbierta = Boolean(listaActiva && historialId);

  return (
    <Layout>
      <div className="bg-transparent p-4 flex flex-col justify-center items-center">
        {tieneActividadAbierta && (
          <section className="mb-4 w-full max-w-4xl overflow-hidden rounded-[24px] border border-[#dbe8f2] bg-white shadow-sm">
            <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#dbe8f2] bg-[#f8fbfd] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3BAE3D]">
                  <RotateCcw size={14} />
                  Actividad retomada
                </div>
                <h2 className="mt-2 text-lg font-extrabold tracking-tight text-[#0A2A47] md:text-xl">
                  {listaActiva.nombre}
                </h2>
                <p className="mt-1 text-sm text-[#5b6b79]">
                  Dejaste esta actividad abierta. Puedes continuarla desde donde la habías dejado.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-2 text-sm font-semibold text-[#0A2A47]">
                <ClipboardList size={16} />
                ID {historialId}
              </div>
            </div>
          </section>
        )}

        {(!listaActiva || !historialId) && !dentroArea && (
          <Geo
            setDentroArea={setDentroArea}
            setValidacionUbicacion={setValidacionUbicacion}
          />
        )}
        {(!listaActiva || !historialId) && dentroArea && (
          <Codigos validacionUbicacion={validacionUbicacion} />
        )}
        {listaActiva && historialId && <ListaCheck />}
      </div>
    </Layout>
  );
}

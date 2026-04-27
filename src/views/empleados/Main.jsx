import { useState } from "react";
import { useSelector } from "react-redux";
import Layout from "../../components/Layout";
import Geo from "./Components/Geo";
import Codigos from "./Components/Codigos";
import ListaCheck from "./Components/ListaCheck";

export default function Main() {
  const [dentroArea, setDentroArea] = useState(false);
  const [validacionUbicacion, setValidacionUbicacion] = useState(null);
  const listaActiva = useSelector((state) => state.listas.listaActiva);
  const historialId = useSelector((state) => state.listas.historialId);

  return (
    <Layout>
      <div className="bg-transparent p-4 flex flex-col justify-center items-center">
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

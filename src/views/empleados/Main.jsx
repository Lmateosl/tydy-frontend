import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { borrarListaActiva, borrarHistorialId } from "../../redux/slices/listasSlice";
import { toast } from "react-toastify";
import Layout from "../../components/Layout";
import Geo from "./Components/Geo";
import Codigos from "./Components/Codigos";
import ListaCheck from "./Components/ListaCheck";

export default function Main() {
  const [dentroArea, setDentroArea] = useState(false);
  const listaActiva = useSelector((state) => state.listas.listaActiva);
  const historialId = useSelector((state) => state.listas.historialId);

  return (
    <Layout>
      <div className="bg-white p-4 flex flex-col justify-center items-center mb-15">
        {(!listaActiva || !historialId) && !dentroArea && <Geo setDentroArea={setDentroArea} />}
        {(!listaActiva || !historialId) && dentroArea && <Codigos />}
        {listaActiva && historialId && <ListaCheck />}
      </div>
    </Layout>
  );
}
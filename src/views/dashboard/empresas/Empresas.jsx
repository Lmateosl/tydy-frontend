import { useState, useMemo } from "react";
import Layout from "../../../components/Layout";
import {
  useObtenerEmpresasQuery,
  useObtenerLocacionesQuery,
  useObtenerAreasUsuarioQuery,
  useResumenTotalesQuery
} from "../../../redux/api/empresasApi";
import { Building2, MapPin, Grid2X2 } from "lucide-react";
import CardEmpresas from "./CardEmpresas";
import CardLocaciones from "./CardLocaciones";
import CardAreas from "./CardAreas";

export default function Empresas() {
  const { data: empresas = [], refetch } = useObtenerEmpresasQuery();
  const { data: locaciones = [], refetch: refreshLoc } = useObtenerLocacionesQuery();
  const { data: areas = [], refetch: refreshArea } = useObtenerAreasUsuarioQuery();
  const { data: resumen = {}, refetch: refreshTotales } = useResumenTotalesQuery();

  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [locacionSeleccionada, setLocacionSeleccionada] = useState(null);

  const locacionesFiltradas = useMemo(() => {
    return locaciones.filter(
      (loc) => loc.empresa_id === empresaSeleccionada?.id
    );
  }, [locaciones, empresaSeleccionada]);

  const areasFiltradas = useMemo(() => {
    return areas.filter(
      (area) => area.locacion_id === locacionSeleccionada?.id
    );
  }, [areas, locacionSeleccionada]);

  return (
    <Layout>
      <div className="p-4">
        <h1 className="text-3xl font-extrabold text-[#0A2A47] mb-4">Empresas, locaciones y áreas</h1>
        <div className="hidden md:flex text-white text-[18px] shadow rounded-xl p-4 mb-4 flex-wrap justify-center items-center bg-[#0A2A47] gap-7">
          <div className="flex flex-col items-center mb-2 md:mb-0">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-[#3BAE3D]" />
              <span className="font-bold">Empresas</span>
            </div>
            <span className="text-lg font-bold">{resumen.total_empresas || 0}</span>
          </div>
          <div className="flex flex-col items-center mb-2 md:mb-0">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-[#3BAE3D]" />
              <span className="font-bold">Locaciones</span>
            </div>
            <span className="text-lg font-bold">{resumen.total_locaciones || 0}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <Grid2X2 size={18} className="text-[#3BAE3D]" />
              <span className="font-bold">Áreas</span>
            </div>
            <span className="text-lg font-bold">{resumen.total_areas || 0}</span>
          </div>
        </div>
        <div className="p-4 flex flex-col md:flex-row gap-4 md:h-[calc(100vh-4rem)] overflow-auto">
          <div className="flex-1 overflow-auto">
            <CardEmpresas
              empresas={empresas}
              empresaSeleccionada={empresaSeleccionada}
              setEmpresaSeleccionada={(emp) => {
                setEmpresaSeleccionada(emp);
                setLocacionSeleccionada(null);
              }}
              refetch={refetch}
              refreshTotales={refreshTotales}
            />
          </div>
          <div className="flex-1 overflow-auto">
            {empresaSeleccionada && (
              <CardLocaciones
                locaciones={locacionesFiltradas}
                locacionSeleccionada={locacionSeleccionada}
                setLocacionSeleccionada={setLocacionSeleccionada}
                empresaSeleccionada={empresaSeleccionada}
                refetch={refreshLoc}
                refreshTotales={refreshTotales}
              />
            )}
          </div>
          <div className="flex-1 overflow-auto">
            {locacionSeleccionada && (
              <CardAreas
                areas={areasFiltradas}
                locacionSeleccionada={locacionSeleccionada}
                refetch={refreshArea}
                refreshTotales={refreshTotales}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
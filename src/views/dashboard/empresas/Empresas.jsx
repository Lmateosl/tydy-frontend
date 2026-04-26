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
        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="bg-[#0A2A47] text-white rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <span className="text-sm opacity-80">Empresas</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-bold">
                {resumen.total_empresas || 0}
              </span>
              <Building2 className="text-[#3BAE3D]" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500">Locaciones</p>
              <MapPin size={16} className="text-[#0A2A47]" />
            </div>
            <p className="text-2xl font-bold text-[#0A2A47]">
              {resumen.total_locaciones || 0}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500">Áreas</p>
              <Grid2X2 size={16} className="text-[#0A2A47]" />
            </div>
            <p className="text-2xl font-bold text-[#0A2A47]">
              {resumen.total_areas || 0}
            </p>
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
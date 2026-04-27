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

  const TarjetaResumen = ({ titulo, valor, icono, principal = false }) => {
    if (principal) {
      return (
        <div className="relative overflow-hidden bg-[#071f35] text-white rounded-2xl p-4 flex flex-col justify-between shadow-xl shadow-[#071f35]/15 border border-white/10 min-h-[118px]">
          <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.24),_transparent_38%)]" />
          <div className="relative flex items-start justify-between gap-3">
            <span className="text-sm text-white/70 font-medium">{titulo}</span>
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 text-[#b7f7ba] flex items-center justify-center">
              {icono}
            </div>
          </div>
          <div className="relative mt-4">
            <span className="text-3xl font-extrabold tracking-tight">{valor}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white/95 border border-[#e6f0f8] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{titulo}</p>
          <div className="w-9 h-9 rounded-xl bg-[#f4f8fb] text-[#0A2A47] flex items-center justify-center border border-[#e6f0f8]">
            {icono}
          </div>
        </div>
        <p className="text-2xl font-extrabold text-[#0A2A47] tracking-tight">{valor}</p>
      </div>
    );
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 bg-[#f4f8fb] min-h-full">
        <div className="relative overflow-hidden mb-6 rounded-[28px] bg-white border border-[#e6f0f8] shadow-xl shadow-[#0A2A47]/5 p-5 md:p-6">
          <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.12),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(10,42,71,0.08),_transparent_35%)]" />
          <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#0A2A47] tracking-tight">Empresas, locaciones y áreas</h1>
              <p className="mt-2 text-sm text-gray-500 max-w-xl">
                Organiza la estructura operativa de clientes, puntos de servicio y zonas de trabajo.
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-2 rounded-2xl bg-[#f4f8fb] border border-[#e6f0f8] px-4 py-3 text-sm font-semibold text-[#0A2A47]">
              <Building2 size={18} className="text-[#3BAE3D]" />
              Estructura operativa
            </div>
          </div>
        </div>
        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <TarjetaResumen
            titulo="Empresas"
            valor={resumen.total_empresas || 0}
            icono={<Building2 size={20} />}
            principal
          />
          <TarjetaResumen
            titulo="Locaciones"
            valor={resumen.total_locaciones || 0}
            icono={<MapPin size={16} />}
          />
          <TarjetaResumen
            titulo="Áreas"
            valor={resumen.total_areas || 0}
            icono={<Grid2X2 size={16} />}
          />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 flex-1 overflow-hidden">
          <div className="min-h-[360px] max-h-[calc(100vh-360px)] overflow-auto rounded-3xl bg-transparent border-none shadow-none p-0">
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
          <div className="min-h-[360px] max-h-[calc(100vh-360px)] overflow-auto rounded-3xl bg-transparent border-none shadow-none p-0">
            {empresaSeleccionada ? (
              <CardLocaciones
                locaciones={locacionesFiltradas}
                locacionSeleccionada={locacionSeleccionada}
                setLocacionSeleccionada={setLocacionSeleccionada}
                empresaSeleccionada={empresaSeleccionada}
                refetch={refreshLoc}
                refreshTotales={refreshTotales}
              />
            ) : (
              <div className="h-full min-h-[300px] flex items-center justify-center rounded-3xl border border-dashed border-[#dbe8f2] bg-[#f8fbfd] text-center p-8">
                <div>
                  <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-[#0A2A47]/10 text-[#0A2A47] flex items-center justify-center">
                    <MapPin size={24} />
                  </div>
                  <p className="text-[#0A2A47] font-bold">Selecciona una empresa</p>
                  <p className="text-sm text-gray-500 mt-1">Las locaciones aparecerán aquí.</p>
                </div>
              </div>
            )}
          </div>
          <div className="min-h-[360px] max-h-[calc(100vh-360px)] overflow-auto rounded-3xl bg-transparent border-none shadow-none p-0">
            {locacionSeleccionada ? (
              <CardAreas
                areas={areasFiltradas}
                locacionSeleccionada={locacionSeleccionada}
                refetch={refreshArea}
                refreshTotales={refreshTotales}
              />
            ) : (
              <div className="h-full min-h-[300px] flex items-center justify-center rounded-3xl border border-dashed border-[#dbe8f2] bg-[#f8fbfd] text-center p-8">
                <div>
                  <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-[#0A2A47]/10 text-[#0A2A47] flex items-center justify-center">
                    <Grid2X2 size={24} />
                  </div>
                  <p className="text-[#0A2A47] font-bold">Selecciona una locación</p>
                  <p className="text-sm text-gray-500 mt-1">Las áreas aparecerán aquí.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
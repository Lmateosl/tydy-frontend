import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, ImageIcon, MessageSquareText, ShieldAlert } from "lucide-react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";

import Layout from "../../components/Layout";
import IncidenteDetalle from "../dashboard/incidentes/IncidenteDetalle";
import {
  useMarcarIncidenteEnProcesoMutation,
  useObtenerIncidentesQuery,
  useResolverIncidenteMutation,
} from "../../redux/api/incidentesApi";
import { useObtenerAreasUsuarioQuery, useObtenerEmpresasQuery, useObtenerLocacionesQuery } from "../../redux/api/empresasApi";
import { useObtenerEstructuraUsuarioQuery } from "../../redux/api/userApi";

const TIPOS_INCIDENTE = [
  { value: "manual", label: "Manual" },
  { value: "feedback_negativo", label: "Feedback negativo" },
  { value: "comentario_empleado", label: "Comentario del empleado" },
  { value: "geolocalizacion_fallida", label: "Geolocalización fallida" },
];

const PRIORIDADES_INCIDENTE = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
];

const ESTADOS_INCIDENTE = [
  { value: "abierto", label: "Abierto" },
  { value: "asignado", label: "Asignado" },
  { value: "en_proceso", label: "En proceso" },
  { value: "resuelto", label: "Resuelto" },
  { value: "cerrado", label: "Cerrado" },
];

const RESOLVER_INICIAL = {
  evidencia_resolucion: "",
  foto_resolucion: null,
};

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[28px] border border-dashed border-[#cddff0] bg-[#f8fbfe] px-5 py-10 text-center shadow-sm">
      <p className="text-base font-semibold text-[#0A2A47]">{title}</p>
      <p className="mt-2 text-sm text-[#5b6b79]">{description}</p>
    </div>
  );
}

function EstadoBadge({ estado }) {
  const estilos = {
    abierto: "bg-red-100 text-red-700 border-red-200",
    asignado: "bg-amber-100 text-amber-700 border-amber-200",
    en_proceso: "bg-blue-100 text-blue-700 border-blue-200",
    resuelto: "bg-emerald-100 text-emerald-700 border-emerald-200",
    cerrado: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const label = ESTADOS_INCIDENTE.find((item) => item.value === estado)?.label || estado || "-";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${estilos[estado] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
      {label}
    </span>
  );
}

function PrioridadBadge({ prioridad }) {
  const estilos = {
    baja: "bg-slate-100 text-slate-700 border-slate-200",
    media: "bg-amber-100 text-amber-700 border-amber-200",
    alta: "bg-orange-100 text-orange-700 border-orange-200",
    critica: "bg-red-100 text-red-700 border-red-200",
  };

  const label = PRIORIDADES_INCIDENTE.find((item) => item.value === prioridad)?.label || prioridad || "-";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${estilos[prioridad] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
      {label}
    </span>
  );
}

function TipoBadge({ tipo }) {
  const config = {
    manual: {
      label: "Manual",
      className: "bg-slate-100 text-slate-700 border-slate-200",
    },
    feedback_negativo: {
      label: "Feedback negativo",
      className: "bg-rose-100 text-rose-700 border-rose-200",
    },
    comentario_empleado: {
      label: "Comentario del empleado",
      className: "bg-blue-100 text-blue-700 border-blue-200",
    },
    geolocalizacion_fallida: {
      label: "Geolocalización fallida",
      className: "bg-orange-100 text-orange-700 border-orange-200",
    },
  };

  const item = config[tipo] || {
    label: TIPOS_INCIDENTE.find((entry) => entry.value === tipo)?.label || tipo || "-",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${item.className}`}>
      {item.label}
    </span>
  );
}

function formatFecha(fecha) {
  if (!fecha) return "-";
  const parsed = new Date(fecha);
  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleString("es-ES", {
    timeZone: "America/Guayaquil",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncarTexto(texto, max = 140) {
  if (!texto) return "-";
  return texto.length > max ? `${texto.slice(0, max).trim()}...` : texto;
}

function limpiarPayload(form) {
  return Object.entries(form).reduce((acc, [key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

function getIncidentSourceMeta(incidente) {
  if (incidente?.feedback_id) {
    return {
      label: "Feedback",
      hint: "Generado automáticamente desde feedback",
      url: null,
    };
  }

  if (incidente?.actividad_usuario_id) {
    return {
      label: "Actividad",
      hint: "Generado automáticamente desde actividad",
      url: null,
    };
  }

  return {
    label: "Manual",
    hint: "Creado manualmente",
    url: null,
  };
}

export default function EmpleadoIncidentes() {
  const currentUser = useSelector((state) => state.usuarios?.usuarioLogueado);
  const [searchParams] = useSearchParams();
  const [incidenteDetalleId, setIncidenteDetalleId] = useState(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [modalResolverOpen, setModalResolverOpen] = useState(false);
  const [incidenteResolviendo, setIncidenteResolviendo] = useState(null);
  const [incidenteViendoResolucion, setIncidenteViendoResolucion] = useState(null);
  const [modalVerResolucionOpen, setModalVerResolucionOpen] = useState(false);
  const [resolverForm, setResolverForm] = useState(RESOLVER_INICIAL);
  const [fotoResolucionPreview, setFotoResolucionPreview] = useState(null);

  const { data: incidentes = [], isLoading, isError } = useObtenerIncidentesQuery();
  const { data: empresas = [] } = useObtenerEmpresasQuery();
  const { data: locaciones = [] } = useObtenerLocacionesQuery();
  const { data: areas = [] } = useObtenerAreasUsuarioQuery();
  const { data: estructuraUsuario } = useObtenerEstructuraUsuarioQuery(currentUser?.id, {
    skip: !currentUser?.id,
  });
  const [resolverIncidente, { isLoading: resolviendoIncidente }] = useResolverIncidenteMutation();
  const [marcarIncidenteEnProceso] = useMarcarIncidenteEnProcesoMutation();
  const incidenteDeepLinkId = searchParams.get("incidente_id");

  const incidentesOrdenados = useMemo(
    () => [...incidentes].sort((a, b) => {
      const fechaB = new Date(b.ultimo_evento_en || b.actualizado_en || b.creado_en || 0);
      const fechaA = new Date(a.ultimo_evento_en || a.actualizado_en || a.creado_en || 0);
      return fechaB - fechaA;
    }),
    [incidentes]
  );

  const empresasMap = useMemo(() => {
    const base = empresas.reduce((acc, empresa) => {
      acc[empresa.id] = empresa;
      return acc;
    }, {});

    const empresaEstructura = estructuraUsuario?.locacion?.empresa;
    if (empresaEstructura?.id && !base[empresaEstructura.id]) {
      base[empresaEstructura.id] = empresaEstructura;
    }

    return base;
  }, [empresas, estructuraUsuario]);

  const locacionesMap = useMemo(() => {
    const base = locaciones.reduce((acc, locacion) => {
      acc[locacion.id] = locacion;
      return acc;
    }, {});

    const locacionEstructura = estructuraUsuario?.locacion;
    if (locacionEstructura?.id && !base[locacionEstructura.id]) {
      base[locacionEstructura.id] = locacionEstructura;
    }

    return base;
  }, [estructuraUsuario, locaciones]);

  const areasMap = useMemo(() => {
    const base = areas.reduce((acc, area) => {
      acc[area.id] = area;
      return acc;
    }, {});

    if (estructuraUsuario?.id && !base[estructuraUsuario.id]) {
      base[estructuraUsuario.id] = estructuraUsuario;
    }

    return base;
  }, [areas, estructuraUsuario]);

  const usuariosMap = useMemo(() => {
    const map = {};
    if (currentUser?.id) {
      map[currentUser.id] = currentUser;
    }
    return map;
  }, [currentUser]);

  const incidenteDetalle = useMemo(
    () => incidentesOrdenados.find((incidente) => incidente.id === incidenteDetalleId) || null,
    [incidenteDetalleId, incidentesOrdenados]
  );

  const incidenteDetalleSourceMeta = incidenteDetalle ? getIncidentSourceMeta(incidenteDetalle) : null;

  useEffect(() => {
    return () => {
      if (fotoResolucionPreview) {
        URL.revokeObjectURL(fotoResolucionPreview);
      }
    };
  }, [fotoResolucionPreview]);

  useEffect(() => {
    if (detalleOpen && incidenteDetalleId && !incidenteDetalle) {
      setDetalleOpen(false);
      setIncidenteDetalleId(null);
    }
  }, [detalleOpen, incidenteDetalle, incidenteDetalleId]);

  useEffect(() => {
    if (!incidenteDeepLinkId || isLoading) return;
    const incidenteObjetivo = incidentesOrdenados.find((incidente) => incidente.id === incidenteDeepLinkId);
    if (!incidenteObjetivo) return;

    setIncidenteDetalleId(incidenteObjetivo.id);
    setDetalleOpen(true);
  }, [incidenteDeepLinkId, incidentesOrdenados, isLoading]);

  const abrirDetalle = (incidente) => {
    setIncidenteDetalleId(incidente.id);
    setDetalleOpen(true);
  };

  const cerrarDetalle = () => {
    setDetalleOpen(false);
  };

  const abrirResolver = (incidente) => {
    setIncidenteResolviendo(incidente);
    setResolverForm({
      evidencia_resolucion: incidente.evidencia_resolucion || "",
      foto_resolucion: null,
    });
    setModalResolverOpen(true);
  };

  const cerrarResolver = () => {
    setModalResolverOpen(false);
    setIncidenteResolviendo(null);
    setResolverForm(RESOLVER_INICIAL);
    if (fotoResolucionPreview) {
      URL.revokeObjectURL(fotoResolucionPreview);
    }
    setFotoResolucionPreview(null);
  };

  const abrirVerResolucion = (incidente) => {
    setIncidenteViendoResolucion(incidente);
    setModalVerResolucionOpen(true);
  };

  const cerrarVerResolucion = () => {
    setIncidenteViendoResolucion(null);
    setModalVerResolucionOpen(false);
  };

  const handleFotoResolucionChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (fotoResolucionPreview) {
      URL.revokeObjectURL(fotoResolucionPreview);
    }

    setResolverForm((prev) => ({
      ...prev,
      foto_resolucion: file,
    }));

    setFotoResolucionPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleResolverIncidente = async () => {
    if (!incidenteResolviendo) return;

    try {
      await resolverIncidente({
        incidente_id: incidenteResolviendo.id,
        datos: limpiarPayload({
          evidencia_resolucion: resolverForm.evidencia_resolucion,
          foto_resolucion: resolverForm.foto_resolucion,
        }),
      }).unwrap();
      toast.success("Incidente marcado como resuelto");
      cerrarResolver();
    } catch (error) {
      toast.error(error?.data?.detail || "No se pudo resolver el incidente");
    }
  };

  const handleMarcarEnProceso = async (incidente) => {
    if (!incidente) return;

    try {
      await marcarIncidenteEnProceso(incidente.id).unwrap();
      toast.success("Incidente marcado en proceso");
    } catch (error) {
      toast.error(error?.data?.detail || "No se pudo actualizar el incidente");
    }
  };

  return (
    <Layout>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-5 md:px-6">
        <section className="relative overflow-hidden rounded-[24px] border border-[#e6f0f8] bg-white p-4 shadow-xl shadow-[#0A2A47]/5 md:rounded-[28px] md:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.16),_transparent_38%),radial-gradient(circle_at_bottom_left,_rgba(10,42,71,0.1),_transparent_42%)]" />
          <div className="relative flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3BAE3D] md:mb-2 md:text-[11px] md:tracking-[0.24em]">
                Seguimiento
              </p>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#0A2A47] md:text-4xl">
                Mis incidentes
              </h2>
              <p className="mt-1.5 text-sm text-[#5b6b79] md:mt-2">
                Revisa tus tickets relacionados, agrega contexto operativo y marca como resueltos los casos atendidos para revisión del supervisor.
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-3 py-1.5 text-xs font-semibold text-[#0A2A47] md:px-4 md:py-2 md:text-sm">
              <ShieldAlert size={16} />
              {isLoading ? "Cargando..." : `${incidentesOrdenados.length} incidentes`}
            </div>
          </div>
        </section>

        {isError ? (
          <EmptyState
            title="No se pudieron cargar los incidentes"
            description="Intenta actualizar la vista o revisa la conexión con el sistema."
          />
        ) : isLoading ? (
          <EmptyState
            title="Cargando incidentes"
            description="Estamos trayendo la información más reciente para tu seguimiento operativo."
          />
        ) : incidentesOrdenados.length === 0 ? (
          <EmptyState
            title="No tienes incidentes relacionados"
            description="Aquí aparecerán los incidentes donde estés vinculado como empleado o responsable."
          />
        ) : (
          <section className="space-y-4">
            {incidentesOrdenados.map((incidente) => {
              const sourceMeta = getIncidentSourceMeta(incidente);
              const fechaReferencia = incidente.ultimo_evento_en || incidente.actualizado_en || incidente.creado_en;

              return (
                <article
                  key={incidente.id}
                  className="rounded-[28px] border border-[#e6f0f8] bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <TipoBadge tipo={incidente.tipo} />
                        <PrioridadBadge prioridad={incidente.prioridad} />
                        <EstadoBadge estado={incidente.estado} />
                      </div>

                      <h3 className="mt-4 text-lg font-bold tracking-tight text-[#0A2A47]">
                        {truncarTexto(incidente.descripcion, 180)}
                      </h3>

                      <div className="mt-3 grid gap-3 text-sm text-[#5b6b79] md:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Última actividad</p>
                          <p className="mt-1 font-medium text-[#0A2A47]">{formatFecha(fechaReferencia)}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Empresa</p>
                          <p className="mt-1 font-medium text-[#0A2A47]">{empresasMap[incidente.empresa_id]?.nombre || "Sin empresa"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Locación</p>
                          <p className="mt-1 font-medium text-[#0A2A47]">{locacionesMap[incidente.locacion_id]?.nombre || "Sin locación"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Origen</p>
                          <p className="mt-1 font-medium text-[#0A2A47]">{sourceMeta.hint}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:min-w-[144px]">
                      <button
                        type="button"
                        onClick={() => abrirDetalle(incidente)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#071f35] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#071f35]/10 transition hover:bg-[#123b63]"
                      >
                        <Eye size={16} />
                        Ver
                      </button>
                      <div className="rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-3 py-2 text-center text-xs font-medium text-[#5b6b79]">
                        Ticket operativo
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <IncidenteDetalle
          open={detalleOpen}
          incidente={incidenteDetalle}
          onClose={cerrarDetalle}
          canEdit={false}
          canMarkInProgress={true}
          canResolve={true}
          canClose={false}
          canDelete={false}
          empresasMap={empresasMap}
          locacionesMap={locacionesMap}
          areasMap={areasMap}
          usuariosMap={usuariosMap}
          asignables={[]}
          sourceMeta={incidenteDetalleSourceMeta}
          onNavigateToSource={() => {}}
          onMarkInProgress={handleMarcarEnProceso}
          onResolver={abrirResolver}
          onCerrar={() => {}}
          onEliminar={() => {}}
          onVerResolucion={abrirVerResolucion}
          formatFecha={formatFecha}
          TipoBadge={TipoBadge}
          PrioridadBadge={PrioridadBadge}
          EstadoBadge={EstadoBadge}
          tiposIncidente={TIPOS_INCIDENTE}
          estadosIncidente={ESTADOS_INCIDENTE}
          prioridadesIncidente={PRIORIDADES_INCIDENTE}
        />

        {modalResolverOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm px-4">
            <div className="w-full max-w-xl rounded-[28px] bg-white border border-[#e6f0f8] shadow-2xl p-5 md:p-6">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#e6f0f8]">
                <h2 className="text-2xl font-extrabold tracking-tight text-[#0A2A47]">Resolver incidente</h2>
                <button
                  type="button"
                  onClick={cerrarResolver}
                  className="w-9 h-9 rounded-xl bg-[#f4f8fb] text-[#0A2A47] hover:bg-[#e6f0f8] font-bold transition"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-[#e6f0f8] bg-[#f8fbfd] px-4 py-4">
                  <p className="text-sm font-semibold text-[#0A2A47]">Detalle de resolución</p>
                  <p className="mt-1 text-sm text-[#5b6b79]">
                    Deja evidencia operativa para que el supervisor pueda revisar y cerrar el ticket después.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#0A2A47]">Evidencia o comentario</label>
                  <textarea
                    value={resolverForm.evidencia_resolucion}
                    onChange={(event) => setResolverForm((prev) => ({ ...prev, evidencia_resolucion: event.target.value }))}
                    rows={4}
                    placeholder="Describe qué hiciste para resolver el incidente"
                    className="mt-2 w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-[#0A2A47] placeholder:text-[#8a99a8] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#0A2A47]">Foto de resolución</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFotoResolucionChange}
                    className="mt-2 w-full rounded-2xl border border-[#dbe8f2] bg-white px-4 py-3 text-sm text-[#0A2A47] file:mr-3 file:rounded-xl file:border-0 file:bg-[#e6f0f8] file:px-3 file:py-1.5 file:font-semibold file:text-[#0A2A47]"
                  />
                </div>

                {fotoResolucionPreview ? (
                  <div className="rounded-2xl border border-[#e6f0f8] bg-white p-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#0A2A47]">
                      <ImageIcon size={16} />
                      Vista previa
                    </div>
                    <img
                      src={fotoResolucionPreview}
                      alt="Vista previa de resolución"
                      className="mt-3 w-full rounded-2xl border border-[#e6f0f8] bg-[#f8fbfd] object-contain max-h-72"
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col md:flex-row gap-2 mt-5">
                <button
                  type="button"
                  onClick={handleResolverIncidente}
                  disabled={resolviendoIncidente}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#071f35] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#071f35]/10 transition hover:bg-[#123b63] disabled:opacity-60"
                >
                  <CheckCircle2 size={16} />
                  {resolviendoIncidente ? "Resolviendo..." : "Marcar como resuelto"}
                </button>
                <button
                  type="button"
                  onClick={cerrarResolver}
                  className="border border-[#dbe8f2] text-[#0A2A47] px-4 py-3 rounded-2xl font-semibold hover:border-[#0A2A47] hover:bg-[#f8fbfd] transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {modalVerResolucionOpen && incidenteViendoResolucion ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm px-4">
            <div className="w-full max-w-xl rounded-[28px] bg-white border border-[#e6f0f8] shadow-2xl p-5 md:p-6">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#e6f0f8]">
                <h2 className="text-2xl font-extrabold tracking-tight text-[#0A2A47]">Resolución registrada</h2>
                <button
                  type="button"
                  onClick={cerrarVerResolucion}
                  className="w-9 h-9 rounded-xl bg-[#f4f8fb] text-[#0A2A47] hover:bg-[#e6f0f8] font-bold transition"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-[#e6f0f8] bg-[#f8fbfd] px-4 py-4">
                  <p className="text-sm font-semibold text-[#0A2A47]">Evidencia de resolución</p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-[#5b6b79]">
                    {incidenteViendoResolucion.evidencia_resolucion?.trim() || "Sin evidencia textual registrada."}
                  </p>
                </div>

                {incidenteViendoResolucion.foto_resolucion ? (
                  <div className="rounded-2xl border border-[#e6f0f8] bg-white p-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#0A2A47]">
                      <ImageIcon size={16} />
                      Foto de resolución
                    </div>
                    <img
                      src={incidenteViendoResolucion.foto_resolucion}
                      alt="Foto de resolución"
                      className="mt-3 w-full rounded-2xl border border-[#e6f0f8] bg-[#f8fbfd] object-contain max-h-80"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}

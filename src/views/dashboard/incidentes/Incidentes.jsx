import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, ImageIcon, MapPin, MessageSquareText, Plus, ScanSearch, Search, ShieldAlert, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";

import Layout from "../../../components/Layout";
import IncidenteDetalle from "./IncidenteDetalle";
import {
  useCerrarIncidenteMutation,
  useCrearIncidenteMutation,
  useEliminarIncidenteMutation,
  useObtenerIncidentesQuery,
  useResolverIncidenteMutation,
} from "../../../redux/api/incidentesApi";
import {
  useObtenerAreasUsuarioQuery,
  useObtenerEmpresasQuery,
  useObtenerLocacionesQuery,
} from "../../../redux/api/empresasApi";
import { useObtenerUsuariosQuery } from "../../../redux/api/userApi";
import { formatBackendDateTime, getBusinessPeriodRange } from "../../../utils/dateTime";

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

const FORM_INICIAL = {
  tipo: "manual",
  prioridad: "media",
  descripcion: "",
  empresa_id: "",
  locacion_id: "",
  area_id: "",
  empleado_id: "",
  supervisor_id: "",
  asignado_a_id: "",
  evidencia_inicial: "",
};

const RESOLVER_INICIAL = {
  evidencia_resolucion: "",
  foto_resolucion: null,
};

const PERIODOS_INCIDENTES = [
  { value: "hoy", label: "Hoy" },
  { value: "7dias", label: "7 días" },
  { value: "1mes", label: "1 mes" },
  { value: "6meses", label: "6 meses" },
  { value: "1anio", label: "1 año" },
];

function TarjetaResumen({ titulo, valor, icono, principal = false }) {
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
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${estilos[estado] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
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
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${estilos[prioridad] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
      {label}
    </span>
  );
}

function TipoBadge({ tipo }) {
  const config = {
    manual: {
      label: "Manual",
      className: "bg-slate-100 text-slate-700 border-slate-200",
      icon: ShieldAlert,
    },
    feedback_negativo: {
      label: "Feedback negativo",
      className: "bg-rose-100 text-rose-700 border-rose-200",
      icon: ScanSearch,
    },
    comentario_empleado: {
      label: "Comentario del empleado",
      className: "bg-blue-100 text-blue-700 border-blue-200",
      icon: MessageSquareText,
    },
    geolocalizacion_fallida: {
      label: "Geolocalización fallida",
      className: "bg-orange-100 text-orange-700 border-orange-200",
      icon: MapPin,
    },
  };

  const item = config[tipo] || {
    label: TIPOS_INCIDENTE.find((entry) => entry.value === tipo)?.label || tipo || "-",
    className: "bg-gray-100 text-gray-700 border-gray-200",
    icon: AlertTriangle,
  };

  const Icon = item.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${item.className}`}>
      <Icon size={12} />
      {item.label}
    </span>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-xl border border-dashed border-[#cddff0] bg-[#f8fbfe] px-4 py-10 text-center">
      <p className="text-base font-semibold text-[#0A2A47]">{title}</p>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  );
}

function FieldLabel({ children }) {
  return <label className="block mb-1 text-sm font-semibold text-[#0A2A47]">{children}</label>;
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
      label: "Ver feedback",
      hint: "Automático desde feedback",
      url: `/reportes-feedback?feedback=${incidente.feedback_id}`,
    };
  }

  if (incidente?.actividad_usuario_id) {
    return {
      label: "Ver actividad",
      hint: "Automático desde actividad",
      url: `/reportes?actividad=${incidente.actividad_usuario_id}`,
    };
  }

  return {
    label: "Manual",
    hint: "Creado manualmente",
    url: null,
  };
}

export default function Incidentes() {
  const [searchParams] = useSearchParams();
  const currentUser = useSelector((state) => state.usuarios?.usuarioLogueado);
  const currentRole = (currentUser?.rol || "").toLowerCase();
  const isAdmin = currentRole === "admin";
  const isSupervisor = currentRole === "supervisor";
  const isEmpleado = currentRole === "empleado";
  const canCreate = isAdmin || isSupervisor;
  const canEdit = isAdmin || isSupervisor;
  const canResolve = isAdmin || isSupervisor;
  const canClose = isAdmin || isSupervisor;
  const canDelete = isAdmin;

  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("1mes");

  const rangoPeriodo = useMemo(() => {
    const { desde, hasta } = getBusinessPeriodRange(periodoSeleccionado);
    return {
      desde,
      hasta,
      params: {
        desde: formatBackendDateTime(desde),
        hasta: formatBackendDateTime(hasta),
      },
    };
  }, [periodoSeleccionado]);

  const { data: incidentes = [], isLoading, isFetching, isError } = useObtenerIncidentesQuery(rangoPeriodo.params);
  const { data: empresas = [] } = useObtenerEmpresasQuery();
  const { data: locaciones = [] } = useObtenerLocacionesQuery();
  const { data: areas = [] } = useObtenerAreasUsuarioQuery();
  const { data: usuarios = [] } = useObtenerUsuariosQuery();

  const [crearIncidente, { isLoading: creandoIncidente }] = useCrearIncidenteMutation();
  const [resolverIncidente, { isLoading: resolviendoIncidente }] = useResolverIncidenteMutation();
  const [cerrarIncidente, { isLoading: cerrandoIncidente }] = useCerrarIncidenteMutation();
  const [eliminarIncidente, { isLoading: eliminandoIncidente }] = useEliminarIncidenteMutation();

  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroLocacion, setFiltroLocacion] = useState("");
  const [filtroArea, setFiltroArea] = useState("");
  const [filtroSupervisor, setFiltroSupervisor] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [modalFormularioOpen, setModalFormularioOpen] = useState(false);
  const [modalResolverOpen, setModalResolverOpen] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);
  const [incidenteResolviendo, setIncidenteResolviendo] = useState(null);
  const [incidenteViendoResolucion, setIncidenteViendoResolucion] = useState(null);
  const [incidenteDetalleId, setIncidenteDetalleId] = useState(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [highlightedIncidenteId, setHighlightedIncidenteId] = useState(null);
  const [modalVerResolucionOpen, setModalVerResolucionOpen] = useState(false);
  const [fotoResolucionPreview, setFotoResolucionPreview] = useState(null);

  const [form, setForm] = useState(FORM_INICIAL);
  const [resolverForm, setResolverForm] = useState(RESOLVER_INICIAL);
  const incidenteRowRefs = useRef({});
  const deepLinkHandledRef = useRef(null);
  const deepLinkMissingRef = useRef(null);
  const highlightTimeoutRef = useRef(null);
  const feedbackDeepLinkId = searchParams.get("feedback");
  const actividadDeepLinkId = searchParams.get("actividad");
  const incidenteDeepLinkId = searchParams.get("incidente_id");

  const empresasMap = useMemo(
    () => empresas.reduce((acc, empresa) => {
      acc[empresa.id] = empresa;
      return acc;
    }, {}),
    [empresas]
  );

  const locacionesMap = useMemo(
    () => locaciones.reduce((acc, locacion) => {
      acc[locacion.id] = locacion;
      return acc;
    }, {}),
    [locaciones]
  );

  const areasMap = useMemo(
    () => areas.reduce((acc, area) => {
      acc[area.id] = area;
      return acc;
    }, {}),
    [areas]
  );

  const usuariosMap = useMemo(
    () => usuarios.reduce((acc, usuario) => {
      acc[usuario.id] = usuario;
      return acc;
    }, {}),
    [usuarios]
  );

  const empleados = useMemo(
    () => usuarios.filter((usuario) => usuario.rol === "empleado"),
    [usuarios]
  );

  const supervisores = useMemo(
    () => usuarios.filter((usuario) => usuario.rol === "supervisor"),
    [usuarios]
  );

  const asignables = useMemo(
    () => usuarios.filter((usuario) => ["admin", "supervisor", "empleado"].includes(usuario.rol)),
    [usuarios]
  );

  const supervisorLocacionesIds = useMemo(
    () => new Set(locaciones.map((locacion) => locacion.id)),
    [locaciones]
  );

  const empresasDisponibles = useMemo(() => {
    if (!isSupervisor) return empresas;
    const empresaIds = new Set(locaciones.map((locacion) => locacion.empresa_id).filter(Boolean));
    return empresas.filter((empresa) => empresaIds.has(empresa.id));
  }, [empresas, isSupervisor, locaciones]);

  const locacionesFiltradas = useMemo(() => {
    if (!form.empresa_id) return locaciones;
    return locaciones.filter((locacion) => locacion.empresa_id === form.empresa_id);
  }, [form.empresa_id, locaciones]);

  const areasDisponibles = useMemo(() => {
    if (!isSupervisor) return areas;
    return areas.filter((area) => supervisorLocacionesIds.has(area.locacion_id));
  }, [areas, isSupervisor, supervisorLocacionesIds]);

  const areasFiltradas = useMemo(() => {
    if (!form.locacion_id) return areasDisponibles;
    return areasDisponibles.filter((area) => area.locacion_id === form.locacion_id);
  }, [areasDisponibles, form.locacion_id]);

  const locacionesFiltroDisponibles = useMemo(() => {
    if (!filtroArea) return locaciones;
    const area = areasMap[filtroArea];
    if (!area?.locacion_id) return locaciones;
    return locaciones.filter((locacion) => locacion.id === area.locacion_id);
  }, [areasMap, filtroArea, locaciones]);

  const areasFiltroDisponibles = useMemo(() => {
    if (!filtroLocacion) return areasDisponibles;
    return areasDisponibles.filter((area) => area.locacion_id === filtroLocacion);
  }, [areasDisponibles, filtroLocacion]);

  const incidentesFiltrados = useMemo(() => {
    return incidentes
      .filter((incidente) => (filtroEstado ? incidente.estado === filtroEstado : true))
      .filter((incidente) => (filtroPrioridad ? incidente.prioridad === filtroPrioridad : true))
      .filter((incidente) => (filtroTipo ? incidente.tipo === filtroTipo : true))
      .filter((incidente) => (filtroLocacion ? incidente.locacion_id === filtroLocacion : true))
      .filter((incidente) => (filtroArea ? incidente.area_id === filtroArea : true))
      .filter((incidente) => (filtroSupervisor ? incidente.supervisor_id === filtroSupervisor : true))
      .filter((incidente) => {
        if (!busqueda.trim()) return true;
        const texto = busqueda.trim().toLowerCase();
        const locacionNombre = locacionesMap[incidente.locacion_id]?.nombre || "";
        const areaNombre = areasMap[incidente.area_id]?.nombre || "";
        const empresaNombre = empresasMap[incidente.empresa_id]?.nombre || "";
        const empleadoNombre = usuariosMap[incidente.empleado_id]?.nombre || "";
        const supervisorNombre = usuariosMap[incidente.supervisor_id]?.nombre || "";
        const asignadoNombre = usuariosMap[incidente.asignado_a_id]?.nombre || "";

        return [
          incidente.descripcion,
          incidente.tipo,
          incidente.estado,
          incidente.prioridad,
          empresaNombre,
          locacionNombre,
          areaNombre,
          empleadoNombre,
          supervisorNombre,
          asignadoNombre,
        ]
          .filter(Boolean)
          .some((valor) => valor.toLowerCase().includes(texto));
      })
      .sort((a, b) => {
        const fechaB = new Date(b.ultimo_evento_en || b.creado_en || 0);
        const fechaA = new Date(a.ultimo_evento_en || a.creado_en || 0);
        return fechaB - fechaA;
      });
  }, [areasMap, busqueda, empresasMap, filtroArea, filtroEstado, filtroLocacion, filtroPrioridad, filtroSupervisor, filtroTipo, incidentes, locacionesMap, usuariosMap]);

  const resumen = useMemo(() => {
    return {
      total: incidentes.length,
      abiertos: incidentes.filter((item) => item.estado === "abierto").length,
      enCurso: incidentes.filter((item) => item.estado === "asignado" || item.estado === "en_proceso").length,
      resueltos: incidentes.filter((item) => item.estado === "resuelto" || item.estado === "cerrado").length,
    };
  }, [incidentes]);

  const incidenteDetalle = useMemo(
    () => incidentes.find((incidente) => incidente.id === incidenteDetalleId) || null,
    [incidenteDetalleId, incidentes]
  );
  const incidenteDetalleSourceMeta = incidenteDetalle ? getIncidentSourceMeta(incidenteDetalle) : null;

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
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
    const deepLinkValue = incidenteDeepLinkId || feedbackDeepLinkId || actividadDeepLinkId;
    if (!deepLinkValue || isLoading) return;

    const incidenteObjetivo = incidentesFiltrados.find((incidente) => {
      if (incidenteDeepLinkId) return incidente.id === incidenteDeepLinkId;
      if (feedbackDeepLinkId) return incidente.feedback_id === feedbackDeepLinkId;
      return incidente.actividad_usuario_id === actividadDeepLinkId;
    });

    if (incidenteObjetivo) {
      if (deepLinkHandledRef.current === deepLinkValue) return;
      deepLinkHandledRef.current = deepLinkValue;
      deepLinkMissingRef.current = null;

      setHighlightedIncidenteId(incidenteObjetivo.id);
      setIncidenteDetalleId(incidenteObjetivo.id);
      setDetalleOpen(true);

      requestAnimationFrame(() => {
        incidenteRowRefs.current[incidenteObjetivo.id]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });

      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedIncidenteId((current) => (
          current === incidenteObjetivo.id ? null : current
        ));
      }, 4000);

      return;
    }

    if (incidentesFiltrados.length > 0 && deepLinkMissingRef.current !== deepLinkValue) {
      deepLinkMissingRef.current = deepLinkValue;
      toast.info("El incidente enlazado no está visible con los registros cargados.");
    }
  }, [actividadDeepLinkId, feedbackDeepLinkId, incidenteDeepLinkId, incidentesFiltrados, isLoading]);

  const abrirCrear = () => {
    if (!canCreate) return;
    setForm(FORM_INICIAL);
    setModalFormularioOpen(true);
  };

  const abrirDetalle = (incidente) => {
    setIncidenteDetalleId(incidente.id);
    setDetalleOpen(true);
  };

  const cerrarDetalle = () => {
    setDetalleOpen(false);
  };

  const cerrarFormulario = () => {
    setModalFormularioOpen(false);
    setForm(FORM_INICIAL);
  };

  const abrirResolver = (incidente) => {
    if (!canResolve) return;
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
    const file = event.target.files?.[0];
    if (fotoResolucionPreview) {
      URL.revokeObjectURL(fotoResolucionPreview);
    }

    setResolverForm((prev) => ({
      ...prev,
      foto_resolucion: file || null,
    }));

    if (file) {
      setFotoResolucionPreview(URL.createObjectURL(file));
      return;
    }

    setFotoResolucionPreview(null);
  };

  const handleEmpresaChange = (empresa_id) => {
    setForm((prev) => ({
      ...prev,
      empresa_id,
      locacion_id: "",
      area_id: "",
    }));
  };

  const handleLocacionChange = (locacion_id) => {
    setForm((prev) => ({
      ...prev,
      locacion_id,
      area_id: "",
    }));
  };

  const handleGuardarIncidente = async () => {
    if (!canCreate) return;
    if (!form.descripcion.trim()) {
      toast.error("La descripción es obligatoria");
      return;
    }

    try {
      const payload = limpiarPayload(form);
      await crearIncidente(payload).unwrap();
      toast.success("Incidente creado");

      cerrarFormulario();
    } catch (error) {
      toast.error(error?.data?.detail || "No se pudo guardar el incidente");
    }
  };

  const handleResolverIncidente = async () => {
    if (!canResolve || !incidenteResolviendo) return;

    try {
      await resolverIncidente({
        incidente_id: incidenteResolviendo.id,
        datos: limpiarPayload({
          evidencia_resolucion: resolverForm.evidencia_resolucion,
          foto_resolucion: resolverForm.foto_resolucion,
        }),
      }).unwrap();
      toast.success("Incidente resuelto");
      cerrarResolver();
    } catch (error) {
      toast.error(error?.data?.detail || "No se pudo resolver el incidente");
    }
  };

  const confirmarCerrar = (incidente) => {
    if (!canClose) return;
    setConfirmacion({
      titulo: "Cerrar incidente",
      descripcion: "Esta acción marcará el incidente como cerrado.",
      confirmText: "Cerrar incidente",
      danger: false,
      onConfirm: async () => {
        try {
          await cerrarIncidente(incidente.id).unwrap();
          toast.success("Incidente cerrado");
          setConfirmacion(null);
        } catch (error) {
          toast.error(error?.data?.detail || "No se pudo cerrar el incidente");
        }
      },
    });
  };

  const confirmarEliminar = (incidente) => {
    if (!canDelete) return;
    setConfirmacion({
      titulo: "Eliminar incidente",
      descripcion: "Esta acción eliminará el incidente de forma permanente.",
      confirmText: "Eliminar incidente",
      danger: true,
      onConfirm: async () => {
        try {
          await eliminarIncidente(incidente.id).unwrap();
          toast.success("Incidente eliminado");
          setConfirmacion(null);
        } catch (error) {
          toast.error(error?.data?.detail || "No se pudo eliminar el incidente");
        }
      },
    });
  };

  const ejecutandoConfirmacion = cerrandoIncidente || eliminandoIncidente;
  const supervisorSinLocaciones = isSupervisor && locaciones.length === 0;
  const emptyStateTitle = incidentes.length === 0
    ? isAdmin
      ? "Todavía no hay incidentes"
      : isSupervisor
        ? "No hay incidentes en tu alcance"
        : "No tienes incidentes relacionados"
    : "No hay resultados para esos filtros";
  const emptyStateDescription = incidentes.length === 0
    ? isAdmin
      ? "Crea el primer incidente manual para empezar a gestionar desvíos operativos."
      : isSupervisor
        ? supervisorSinLocaciones
          ? "Aún no tienes locaciones asignadas. Cuando se te asigne una, aquí verás los incidentes de tu alcance."
          : "Todavía no hay incidentes visibles dentro de tus locaciones o asignaciones."
        : "Aquí aparecerán los incidentes creados por ti o asignados a tu usuario."
    : "Prueba cambiando estado, prioridad, tipo, locación, área o el texto de búsqueda.";

  return (
    <Layout>
      <div className="p-4 md:p-6 bg-[#f4f8fb] min-h-full">
        <div className="relative overflow-hidden mb-6 rounded-[28px] bg-white border border-[#e6f0f8] shadow-xl shadow-[#0A2A47]/5 p-5 md:p-6">
          <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.12),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(10,42,71,0.08),_transparent_35%)]" />
          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#0A2A47] tracking-tight">Incidentes</h1>
              <p className="mt-2 text-sm text-[#5b6b79] max-w-2xl">
                Centraliza desvíos operativos, asignación, resolución y trazabilidad desde una sola vista.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 lg:items-end">
              {canCreate ? (
                <button
                  onClick={abrirCrear}
                  disabled={isSupervisor && supervisorSinLocaciones}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#3BAE3D] text-white px-4 py-3 font-semibold shadow-lg shadow-[#3BAE3D]/20 transition hover:bg-[#2f9631] disabled:opacity-50 disabled:hover:bg-[#3BAE3D]"
                >
                  <Plus size={16} />
                  Crear incidente
                </button>
              ) : null}

              {isSupervisor && supervisorSinLocaciones ? (
                <p className="max-w-sm text-sm text-[#5b6b79] lg:text-right">
                  No tienes locaciones asignadas por ahora, así que no podrás crear incidentes manuales todavía.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <TarjetaResumen titulo="Total incidentes" valor={isLoading || isFetching ? "..." : resumen.total} icono={<ShieldAlert />} principal />
          <TarjetaResumen titulo="Abiertos" valor={isLoading || isFetching ? "..." : resumen.abiertos} icono={<AlertTriangle size={16} />} />
          <TarjetaResumen titulo="Asignados / en proceso" valor={isLoading || isFetching ? "..." : resumen.enCurso} icono={<XCircle size={16} />} />
          <TarjetaResumen titulo="Resueltos / cerrados" valor={isLoading || isFetching ? "..." : resumen.resueltos} icono={<CheckCircle2 size={16} />} />
        </div>

        <div className="bg-white border border-[#e6f0f8] rounded-2xl p-3 mb-3 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
            <div className="relative md:col-span-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7b8a97]" size={18} />
            <input
              type="text"
              placeholder="Buscar por descripción o contexto"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-xl border border-[#dbe8f2] bg-[#f8fbfd] py-2.5 pl-10 pr-4 text-sm text-[#0A2A47] outline-none transition placeholder:text-[#8a99a8] focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
            />
            </div>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full md:col-span-3 rounded-xl border border-[#dbe8f2] bg-[#f8fbfd] px-3.5 py-2.5 text-sm text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
            >
              <option value="">Todos los estados</option>
              {ESTADOS_INCIDENTE.map((estado) => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>

            <select
              value={filtroPrioridad}
              onChange={(e) => setFiltroPrioridad(e.target.value)}
              className="w-full md:col-span-2 rounded-xl border border-[#dbe8f2] bg-[#f8fbfd] px-3.5 py-2.5 text-sm text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
            >
              <option value="">Prioridades</option>
              {PRIORIDADES_INCIDENTE.map((prioridad) => (
                <option key={prioridad.value} value={prioridad.value}>
                  {prioridad.label}
                </option>
              ))}
            </select>

            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full md:col-span-3 rounded-xl border border-[#dbe8f2] bg-[#f8fbfd] px-3.5 py-2.5 text-sm text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
            >
              <option value="">Todos los tipos</option>
              {TIPOS_INCIDENTE.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white border border-[#e6f0f8] rounded-2xl p-3 mb-3 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
            <select
              value={filtroLocacion}
              onChange={(e) => {
                setFiltroLocacion(e.target.value);
                setFiltroArea("");
              }}
              className="w-full md:col-span-4 rounded-xl border border-[#dbe8f2] bg-[#f8fbfd] px-3.5 py-2.5 text-sm text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
            >
              <option value="">Todas las locaciones</option>
              {locacionesFiltroDisponibles.map((locacion) => (
                <option key={locacion.id} value={locacion.id}>
                  {locacion.nombre}
                </option>
              ))}
            </select>

            <select
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value)}
              className="w-full md:col-span-4 rounded-xl border border-[#dbe8f2] bg-[#f8fbfd] px-3.5 py-2.5 text-sm text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
            >
              <option value="">Todas las áreas</option>
              {areasFiltroDisponibles.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.nombre}
                </option>
              ))}
            </select>

            {isAdmin ? (
              <select
                value={filtroSupervisor}
                onChange={(e) => setFiltroSupervisor(e.target.value)}
                className="w-full md:col-span-4 rounded-xl border border-[#dbe8f2] bg-[#f8fbfd] px-3.5 py-2.5 text-sm text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
              >
                <option value="">Todos los supervisores</option>
                {supervisores.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nombre}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-[#e6f0f8] bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#0A2A47]">Período por última modificación</p>
              <p className="mt-1 text-xs text-[#7b8a97]">
                Este filtro usa la fecha del último movimiento del incidente, no la fecha original de creación.
              </p>
            </div>
            <div className="inline-flex flex-wrap gap-1 rounded-xl bg-[#f4f8fb] border border-[#e6f0f8] p-1">
              {PERIODOS_INCIDENTES.map((periodo) => {
                const activo = periodoSeleccionado === periodo.value;
                return (
                  <button
                    key={periodo.value}
                    type="button"
                    onClick={() => setPeriodoSeleccionado(periodo.value)}
                    className={`px-2.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      activo
                        ? "bg-[#071f35] text-white shadow-md shadow-[#071f35]/15"
                        : "text-[#0A2A47] hover:bg-white hover:shadow-sm"
                    }`}
                  >
                    {periodo.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {isError ? (
          <EmptyState
            title="No se pudieron cargar los incidentes"
            description="Intenta actualizar la vista o revisa la conexión con el backend."
          />
        ) : isLoading ? (
          <EmptyState
            title="Cargando incidentes"
            description="Estamos trayendo la información más reciente para tu operación."
          />
        ) : incidentesFiltrados.length === 0 ? (
          <EmptyState
            title={emptyStateTitle}
            description={emptyStateDescription}
          />
        ) : (
          <div className="max-h-[60vh] overflow-auto rounded-3xl border border-[#e6f0f8] bg-white shadow-sm">
            <table className="w-full text-left text-[#0A2A47]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-white/95 backdrop-blur text-[#0A2A47] border-b border-[#e6f0f8] text-sm">
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Tipo</th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Prioridad</th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Estado</th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Descripción / origen</th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Creado</th>
                  <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Ver</th>
                </tr>
              </thead>
              <tbody className="text-sm text-[#0A2A47]">
                {incidentesFiltrados.map((incidente) => (
                  (() => {
                    const sourceMeta = getIncidentSourceMeta(incidente);

                    return (
                  <tr
                    key={incidente.id}
                    ref={(node) => {
                      if (node) {
                        incidenteRowRefs.current[incidente.id] = node;
                      }
                    }}
                    className={`transition-colors border-b border-[#edf3f8] hover:bg-[#fbfdff] align-top ${
                      highlightedIncidenteId === incidente.id ? "bg-[#eef6ff] border-l-4 border-l-[#0A2A47]" : ""
                    }`}
                  >
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <TipoBadge tipo={incidente.tipo} />
                        {sourceMeta.url ? (
                          <span className="text-[11px] font-medium text-gray-500">{sourceMeta.hint}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <PrioridadBadge prioridad={incidente.prioridad} />
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <EstadoBadge estado={incidente.estado} />
                    </td>
                    <td className="py-4 px-4 min-w-[260px]">
                      <p className="font-medium">{incidente.descripcion}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {empresasMap[incidente.empresa_id]?.nombre || "Sin empresa"}
                        {" · "}
                        {locacionesMap[incidente.locacion_id]?.nombre || "Sin locación"}
                        {" · "}
                        {areasMap[incidente.area_id]?.nombre || "Sin área"}
                      </p>
                      <div className="mt-2 inline-flex items-center rounded-full border border-[#dbe8f2] bg-[#f8fbfd] px-2.5 py-1 text-[11px] font-medium text-[#5b6b79]">
                        {sourceMeta.hint}
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">{formatFecha(incidente.creado_en)}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => abrirDetalle(incidente)}
                          className="inline-flex items-center gap-2 rounded-xl border border-[#dbe8f2] bg-white px-3 py-2 text-sm font-semibold text-[#0A2A47] transition hover:border-[#0A2A47] hover:bg-[#f8fbfd]"
                          title="Ver detalle"
                        >
                          <Eye size={16} />
                          Ver
                        </button>
                      </div>
                    </td>
                  </tr>
                    );
                  })()
                ))}
              </tbody>
            </table>
          </div>
        )}

        <IncidenteDetalle
          open={detalleOpen}
          incidente={incidenteDetalle}
          onClose={cerrarDetalle}
          canEdit={canEdit}
          canResolve={canResolve}
          canClose={canClose}
          canDelete={canDelete}
          empresasMap={empresasMap}
          locacionesMap={locacionesMap}
          areasMap={areasMap}
          usuariosMap={usuariosMap}
          asignables={asignables}
          sourceMeta={incidenteDetalleSourceMeta}
          onNavigateToSource={() => {
            if (incidenteDetalleSourceMeta?.url) {
              window.location.assign(incidenteDetalleSourceMeta.url);
            }
          }}
          onResolver={abrirResolver}
          onCerrar={confirmarCerrar}
          onEliminar={confirmarEliminar}
          onVerResolucion={abrirVerResolucion}
          formatFecha={formatFecha}
          TipoBadge={TipoBadge}
          PrioridadBadge={PrioridadBadge}
          EstadoBadge={EstadoBadge}
          tiposIncidente={TIPOS_INCIDENTE}
          estadosIncidente={ESTADOS_INCIDENTE}
          prioridadesIncidente={PRIORIDADES_INCIDENTE}
        />

        {modalFormularioOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm px-4">
            <div className="w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-[28px] bg-white border border-[#e6f0f8] shadow-2xl p-5 md:p-6">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#e6f0f8]">
                <h2 className="text-2xl font-extrabold tracking-tight text-[#0A2A47]">
                  Crear incidente
                </h2>
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  className="w-9 h-9 rounded-xl bg-[#f4f8fb] text-[#0A2A47] hover:bg-[#e6f0f8] font-bold transition"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Tipo</FieldLabel>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value }))}
                    className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                  >
                    {TIPOS_INCIDENTE.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel>Prioridad</FieldLabel>
                  <select
                    value={form.prioridad}
                    onChange={(e) => setForm((prev) => ({ ...prev, prioridad: e.target.value }))}
                    className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                  >
                    {PRIORIDADES_INCIDENTE.map((prioridad) => (
                      <option key={prioridad.value} value={prioridad.value}>
                        {prioridad.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <FieldLabel>Descripción</FieldLabel>
                  <textarea
                    value={form.descripcion}
                    onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                    rows={4}
                    placeholder="Describe el incidente y el contexto operativo"
                    className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-[#0A2A47] placeholder:text-[#8a99a8] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                  />
                </div>

                <div>
                  <FieldLabel>Empresa</FieldLabel>
                  <select
                    value={form.empresa_id}
                    onChange={(e) => handleEmpresaChange(e.target.value)}
                    className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                  >
                    <option value="">Sin empresa</option>
                    {empresasDisponibles.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel>Locación</FieldLabel>
                  <select
                    value={form.locacion_id}
                    onChange={(e) => handleLocacionChange(e.target.value)}
                    className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                  >
                    <option value="">Sin locación</option>
                    {locacionesFiltradas.map((locacion) => (
                      <option key={locacion.id} value={locacion.id}>
                        {locacion.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel>Área</FieldLabel>
                  <select
                    value={form.area_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, area_id: e.target.value }))}
                    className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                  >
                    <option value="">Sin área</option>
                    {areasFiltradas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel>Empleado</FieldLabel>
                  <select
                    value={form.empleado_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, empleado_id: e.target.value }))}
                    className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                  >
                    <option value="">Sin empleado</option>
                    {empleados.map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel>Asignado a</FieldLabel>
                  <select
                    value={form.asignado_a_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, asignado_a_id: e.target.value }))}
                    className="border border-[#0A2A47] px-3 py-2 rounded-md w-full text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
                  >
                    <option value="">Sin asignar</option>
                    {asignables.map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nombre} ({usuario.rol})
                      </option>
                    ))}
                  </select>
                </div>

                { /*<div className="md:col-span-2">
                  <FieldLabel>Evidencia inicial</FieldLabel>
                  <input
                    type="text"
                    value={form.evidencia_inicial}
                    onChange={(e) => setForm((prev) => ({ ...prev, evidencia_inicial: e.target.value }))}
                    placeholder="URL o referencia de evidencia inicial"
                    className="border border-[#0A2A47] px-3 py-2 rounded-md w-full text-[#0A2A47] placeholder:text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
                  />
                </div>*/}
              </div>

              <div className="flex flex-col md:flex-row gap-2 mt-5">
                <button
                  type="button"
                  onClick={handleGuardarIncidente}
                  disabled={creandoIncidente}
                  className="bg-[#071f35] text-white px-4 py-3 rounded-2xl font-semibold shadow-lg shadow-[#071f35]/10 hover:bg-[#123b63] transition disabled:opacity-60"
                >
                  {creandoIncidente
                    ? "Guardando..."
                    : "Crear incidente"}
                </button>
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  className="border border-[#dbe8f2] text-[#0A2A47] px-4 py-3 rounded-2xl font-semibold hover:border-[#0A2A47] hover:bg-[#f8fbfd] transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

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

              <p className="text-sm text-gray-500 mb-3">
                {incidenteResolviendo?.descripcion || "Agrega evidencia de resolución si aplica."}
              </p>

              <FieldLabel>Comentario de resolución</FieldLabel>
              <textarea
                value={resolverForm.evidencia_resolucion}
                onChange={(e) => setResolverForm((prev) => ({ ...prev, evidencia_resolucion: e.target.value }))}
                rows={4}
                placeholder="Describe cómo se resolvió el incidente"
                className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-[#0A2A47] placeholder:text-[#8a99a8] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
              />

              <div className="mt-4">
                <FieldLabel>Foto de resolución</FieldLabel>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoResolucionChange}
                  className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-[#0A2A47] file:mr-3 file:border-0 file:bg-[#e6f0f8] file:px-3 file:py-1.5 file:rounded-xl file:text-[#0A2A47] file:font-semibold"
                />
              </div>

              {fotoResolucionPreview && (
                <div className="mt-4 rounded-xl border border-[#e6f0f8] bg-[#f8fbfe] p-3">
                  <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-[#0A2A47]">
                    <ImageIcon size={16} />
                    Vista previa
                  </div>
                  <img
                    src={fotoResolucionPreview}
                    alt="Vista previa de resolución"
                    className="w-full max-h-64 object-contain rounded-lg border border-[#e6f0f8] bg-white"
                  />
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-2 mt-5">
                <button
                  type="button"
                  onClick={handleResolverIncidente}
                  disabled={resolviendoIncidente}
                  className="bg-[#071f35] text-white px-4 py-3 rounded-2xl font-semibold shadow-lg shadow-[#071f35]/10 hover:bg-[#123b63] transition disabled:opacity-60"
                >
                  {resolviendoIncidente ? "Resolviendo..." : "Resolver incidente"}
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

        {modalVerResolucionOpen && incidenteViendoResolucion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm px-4">
            <div className="w-full max-w-xl rounded-[28px] bg-white border border-[#e6f0f8] shadow-2xl p-5 md:p-6">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#e6f0f8]">
                <h2 className="text-2xl font-extrabold tracking-tight text-[#0A2A47]">Ver resolución</h2>
                <button
                  type="button"
                  onClick={cerrarVerResolucion}
                  className="w-9 h-9 rounded-xl bg-[#f4f8fb] text-[#0A2A47] hover:bg-[#e6f0f8] font-bold transition"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Estado</FieldLabel>
                  <div className="rounded-md border border-[#e6f0f8] bg-[#f8fbfe] px-3 py-2">
                    <EstadoBadge estado={incidenteViendoResolucion.estado} />
                  </div>
                </div>

                <div>
                  <FieldLabel>Fecha de resolución</FieldLabel>
                  <div className="rounded-md border border-[#e6f0f8] bg-[#f8fbfe] px-3 py-2 text-[#0A2A47] font-medium">
                    {formatFecha(incidenteViendoResolucion.resuelto_en)}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <FieldLabel>Comentario de resolución</FieldLabel>
                  <div className="rounded-md border border-[#e6f0f8] bg-[#f8fbfe] px-3 py-3 text-[#0A2A47] whitespace-pre-wrap break-words min-h-[96px]">
                    {incidenteViendoResolucion.evidencia_resolucion?.trim() || "Sin comentario de resolución"}
                  </div>
                </div>

                {incidenteViendoResolucion.foto_resolucion && (
                  <div className="md:col-span-2">
                    <FieldLabel>Foto de resolución</FieldLabel>
                    <div className="rounded-md border border-[#e6f0f8] bg-[#f8fbfe] p-3">
                      <img
                        src={incidenteViendoResolucion.foto_resolucion}
                        alt="Foto de resolución"
                        className="w-full max-h-80 object-contain rounded-lg border border-[#e6f0f8] bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex mt-5">
                <button
                  type="button"
                  onClick={cerrarVerResolucion}
                    className="border border-[#dbe8f2] text-[#0A2A47] px-4 py-3 rounded-2xl font-semibold hover:border-[#0A2A47] hover:bg-[#f8fbfd] transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmacion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm px-4">
            <div className="w-full max-w-md rounded-[28px] bg-white border border-[#e6f0f8] shadow-2xl p-5 md:p-6">
              <h3 className="text-2xl font-extrabold tracking-tight text-[#0A2A47]">{confirmacion.titulo}</h3>
              <p className="text-sm text-gray-500 mt-2">{confirmacion.descripcion}</p>

              <div className="flex flex-col md:flex-row gap-2 mt-5">
                <button
                  type="button"
                  onClick={confirmacion.onConfirm}
                  disabled={ejecutandoConfirmacion}
                  className={`px-4 py-2 rounded font-semibold shadow-sm disabled:opacity-60 ${
                    confirmacion.danger
                      ? "bg-red-600 text-white hover:bg-red-700 rounded-2xl py-3"
                      : "bg-[#071f35] text-white hover:bg-[#123b63] rounded-2xl py-3"
                  }`}
                >
                  {ejecutandoConfirmacion ? "Procesando..." : confirmacion.confirmText}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmacion(null)}
                  className="border border-[#dbe8f2] text-[#0A2A47] px-4 py-3 rounded-2xl font-semibold hover:border-[#0A2A47] hover:bg-[#f8fbfd] transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

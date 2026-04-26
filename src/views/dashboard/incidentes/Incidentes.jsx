import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, ImageIcon, MapPin, MessageSquareText, Pencil, Plus, ScanSearch, Search, ShieldAlert, Trash2, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate, useSearchParams } from "react-router-dom";

import Layout from "../../../components/Layout";
import {
  useCerrarIncidenteMutation,
  useCrearIncidenteMutation,
  useEditarIncidenteMutation,
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

function TarjetaResumen({ titulo, valor, icono, principal = false }) {
  if (principal) {
    return (
      <div className="bg-[#0A2A47] text-white rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <span className="text-sm opacity-80">{titulo}</span>
        <div className="flex items-center justify-between mt-2">
          <span className="text-3xl font-bold">{valor}</span>
          <div className="text-[#3BAE3D]">{icono}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e6f0f8] rounded-xl p-3 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-500">{titulo}</p>
        <div className="text-[#0A2A47]">{icono}</div>
      </div>
      <p className="text-2xl font-bold text-[#0A2A47]">{valor}</p>
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: incidentes = [], isLoading, isFetching, isError } = useObtenerIncidentesQuery();
  const { data: empresas = [] } = useObtenerEmpresasQuery();
  const { data: locaciones = [] } = useObtenerLocacionesQuery();
  const { data: areas = [] } = useObtenerAreasUsuarioQuery();
  const { data: usuarios = [] } = useObtenerUsuariosQuery();

  const [crearIncidente, { isLoading: creandoIncidente }] = useCrearIncidenteMutation();
  const [editarIncidente, { isLoading: editandoIncidente }] = useEditarIncidenteMutation();
  const [resolverIncidente, { isLoading: resolviendoIncidente }] = useResolverIncidenteMutation();
  const [cerrarIncidente, { isLoading: cerrandoIncidente }] = useCerrarIncidenteMutation();
  const [eliminarIncidente, { isLoading: eliminandoIncidente }] = useEliminarIncidenteMutation();

  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [modalFormularioOpen, setModalFormularioOpen] = useState(false);
  const [modalResolverOpen, setModalResolverOpen] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);
  const [incidenteEditando, setIncidenteEditando] = useState(null);
  const [incidenteResolviendo, setIncidenteResolviendo] = useState(null);
  const [incidenteViendoResolucion, setIncidenteViendoResolucion] = useState(null);
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
    () => usuarios.filter((usuario) => usuario.rol === "admin" || usuario.rol === "supervisor"),
    [usuarios]
  );

  const asignables = useMemo(
    () => usuarios.filter((usuario) => ["admin", "supervisor", "empleado"].includes(usuario.rol)),
    [usuarios]
  );

  const locacionesFiltradas = useMemo(() => {
    if (!form.empresa_id) return locaciones;
    return locaciones.filter((locacion) => locacion.empresa_id === form.empresa_id);
  }, [form.empresa_id, locaciones]);

  const areasFiltradas = useMemo(() => {
    if (!form.locacion_id) return areas;
    return areas.filter((area) => area.locacion_id === form.locacion_id);
  }, [form.locacion_id, areas]);

  const incidentesFiltrados = useMemo(() => {
    return incidentes
      .filter((incidente) => (filtroEstado ? incidente.estado === filtroEstado : true))
      .filter((incidente) => (filtroPrioridad ? incidente.prioridad === filtroPrioridad : true))
      .filter((incidente) => (filtroTipo ? incidente.tipo === filtroTipo : true))
      .filter((incidente) => {
        if (!busqueda.trim()) return true;
        const texto = busqueda.trim().toLowerCase();
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
          empleadoNombre,
          supervisorNombre,
          asignadoNombre,
        ]
          .filter(Boolean)
          .some((valor) => valor.toLowerCase().includes(texto));
      })
      .sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));
  }, [busqueda, empresasMap, filtroEstado, filtroPrioridad, filtroTipo, incidentes, usuariosMap]);

  const resumen = useMemo(() => {
    return {
      total: incidentes.length,
      abiertos: incidentes.filter((item) => item.estado === "abierto").length,
      enCurso: incidentes.filter((item) => item.estado === "asignado" || item.estado === "en_proceso").length,
      resueltos: incidentes.filter((item) => item.estado === "resuelto" || item.estado === "cerrado").length,
    };
  }, [incidentes]);

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
    const deepLinkValue = feedbackDeepLinkId || actividadDeepLinkId;
    if (!deepLinkValue || isLoading) return;

    const incidenteObjetivo = incidentesFiltrados.find((incidente) => {
      if (feedbackDeepLinkId) return incidente.feedback_id === feedbackDeepLinkId;
      return incidente.actividad_usuario_id === actividadDeepLinkId;
    });

    if (incidenteObjetivo) {
      if (deepLinkHandledRef.current === deepLinkValue) return;
      deepLinkHandledRef.current = deepLinkValue;
      deepLinkMissingRef.current = null;

      setHighlightedIncidenteId(incidenteObjetivo.id);

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
  }, [actividadDeepLinkId, feedbackDeepLinkId, incidentesFiltrados, isLoading]);

  const abrirCrear = () => {
    setIncidenteEditando(null);
    setForm(FORM_INICIAL);
    setModalFormularioOpen(true);
  };

  const abrirEditar = (incidente) => {
    setIncidenteEditando(incidente);
    setForm({
      tipo: incidente.tipo || "manual",
      prioridad: incidente.prioridad || "media",
      descripcion: incidente.descripcion || "",
      empresa_id: incidente.empresa_id || "",
      locacion_id: incidente.locacion_id || "",
      area_id: incidente.area_id || "",
      empleado_id: incidente.empleado_id || "",
      supervisor_id: incidente.supervisor_id || "",
      asignado_a_id: incidente.asignado_a_id || "",
      evidencia_inicial: incidente.evidencia_inicial || "",
    });
    setModalFormularioOpen(true);
  };

  const cerrarFormulario = () => {
    setModalFormularioOpen(false);
    setIncidenteEditando(null);
    setForm(FORM_INICIAL);
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
    if (!form.descripcion.trim()) {
      toast.error("La descripción es obligatoria");
      return;
    }

    try {
      const payload = limpiarPayload(form);

      if (incidenteEditando) {
        await editarIncidente({
          incidente_id: incidenteEditando.id,
          datos: payload,
        }).unwrap();
        toast.success("Incidente actualizado");
      } else {
        await crearIncidente(payload).unwrap();
        toast.success("Incidente creado");
      }

      cerrarFormulario();
    } catch (error) {
      toast.error(error?.data?.detail || "No se pudo guardar el incidente");
    }
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
      toast.success("Incidente resuelto");
      cerrarResolver();
    } catch (error) {
      toast.error(error?.data?.detail || "No se pudo resolver el incidente");
    }
  };

  const confirmarCerrar = (incidente) => {
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

  return (
    <Layout>
      <div className="p-4">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h1 className="text-3xl font-extrabold text-[#0A2A47]">Incidentes</h1>
          <button
            onClick={abrirCrear}
            className="flex items-center gap-2 bg-[#0A2A47] text-white px-4 py-2 rounded-md font-semibold shadow-sm hover:bg-[#123b63]"
          >
            <Plus size={16} />
            Crear incidente
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <TarjetaResumen titulo="Total incidentes" valor={isLoading || isFetching ? "..." : resumen.total} icono={<ShieldAlert />} principal />
          <TarjetaResumen titulo="Abiertos" valor={isLoading || isFetching ? "..." : resumen.abiertos} icono={<AlertTriangle size={16} />} />
          <TarjetaResumen titulo="Asignados / en proceso" valor={isLoading || isFetching ? "..." : resumen.enCurso} icono={<XCircle size={16} />} />
          <TarjetaResumen titulo="Resueltos / cerrados" valor={isLoading || isFetching ? "..." : resumen.resueltos} icono={<CheckCircle2 size={16} />} />
        </div>

        <div className="bg-white border border-[#e6f0f8] rounded-xl p-4 mb-4 flex flex-col md:flex-row gap-3 items-center shadow-sm">
          <div className="flex items-center gap-2 w-full md:w-[32%]">
            <Search className="text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Buscar por descripción o contexto"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="border border-[#0A2A47] px-3 py-2 rounded-md w-full text-[#0A2A47] placeholder:text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
            />
          </div>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border border-[#0A2A47] px-3 py-2 rounded-md w-full md:w-[22%] text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
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
            className="border border-[#0A2A47] px-3 py-2 rounded-md w-full md:w-[22%] text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
          >
            <option value="">Todas las prioridades</option>
            {PRIORIDADES_INCIDENTE.map((prioridad) => (
              <option key={prioridad.value} value={prioridad.value}>
                {prioridad.label}
              </option>
            ))}
          </select>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="border border-[#0A2A47] px-3 py-2 rounded-md w-full md:w-[24%] text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
          >
            <option value="">Todos los tipos</option>
            {TIPOS_INCIDENTE.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
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
            title={incidentes.length === 0 ? "Todavía no hay incidentes" : "No hay resultados para esos filtros"}
            description={
              incidentes.length === 0
                ? "Crea el primer incidente manual para empezar a gestionar desvíos operativos."
                : "Prueba cambiando estado, prioridad, tipo o el texto de búsqueda."
            }
          />
        ) : (
          <div className="max-h-[60vh] overflow-auto rounded-xl border border-[#e6f0f8] bg-white shadow-sm">
            <table className="w-full text-left text-[#0A2A47]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-white text-[#0A2A47] border-b border-[#e6f0f8] text-sm">
                  <th className="py-2 px-3">Tipo</th>
                  <th className="py-2 px-3">Prioridad</th>
                  <th className="py-2 px-3">Estado</th>
                  <th className="py-2 px-3">Descripción</th>
                  <th className="py-2 px-3">Empleado</th>
                  <th className="py-2 px-3">Supervisor</th>
                  <th className="py-2 px-3">Asignado a</th>
                  <th className="py-2 px-3">Origen</th>
                  <th className="py-2 px-3">Creado</th>
                  <th className="py-2 px-3 text-center">Acciones</th>
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
                    className={`transition-colors border-b border-[#e6f0f8] hover:bg-[#e6f0f8] align-top ${
                      highlightedIncidenteId === incidente.id ? "bg-[#eef6ff] border-l-4 border-l-[#0A2A47]" : ""
                    }`}
                  >
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <TipoBadge tipo={incidente.tipo} />
                        {sourceMeta.url ? (
                          <span className="text-[11px] font-medium text-gray-500">{sourceMeta.hint}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <PrioridadBadge prioridad={incidente.prioridad} />
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <EstadoBadge estado={incidente.estado} />
                    </td>
                    <td className="py-3 px-3 min-w-[260px]">
                      <p className="font-medium">{incidente.descripcion}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {empresasMap[incidente.empresa_id]?.nombre || "Sin empresa"}
                        {" · "}
                        {locacionesMap[incidente.locacion_id]?.nombre || "Sin locación"}
                        {" · "}
                        {areasMap[incidente.area_id]?.nombre || "Sin área"}
                      </p>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">{usuariosMap[incidente.empleado_id]?.nombre || "-"}</td>
                    <td className="py-3 px-3 whitespace-nowrap">{usuariosMap[incidente.supervisor_id]?.nombre || "-"}</td>
                    <td className="py-3 px-3 whitespace-nowrap">{usuariosMap[incidente.asignado_a_id]?.nombre || "-"}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {sourceMeta.url ? (
                          <button
                            onClick={() => navigate(sourceMeta.url)}
                            className="text-[#0A2A47] font-semibold hover:text-[#123b63] hover:underline text-left"
                          >
                            {sourceMeta.label}
                          </button>
                        ) : (
                          <span className="text-gray-500 font-medium">{sourceMeta.label}</span>
                        )}
                        <span className="text-[11px] text-gray-500">{sourceMeta.hint}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">{formatFecha(incidente.creado_en)}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <button
                          onClick={() => abrirEditar(incidente)}
                          className="rounded-full p-1 text-[#0A2A47] hover:bg-[#d6e6f5]"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => abrirResolver(incidente)}
                          className="rounded-full p-1 text-emerald-600 hover:bg-emerald-50"
                          title="Resolver"
                          disabled={incidente.estado === "cerrado"}
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        {(incidente.estado === "resuelto" || incidente.estado === "cerrado") && (
                          <button
                            onClick={() => abrirVerResolucion(incidente)}
                            className="rounded-full p-1 text-blue-600 hover:bg-blue-50"
                            title="Ver resolución"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => confirmarCerrar(incidente)}
                          className="rounded-full p-1 text-amber-600 hover:bg-amber-50 disabled:opacity-40"
                          title="Cerrar"
                          disabled={incidente.estado !== "resuelto"}
                        >
                          <ShieldAlert size={16} />
                        </button>
                        <button
                          onClick={() => confirmarEliminar(incidente)}
                          className="rounded-full p-1 text-red-500 hover:bg-red-50"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
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

        {modalFormularioOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-xl bg-white border border-[#0A2A47] shadow-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#0A2A47]">
                  {incidenteEditando ? "Editar incidente" : "Crear incidente"}
                </h2>
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  className="text-[#0A2A47] hover:bg-[#e6f0f8] rounded-full px-2 py-1 font-bold"
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
                    className="border border-[#0A2A47] px-3 py-2 rounded-md w-full text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
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
                    className="border border-[#0A2A47] px-3 py-2 rounded-md w-full text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
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
                    className="border border-[#0A2A47] px-3 py-2 rounded-md w-full text-[#0A2A47] placeholder:text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
                  />
                </div>

                <div>
                  <FieldLabel>Empresa</FieldLabel>
                  <select
                    value={form.empresa_id}
                    onChange={(e) => handleEmpresaChange(e.target.value)}
                    className="border border-[#0A2A47] px-3 py-2 rounded-md w-full text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
                  >
                    <option value="">Sin empresa</option>
                    {empresas.map((empresa) => (
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
                    className="border border-[#0A2A47] px-3 py-2 rounded-md w-full text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
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
                    className="border border-[#0A2A47] px-3 py-2 rounded-md w-full text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
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
                    className="border border-[#0A2A47] px-3 py-2 rounded-md w-full text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
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
                  <FieldLabel>Supervisor</FieldLabel>
                  <select
                    value={form.supervisor_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, supervisor_id: e.target.value }))}
                    className="border border-[#0A2A47] px-3 py-2 rounded-md w-full text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
                  >
                    <option value="">Sin supervisor</option>
                    {supervisores.map((usuario) => (
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
                  disabled={creandoIncidente || editandoIncidente}
                  className="bg-[#0A2A47] text-white px-4 py-2 rounded font-semibold shadow-sm hover:bg-[#123b63] disabled:opacity-60"
                >
                  {creandoIncidente || editandoIncidente
                    ? "Guardando..."
                    : incidenteEditando
                      ? "Actualizar incidente"
                      : "Crear incidente"}
                </button>
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  className="border border-[#0A2A47] text-[#0A2A47] px-4 py-2 rounded font-semibold hover:bg-[#e6f0f8]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {modalResolverOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-xl rounded-xl bg-white border border-[#0A2A47] shadow-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#0A2A47]">Resolver incidente</h2>
                <button
                  type="button"
                  onClick={cerrarResolver}
                  className="text-[#0A2A47] hover:bg-[#e6f0f8] rounded-full px-2 py-1 font-bold"
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
                className="border border-[#0A2A47] px-3 py-2 rounded-md w-full text-[#0A2A47] placeholder:text-[#0A2A47] focus:outline-none focus:ring-1 focus:ring-[#0A2A47]"
              />

              <div className="mt-4">
                <FieldLabel>Foto de resolución</FieldLabel>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoResolucionChange}
                  className="border border-[#0A2A47] px-3 py-2 rounded-md w-full text-[#0A2A47] file:mr-3 file:border-0 file:bg-[#e6f0f8] file:px-3 file:py-1 file:rounded file:text-[#0A2A47] file:font-semibold"
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
                  className="bg-[#0A2A47] text-white px-4 py-2 rounded font-semibold shadow-sm hover:bg-[#123b63] disabled:opacity-60"
                >
                  {resolviendoIncidente ? "Resolviendo..." : "Resolver incidente"}
                </button>
                <button
                  type="button"
                  onClick={cerrarResolver}
                  className="border border-[#0A2A47] text-[#0A2A47] px-4 py-2 rounded font-semibold hover:bg-[#e6f0f8]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {modalVerResolucionOpen && incidenteViendoResolucion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-xl rounded-xl bg-white border border-[#0A2A47] shadow-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#0A2A47]">Ver resolución</h2>
                <button
                  type="button"
                  onClick={cerrarVerResolucion}
                  className="text-[#0A2A47] hover:bg-[#e6f0f8] rounded-full px-2 py-1 font-bold"
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
                  className="border border-[#0A2A47] text-[#0A2A47] px-4 py-2 rounded font-semibold hover:bg-[#e6f0f8]"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmacion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-xl bg-white border border-[#0A2A47] shadow-xl p-5">
              <h3 className="text-xl font-bold text-[#0A2A47]">{confirmacion.titulo}</h3>
              <p className="text-sm text-gray-500 mt-2">{confirmacion.descripcion}</p>

              <div className="flex flex-col md:flex-row gap-2 mt-5">
                <button
                  type="button"
                  onClick={confirmacion.onConfirm}
                  disabled={ejecutandoConfirmacion}
                  className={`px-4 py-2 rounded font-semibold shadow-sm disabled:opacity-60 ${
                    confirmacion.danger
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-[#0A2A47] text-white hover:bg-[#123b63]"
                  }`}
                >
                  {ejecutandoConfirmacion ? "Procesando..." : confirmacion.confirmText}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmacion(null)}
                  className="border border-[#0A2A47] text-[#0A2A47] px-4 py-2 rounded font-semibold hover:bg-[#e6f0f8]"
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

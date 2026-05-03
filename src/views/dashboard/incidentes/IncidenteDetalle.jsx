import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  ImageIcon,
  MessageSquareText,
  ShieldAlert,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
  useComentarIncidenteMutation,
  useEditarIncidenteMutation,
  useObtenerTimelineIncidenteQuery,
} from "../../../redux/api/incidentesApi";

function EmptyState({ title, description }) {
  return (
    <div className="rounded-xl border border-dashed border-[#cddff0] bg-[#f8fbfe] px-4 py-10 text-center">
      <p className="text-base font-semibold text-[#0A2A47]">{title}</p>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  );
}

function DetailField({ label, children, full = false }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">{label}</p>
      <div className="mt-2 rounded-2xl border border-[#e6f0f8] bg-[#f8fbfe] px-4 py-3 text-sm text-[#0A2A47] min-h-[52px] flex items-center">
        {children}
      </div>
    </div>
  );
}

function humanizeFieldName(field) {
  const labels = {
    estado: "Estado",
    prioridad: "Prioridad",
    asignado_a_id: "Responsable",
    descripcion: "Descripción",
    tipo: "Tipo",
    empresa_id: "Empresa",
    locacion_id: "Locación",
    area_id: "Área",
    empleado_id: "Empleado",
    supervisor_id: "Supervisor",
    actividad_usuario_id: "Actividad",
    feedback_id: "Feedback",
    evidencia_inicial: "Evidencia inicial",
    evidencia_resolucion: "Evidencia de resolución",
  };

  return labels[field] || field.replaceAll("_", " ");
}

function formatTimelineEvent(evento) {
  const metadata = evento?.metadata || evento?.metadata_json || {};
  const cambios = metadata?.cambios || {};
  const diff = [];
  const bodyParts = [];

  if (metadata?.estado_anterior || metadata?.estado_nuevo) {
    diff.push({
      field: "estado",
      label: "Estado",
      from: metadata.estado_anterior || "Sin estado",
      to: metadata.estado_nuevo || "Sin estado",
    });
  }

  Object.entries(cambios).forEach(([field, value]) => {
    if (!value || (value.anterior == null && value.nuevo == null)) return;
    diff.push({
      field,
      label: humanizeFieldName(field),
      from: value.anterior ?? "Vacío",
      to: value.nuevo ?? "Vacío",
    });
  });

  switch (evento?.tipo_evento) {
    case "comentario":
      return {
        title: "Comentario",
        tone: "border-blue-200 bg-blue-50/70 text-blue-700",
        cardTone: "border-blue-100 bg-gradient-to-br from-white to-blue-50/70",
        icon: MessageSquareText,
        body: evento?.mensaje || null,
        diff: [],
      };
    case "resuelto":
      if (metadata?.evidencia_resolucion && metadata.evidencia_resolucion !== evento?.mensaje) {
        bodyParts.push(metadata.evidencia_resolucion);
      }
      return {
        title: "Incidente resuelto",
        tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
        cardTone: "border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white",
        icon: CheckCircle2,
        body: evento?.mensaje || bodyParts[0] || "La resolución del incidente quedó registrada.",
        diff,
      };
    case "cerrado":
      return {
        title: "Ticket cerrado",
        tone: "border-slate-200 bg-slate-100 text-slate-700",
        cardTone: "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
        icon: ShieldAlert,
        body: evento?.mensaje || "El ticket quedó cerrado para seguimiento operativo.",
        diff,
      };
    case "estado_cambiado":
      return {
        title: "Estado actualizado",
        tone: "border-amber-200 bg-amber-50 text-amber-700",
        cardTone: "border-amber-100 bg-gradient-to-br from-white to-amber-50/70",
        icon: XCircle,
        body: evento?.mensaje || "Se actualizó el estado del ticket.",
        diff,
      };
    case "asignacion_cambiada":
      return {
        title: "Responsable actualizado",
        tone: "border-indigo-200 bg-indigo-50 text-indigo-700",
        cardTone: "border-indigo-100 bg-gradient-to-br from-white to-indigo-50/70",
        icon: ShieldAlert,
        body: evento?.mensaje || "Se actualizó el responsable del ticket.",
        diff,
      };
    case "actualizado":
      return {
        title: "Ticket actualizado",
        tone: "border-[#dbe8f2] bg-[#f8fbfd] text-[#0A2A47]",
        cardTone: "border-[#e6f0f8] bg-gradient-to-br from-white to-[#f8fbfd]",
        icon: ShieldAlert,
        body: evento?.mensaje || "Se registraron cambios internos en el ticket.",
        diff,
      };
    case "creado":
    default:
      return {
        title: "Incidente creado",
        tone: "border-[#dbe8f2] bg-[#f8fbfd] text-[#0A2A47]",
        cardTone: "border-[#e6f0f8] bg-gradient-to-br from-white to-[#f8fbfd]",
        icon: ShieldAlert,
        body: evento?.mensaje || "Inicio del ticket y apertura del seguimiento operativo.",
        diff,
      };
  }
}

export default function IncidenteDetalle({
  open,
  incidente,
  onClose,
  canEdit,
  canMarkInProgress,
  canResolve,
  canClose,
  canDelete,
  empresasMap,
  locacionesMap,
  areasMap,
  usuariosMap,
  asignables,
  sourceMeta,
  onNavigateToSource,
  onMarkInProgress,
  onResolver,
  onCerrar,
  onEliminar,
  onVerResolucion,
  formatFecha,
  TipoBadge,
  PrioridadBadge,
  EstadoBadge,
  tiposIncidente,
  estadosIncidente,
  prioridadesIncidente,
}) {
  const ANIMATION_DURATION_MS = 300;
  const {
    data: timelineData,
    isLoading: isTimelineLoading,
    isFetching: isTimelineFetching,
    isError: isTimelineError,
  } = useObtenerTimelineIncidenteQuery(
    {
      incidente_id: incidente?.id,
      limit: 20,
      offset: 0,
    },
    {
      skip: !open || !incidente?.id,
    }
  );

  const [comentarIncidente, { isLoading: enviandoComentario }] = useComentarIncidenteMutation();
  const [editarIncidente, { isLoading: guardandoGestion }] = useEditarIncidenteMutation();
  const [comentarioMensaje, setComentarioMensaje] = useState("");
  const [comentarioFoto, setComentarioFoto] = useState(null);
  const [comentarioFotoPreview, setComentarioFotoPreview] = useState(null);
  const [shouldRender, setShouldRender] = useState(open && Boolean(incidente));
  const [isVisible, setIsVisible] = useState(false);
  const [gestionForm, setGestionForm] = useState({
    tipo: "",
    descripcion: "",
    asignado_a_id: "",
    estado: "",
    prioridad: "",
  });

  const timelineItems = timelineData?.items ?? [];
  const comentarioDisabled = comentarioMensaje.trim() === "" && !comentarioFoto;
  const encargadoActual = incidente?.asignado_a_id ? usuariosMap[incidente.asignado_a_id] : null;
  const supervisorActual = incidente?.supervisor_id ? usuariosMap[incidente.supervisor_id] : null;
  const empleadoActual = incidente?.empleado_id ? usuariosMap[incidente.empleado_id] : null;
  const isClosed = incidente?.estado === "cerrado";
  const estadosGestionInline = estadosIncidente.filter(
    (estado) => !["resuelto", "cerrado"].includes(estado.value)
  );
  const hayCambiosGestion = (
    (gestionForm.tipo || "") !== (incidente?.tipo || "")
    || (gestionForm.descripcion || "") !== (incidente?.descripcion || "")
    || (gestionForm.asignado_a_id || "") !== (incidente?.asignado_a_id || "")
    || (gestionForm.estado || "") !== (incidente?.estado || "")
    || (gestionForm.prioridad || "") !== (incidente?.prioridad || "")
  );

  const resolveDiffValue = (field, value) => {
    if (value == null) return "Vacío";

    const normalizedValue = String(value);

    if (field === "asignado_a_id" || field === "supervisor_id" || field === "empleado_id") {
      return usuariosMap[normalizedValue]?.nombre || normalizedValue;
    }

    if (field === "empresa_id") {
      return empresasMap[normalizedValue]?.nombre || normalizedValue;
    }

    if (field === "locacion_id") {
      return locacionesMap[normalizedValue]?.nombre || normalizedValue;
    }

    if (field === "area_id") {
      return areasMap[normalizedValue]?.nombre || normalizedValue;
    }

    return normalizedValue;
  };

  useEffect(() => {
    let timeoutId;
    if (open && incidente) {
      setShouldRender(true);
      timeoutId = window.setTimeout(() => {
        setIsVisible(true);
      }, 16);
    } else if (shouldRender) {
      setIsVisible(false);
      timeoutId = window.setTimeout(() => {
        setShouldRender(false);
      }, ANIMATION_DURATION_MS);
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [ANIMATION_DURATION_MS, incidente, open, shouldRender]);

  useEffect(() => {
    if (!open) {
      setComentarioMensaje("");
      setComentarioFoto(null);
      if (comentarioFotoPreview) {
        URL.revokeObjectURL(comentarioFotoPreview);
      }
      setComentarioFotoPreview(null);
    }
  }, [comentarioFotoPreview, open]);

  useEffect(() => {
    if (!incidente) return;
    setGestionForm({
      tipo: incidente.tipo || "",
      descripcion: incidente.descripcion || "",
      asignado_a_id: incidente.asignado_a_id || "",
      estado: incidente.estado || "",
      prioridad: incidente.prioridad || "",
    });
  }, [incidente]);

  useEffect(() => {
    if (!shouldRender) return undefined;

    const previousOverflow = document.body.style.overflow;
    if (open) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, shouldRender]);

  if (!shouldRender || !incidente) return null;

  const handleComentarioFotoChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (comentarioFotoPreview) {
      URL.revokeObjectURL(comentarioFotoPreview);
    }

    setComentarioFoto(file);
    setComentarioFotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const limpiarComentarioForm = () => {
    setComentarioMensaje("");
    setComentarioFoto(null);
    if (comentarioFotoPreview) {
      URL.revokeObjectURL(comentarioFotoPreview);
    }
    setComentarioFotoPreview(null);
  };

  const handleEnviarComentario = async () => {
    if (comentarioDisabled) return;

    try {
      await comentarIncidente({
        incidente_id: incidente.id,
        datos: {
          mensaje: comentarioMensaje.trim(),
          foto: comentarioFoto,
        },
      }).unwrap();
      toast.success("Comentario agregado al ticket");
      limpiarComentarioForm();
    } catch (error) {
      toast.error(error?.data?.detail || "No se pudo agregar el comentario");
    }
  };

  const handleAplicarGestion = async () => {
    if (!canEdit || isClosed || !hayCambiosGestion) return;

    try {
      const datos = {};
      if ((gestionForm.tipo || "") !== (incidente.tipo || "")) {
        datos.tipo = gestionForm.tipo;
      }
      if ((gestionForm.descripcion || "") !== (incidente.descripcion || "")) {
        datos.descripcion = gestionForm.descripcion;
      }
      if ((gestionForm.asignado_a_id || "") !== (incidente.asignado_a_id || "")) {
        datos.asignado_a_id = gestionForm.asignado_a_id || null;
      }
      if ((gestionForm.estado || "") !== (incidente.estado || "")) {
        datos.estado = gestionForm.estado;
      }
      if ((gestionForm.prioridad || "") !== (incidente.prioridad || "")) {
        datos.prioridad = gestionForm.prioridad;
      }

      await editarIncidente({
        incidente_id: incidente.id,
        datos,
      }).unwrap();
      toast.success("Gestión del ticket actualizada");
    } catch (error) {
      toast.error(error?.data?.detail || "No se pudo actualizar el ticket");
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ease-in-out ${
        isVisible ? "bg-black/20 opacity-100 backdrop-blur-sm" : "bg-black/0 opacity-0 backdrop-blur-none"
      }`}
    >
      <div className="flex h-full w-full items-stretch justify-end overflow-hidden">
        <div
          className={`h-full w-full overflow-hidden bg-white shadow-2xl transition-[transform,opacity] duration-300 ease-in-out transform md:w-[80vw] md:max-w-none md:rounded-l-[32px] ${
            isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-[#e6f0f8] bg-white px-4 py-4 md:px-6 md:py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7b8a97]">Ticket de incidente</p>
                  <h2 className="mt-2 text-lg font-extrabold tracking-tight text-[#0A2A47] md:text-lg">
                    {incidente.descripcion}
                  </h2>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <TipoBadge tipo={incidente.tipo} />
                    <EstadoBadge estado={incidente.estado} />
                    <PrioridadBadge prioridad={incidente.prioridad} />
                  </div>
                  <div className="mt-4 rounded-[24px] border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b8a97]">Encargado del ticket</p>
                    {encargadoActual ? (
                      <div className="mt-2">
                        <p className="text-lg font-extrabold text-[#0A2A47]">{encargadoActual.nombre}</p>
                        <p className="text-sm text-[#5b6b79]">
                          {encargadoActual.rol ? `Rol: ${encargadoActual.rol}` : "Responsable asignado"}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
                        <AlertTriangle size={15} />
                        Sin asignar
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] text-[#0A2A47] transition hover:border-[#0A2A47] hover:bg-white"
                  aria-label="Cerrar detalle"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#f4f8fb]">
              <div className="grid grid-cols-1 gap-6 p-4 pb-28 md:grid-cols-[minmax(0,1.5fr)_360px] md:p-6 md:pb-6">
                <div className="space-y-6">
                  <section className="rounded-[28px] border border-[#e6f0f8] bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7b8a97]">Contexto</p>
                        <h3 className="mt-2 text-xl font-extrabold tracking-tight text-[#0A2A47]">Contexto operativo</h3>
                      </div>
                      <div className="inline-flex rounded-full border border-[#dbe8f2] bg-[#f8fbfd] px-3 py-1.5 text-xs font-semibold text-[#5b6b79]">
                        {sourceMeta?.hint || "Seguimiento operativo"}
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <DetailField label="Empresa">
                        {empresasMap[incidente.empresa_id]?.nombre || "Sin empresa"}
                      </DetailField>
                      <DetailField label="Locación">
                        {locacionesMap[incidente.locacion_id]?.nombre || "Sin locación"}
                      </DetailField>
                      <DetailField label="Área">
                        {areasMap[incidente.area_id]?.nombre || "Sin área"}
                      </DetailField>
                      <DetailField label="Supervisor de locación">
                        {supervisorActual ? (
                          <div className="flex flex-col">
                            <span className="font-semibold">{supervisorActual.nombre}</span>
                            <span className="text-xs text-[#5b6b79]">{supervisorActual.rol || "Supervisor"}</span>
                          </div>
                        ) : "Sin supervisor"}
                      </DetailField>
                      <DetailField label="Empleado relacionado">
                        {empleadoActual ? (
                          <div className="flex flex-col">
                            <span className="font-semibold">{empleadoActual.nombre}</span>
                            <span className="text-xs text-[#5b6b79]">{empleadoActual.rol || "Empleado"}</span>
                          </div>
                        ) : "Sin empleado"}
                      </DetailField>
                      <DetailField label="Creado">
                        {formatFecha(incidente.creado_en)}
                      </DetailField>
                      <DetailField label="Actualizado">
                        {formatFecha(incidente.actualizado_en)}
                      </DetailField>
                      <DetailField label="Resuelto">
                        {formatFecha(incidente.resuelto_en)}
                      </DetailField>
                      <DetailField label="Cerrado">
                        {formatFecha(incidente.cerrado_en)}
                      </DetailField>
                      {/*<DetailField label="Evidencia inicial" full>
                        <div className="whitespace-pre-wrap break-words">
                          {incidente.evidencia_inicial?.trim() || "Sin evidencia inicial registrada."}
                        </div>
                      </DetailField>*/}
                      <DetailField label="Evidencia de resolución" full>
                        <div className="whitespace-pre-wrap break-words">
                          {incidente.evidencia_resolucion?.trim() || "Sin evidencia de resolución todavía."}
                        </div>
                      </DetailField>
                    </div>

                    {incidente.foto_resolucion ? (
                      <div className="mt-4 rounded-3xl border border-[#e6f0f8] bg-[#f8fbfe] p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#0A2A47]">
                          <ImageIcon size={16} />
                          Foto de resolución
                        </div>
                        <img
                          src={incidente.foto_resolucion}
                          alt="Foto de resolución"
                          className="mt-3 w-full rounded-2xl border border-[#e6f0f8] bg-white object-contain max-h-80"
                        />
                      </div>
                    ) : null}
                  </section>

                  <section className="rounded-[28px] border border-[#e6f0f8] bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7b8a97]">Timeline</p>
                        <h3 className="mt-2 text-xl font-extrabold tracking-tight text-[#0A2A47]">Historial del ticket</h3>
                      </div>
                      <div className="rounded-full border border-[#dbe8f2] bg-[#f8fbfd] px-3 py-1 text-xs font-semibold text-[#5b6b79]">
                        {timelineData?.total ?? 0} eventos
                      </div>
                    </div>

                    <div className="mt-5 rounded-[28px] border border-[#e6f0f8] bg-[#f8fbfd] p-4">
                      {isClosed ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                          <p className="font-semibold text-[#0A2A47]">Este ticket está cerrado. Ya no se pueden realizar cambios.</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 text-sm font-semibold text-[#0A2A47]">
                            <MessageSquareText size={16} />
                            Agregar comentario interno
                          </div>
                          <p className="mt-1 text-sm text-[#5b6b79]">
                            Deja contexto operativo y, si hace falta, adjunta una foto para respaldar la actualización.
                          </p>

                          <textarea
                            value={comentarioMensaje}
                            onChange={(event) => setComentarioMensaje(event.target.value)}
                            rows={4}
                            placeholder="Escribe un comentario para el ticket"
                            className="mt-4 w-full rounded-2xl border border-[#dbe8f2] bg-white px-4 py-3 text-sm text-[#0A2A47] placeholder:text-[#8a99a8] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                          />

                          <div className="mt-4">
                            <label className="block text-sm font-semibold text-[#0A2A47]">Foto opcional</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleComentarioFotoChange}
                              className="mt-2 w-full rounded-2xl border border-[#dbe8f2] bg-white px-4 py-3 text-sm text-[#0A2A47] file:mr-3 file:rounded-xl file:border-0 file:bg-[#e6f0f8] file:px-3 file:py-1.5 file:font-semibold file:text-[#0A2A47]"
                            />
                          </div>

                          {comentarioFotoPreview ? (
                            <div className="mt-4 rounded-2xl border border-[#e6f0f8] bg-white p-3">
                              <div className="flex items-center gap-2 text-sm font-semibold text-[#0A2A47]">
                                <ImageIcon size={16} />
                                Vista previa
                              </div>
                              <img
                                src={comentarioFotoPreview}
                                alt="Vista previa del comentario"
                                className="mt-3 w-full rounded-2xl border border-[#e6f0f8] bg-[#f8fbfd] object-contain max-h-72"
                              />
                            </div>
                          ) : null}

                          <div className="mt-4 flex flex-col gap-2 md:flex-row">
                            <button
                              type="button"
                              onClick={handleEnviarComentario}
                              disabled={comentarioDisabled || enviandoComentario}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#071f35] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#071f35]/10 transition hover:bg-[#123b63] disabled:opacity-50"
                            >
                              <MessageSquareText size={16} />
                              {enviandoComentario ? "Enviando..." : "Publicar comentario"}
                            </button>
                            <button
                              type="button"
                              onClick={limpiarComentarioForm}
                              disabled={enviandoComentario}
                              className="rounded-2xl border border-[#dbe8f2] px-4 py-3 text-sm font-semibold text-[#0A2A47] transition hover:border-[#0A2A47] hover:bg-white disabled:opacity-50"
                            >
                              Limpiar
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mt-5">
                      {isTimelineLoading || isTimelineFetching ? (
                        <div className="space-y-3">
                          {[0, 1, 2].map((item) => (
                            <div key={item} className="animate-pulse rounded-3xl border border-[#e6f0f8] bg-[#fbfdff] p-4">
                              <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-[#e6eef5]" />
                                <div className="flex-1 space-y-3">
                                  <div className="h-4 w-40 rounded-full bg-[#e6eef5]" />
                                  <div className="h-3 w-64 rounded-full bg-[#edf3f8]" />
                                  <div className="h-3 w-28 rounded-full bg-[#edf3f8]" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : isTimelineError ? (
                        <EmptyState
                          title="No pudimos cargar el timeline"
                          description="Recarga el detalle del ticket para intentar nuevamente."
                        />
                      ) : timelineItems.length === 0 ? (
                        <EmptyState
                          title="Aún no hay movimiento"
                          description="Cuando el ticket reciba cambios, comentarios o actualizaciones, aparecerán aquí."
                        />
                      ) : (
                        <div className="relative space-y-4 before:absolute before:bottom-0 before:left-5 before:top-0 before:w-px before:bg-[#dbe8f2]">
                          {timelineItems.map((evento) => {
                            const meta = formatTimelineEvent(evento);
                            const Icon = meta.icon;

                            return (
                              <div key={evento.id} className={`relative ml-3 rounded-3xl border p-4 shadow-sm ${meta.cardTone}`}>
                                <div className="absolute left-[-14px] top-6 h-3 w-3 rounded-full border-2 border-white bg-[#dbe8f2]" />
                                <div className="flex items-start gap-3">
                                  <div className={`relative z-10 mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl border ${meta.tone}`}>
                                    <Icon size={16} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="font-semibold text-[#0A2A47]">{meta.title}</p>
                                          {evento.tipo_evento === "comentario" ? (
                                            <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                                              Conversación
                                            </span>
                                          ) : null}
                                        </div>
                                        <p className="mt-1 text-sm text-[#5b6b79]">
                                          <span className="font-medium text-[#0A2A47]">{evento.actor?.nombre || "Sistema"}</span>
                                          {" · "}
                                          <span>{evento.actor_rol || evento.actor?.rol || "sin rol"}</span>
                                        </p>
                                      </div>
                                      <p className="shrink-0 text-[11px] font-medium uppercase tracking-[0.18em] text-[#94a3af]">
                                        {formatFecha(evento.creado_en)}
                                      </p>
                                    </div>

                                    {meta.body ? (
                                      <div className={`mt-3 rounded-2xl px-4 py-3 text-sm ${
                                        evento.tipo_evento === "comentario"
                                          ? "border border-blue-100 bg-white text-[#0A2A47]"
                                          : "bg-white/80 text-[#5b6b79] border border-white/70"
                                      }`}>
                                        <p className="whitespace-pre-wrap break-words">{meta.body}</p>
                                      </div>
                                    ) : null}

                                    {meta.diff?.length ? (
                                      <div className="mt-3 space-y-2">
                                        {meta.diff.map((item, index) => (
                                          <div
                                            key={`${evento.id}-${item.label}-${index}`}
                                            className="rounded-2xl border border-[#e6f0f8] bg-white px-3 py-2 text-sm text-[#5b6b79]"
                                          >
                                            <span className="font-semibold text-[#0A2A47]">{item.label}:</span>
                                            {" "}
                                            <span>{resolveDiffValue(item.field, item.from)}</span>
                                            {" "}
                                            <span className="font-semibold text-[#94a3af]">→</span>
                                            {" "}
                                            <span>{resolveDiffValue(item.field, item.to)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : null}

                                    {evento.foto_url ? (
                                      <img
                                        src={evento.foto_url}
                                        alt="Adjunto del evento"
                                        className="mt-3 w-full rounded-2xl border border-[#e6f0f8] bg-white object-contain max-h-72"
                                      />
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                <aside className="space-y-6">
                  <section className="rounded-[28px] border border-[#e6f0f8] bg-[#071f35] p-5 text-white shadow-xl shadow-[#071f35]/10">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Gestión</p>
                    <h3 className="mt-2 text-xl font-extrabold tracking-tight">Gestiona el ticket</h3>
                    <p className="mt-2 text-sm text-white/70">
                      Mantén las acciones operativas dentro del detalle para centralizar contexto y trazabilidad.
                    </p>

                    <div className="mt-5 space-y-4">
                      {canEdit ? (
                        <div className="space-y-4">
                          {isClosed ? (
                            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-sm text-white/85">
                              <p className="font-semibold text-white">Este ticket está cerrado. Ya no se pueden realizar cambios.</p>
                            </div>
                          ) : null}
                          <div>
                            <label className="block text-sm font-semibold text-white">Tipo</label>
                            <select
                              value={gestionForm.tipo}
                              onChange={(event) => setGestionForm((prev) => ({ ...prev, tipo: event.target.value }))}
                              disabled={isClosed}
                              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30 focus:ring-4 focus:ring-white/10"
                            >
                              {tiposIncidente.map((tipo) => (
                                <option key={tipo.value} value={tipo.value} className="text-[#0A2A47]">
                                  {tipo.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-white">Descripción</label>
                            <textarea
                              value={gestionForm.descripcion}
                              onChange={(event) => setGestionForm((prev) => ({ ...prev, descripcion: event.target.value }))}
                              rows={4}
                              placeholder="Describe el incidente y el contexto operativo"
                              disabled={isClosed}
                              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50 outline-none transition focus:border-white/30 focus:ring-4 focus:ring-white/10"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-white">Encargado del ticket</label>
                            <select
                              value={gestionForm.asignado_a_id}
                              onChange={(event) => setGestionForm((prev) => ({ ...prev, asignado_a_id: event.target.value }))}
                              disabled={isClosed}
                              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30 focus:ring-4 focus:ring-white/10"
                            >
                              <option value="" className="text-[#0A2A47]">Sin asignar</option>
                              {asignables.map((usuario) => (
                                <option key={usuario.id} value={usuario.id} className="text-[#0A2A47]">
                                  {usuario.nombre} {usuario.rol ? `(${usuario.rol})` : ""}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                              <label className="block text-sm font-semibold text-white">Estado</label>
                              <select
                                value={gestionForm.estado}
                                onChange={(event) => setGestionForm((prev) => ({ ...prev, estado: event.target.value }))}
                                disabled={isClosed}
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30 focus:ring-4 focus:ring-white/10"
                              >
                                {estadosGestionInline.map((estado) => (
                                  <option key={estado.value} value={estado.value} className="text-[#0A2A47]">
                                    {estado.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-white">Prioridad</label>
                              <select
                                value={gestionForm.prioridad}
                                onChange={(event) => setGestionForm((prev) => ({ ...prev, prioridad: event.target.value }))}
                                disabled={isClosed}
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30 focus:ring-4 focus:ring-white/10"
                              >
                                {prioridadesIncidente.map((prioridad) => (
                                  <option key={prioridad.value} value={prioridad.value} className="text-[#0A2A47]">
                                    {prioridad.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 md:flex-row">
                            <button
                              type="button"
                              onClick={handleAplicarGestion}
                              disabled={isClosed || !hayCambiosGestion || guardandoGestion}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071f35] shadow-lg shadow-black/10 transition hover:bg-[#f4f8fb] disabled:opacity-50"
                            >
                              {guardandoGestion ? "Aplicando..." : "Aplicar cambios"}
                            </button>
                            {!isClosed ? (
                              <button
                                type="button"
                                onClick={() => setGestionForm({
                                  tipo: incidente.tipo || "",
                                  descripcion: incidente.descripcion || "",
                                  asignado_a_id: incidente.asignado_a_id || "",
                                  estado: incidente.estado || "",
                                  prioridad: incidente.prioridad || "",
                                })}
                                disabled={!hayCambiosGestion || guardandoGestion}
                                className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                              >
                                Revertir
                              </button>
                            ) : null}
                          </div>

                          {!isClosed ? (
                          <div className="border-t border-white/10 pt-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Acciones rápidas</p>
                            <div className="mt-3 flex flex-col gap-2 md:flex-row md:flex-wrap">
                              {canMarkInProgress ? (
                                <button
                                  type="button"
                                  onClick={() => onMarkInProgress(incidente)}
                                  disabled={["en_proceso", "resuelto", "cerrado"].includes(incidente.estado)}
                                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-300/30 bg-blue-400/10 px-4 py-3 text-sm font-semibold text-[#d9ecff] transition hover:bg-blue-400/20 disabled:opacity-40"
                                >
                                  <AlertTriangle size={16} />
                                  Marcar en proceso
                                </button>
                              ) : null}
                              {canResolve ? (
                                <button
                                  type="button"
                                  onClick={() => onResolver(incidente)}
                                  disabled={incidente.estado === "cerrado"}
                                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-[#d9ffe0] transition hover:bg-emerald-400/20 disabled:opacity-40"
                                >
                                  <CheckCircle2 size={16} />
                                  Resolver incidente
                                </button>
                              ) : null}
                              {canClose ? (
                                <button
                                  type="button"
                                  onClick={() => onCerrar(incidente)}
                                  disabled={incidente.estado !== "resuelto"}
                                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-[#fff1c2] transition hover:bg-amber-400/20 disabled:opacity-40"
                                >
                                  <ShieldAlert size={16} />
                                  Cerrar ticket
                                </button>
                              ) : null}
                            </div>
                          </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Resumen</p>
                            <div className="mt-3 space-y-3 text-sm text-white">
                              <div>
                                <span className="text-white/60">Tipo:</span> {tiposIncidente.find((item) => item.value === incidente.tipo)?.label || incidente.tipo}
                              </div>
                              <div>
                                <span className="text-white/60">Encargado:</span> {encargadoActual?.nombre || "Sin asignar"}
                              </div>
                              <div>
                                <span className="text-white/60">Estado:</span> {estadosIncidente.find((item) => item.value === incidente.estado)?.label || incidente.estado}
                              </div>
                              <div>
                                <span className="text-white/60">Prioridad:</span> {prioridadesIncidente.find((item) => item.value === incidente.prioridad)?.label || incidente.prioridad}
                              </div>
                            </div>
                          </div>

                          {(canMarkInProgress || canResolve || canClose) ? (
                            <div className="border-t border-white/10 pt-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Acciones rápidas</p>
                              <div className="mt-3 flex flex-col gap-2">
                                {canMarkInProgress ? (
                                  <button
                                    type="button"
                                    onClick={() => onMarkInProgress(incidente)}
                                    disabled={["en_proceso", "resuelto", "cerrado"].includes(incidente.estado)}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-300/30 bg-blue-400/10 px-4 py-3 text-sm font-semibold text-[#d9ecff] transition hover:bg-blue-400/20 disabled:opacity-40"
                                  >
                                    <AlertTriangle size={16} />
                                    Marcar en proceso
                                  </button>
                                ) : null}
                                {canResolve ? (
                                  <button
                                    type="button"
                                    onClick={() => onResolver(incidente)}
                                    disabled={incidente.estado === "cerrado"}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-[#d9ffe0] transition hover:bg-emerald-400/20 disabled:opacity-40"
                                  >
                                    <CheckCircle2 size={16} />
                                    Resolver incidente
                                  </button>
                                ) : null}
                                {canClose ? (
                                  <button
                                    type="button"
                                    onClick={() => onCerrar(incidente)}
                                    disabled={incidente.estado !== "resuelto"}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-[#fff1c2] transition hover:bg-amber-400/20 disabled:opacity-40"
                                  >
                                    <ShieldAlert size={16} />
                                    Cerrar ticket
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}

                      {(incidente.estado === "resuelto" || incidente.estado === "cerrado") ? (
                        <button
                          type="button"
                          onClick={() => onVerResolucion(incidente)}
                          className="mt-4 flex w-full items-center justify-between rounded-2xl border border-blue-300/30 bg-blue-400/10 px-4 py-3 text-left text-sm font-semibold text-[#d9ecff] transition hover:bg-blue-400/20"
                        >
                          <span>Ver resolución</span>
                          <Eye size={16} />
                        </button>
                      ) : null}

                      <div className="mt-4 border-t border-white/10 pt-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Origen del incidente</p>
                        <div className="mt-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-4">
                          <p className="text-sm font-semibold text-white">{sourceMeta?.label || "Manual"}</p>
                          <p className="mt-1 text-sm text-white/70">
                            {sourceMeta?.hint || "Sin contexto de origen adicional."}
                          </p>
                          {sourceMeta?.url ? (
                            <button
                              type="button"
                              onClick={onNavigateToSource}
                              className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/15"
                            >
                              <Eye size={14} />
                              Ver origen
                            </button>
                          ) : (
                            <span className="mt-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-white/50">
                              Sin origen navegable
                            </span>
                          )}
                        </div>
                      </div>

                      {canDelete && !isClosed ? (
                        <button
                          type="button"
                          onClick={() => onEliminar(incidente)}
                          className="mt-4 flex w-full items-center justify-between rounded-2xl border border-red-300/30 bg-red-400/10 px-4 py-3 text-left text-sm font-semibold text-[#ffd9d9] transition hover:bg-red-400/20"
                        >
                          <span>Eliminar incidente</span>
                          <Trash2 size={16} />
                        </button>
                      ) : null}
                    </div>
                  </section>
                </aside>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

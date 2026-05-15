import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck, CircleAlert, Loader2, MessageSquareMore, ShieldAlert, TriangleAlert, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

import {
  useMarcarNotificacionLeidaMutation,
  useMarcarTodasLeidasMutation,
  useObtenerNotificacionesQuery,
  useObtenerUnreadCountQuery,
} from "../redux/api/notificacionesApi";

function formatFecha(fecha) {
  if (!fecha) return "";
  const parsed = new Date(fecha);
  if (Number.isNaN(parsed.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffMin = Math.max(Math.round(diffMs / 60000), 0);

  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;

  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;

  return parsed.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncarTexto(texto, max = 92) {
  if (!texto) return "";
  return texto.length > max ? `${texto.slice(0, max).trim()}...` : texto;
}

function getVisualConfig(item) {
  const severityStyles = {
    info: {
      wrapper: "bg-sky-50 text-sky-700 border-sky-100",
      dot: "bg-sky-500",
      Icon: MessageSquareMore,
    },
    warning: {
      wrapper: "bg-amber-50 text-amber-700 border-amber-100",
      dot: "bg-amber-500",
      Icon: CircleAlert,
    },
    critical: {
      wrapper: "bg-red-50 text-red-700 border-red-100",
      dot: "bg-red-500",
      Icon: TriangleAlert,
    },
  };

  const eventMap = {
    incidente_creado: { label: "Incidente", Icon: ShieldAlert },
    incidente_asignado: { label: "Asignación", Icon: TriangleAlert },
    incidente_comentado: { label: "Comentario", Icon: MessageSquareMore },
    incidente_resuelto: { label: "Resuelto", Icon: CheckCheck },
    incidente_cerrado: { label: "Cerrado", Icon: XCircle },
  };

  const severity = severityStyles[item?.severity] || severityStyles.info;
  const event = eventMap[item?.evento] || {};

  return {
    wrapper: severity.wrapper,
    dot: severity.dot,
    Icon: event.Icon || severity.Icon,
    label: event.label || "Notificación",
  };
}

function resolveNavigationTarget(item, role) {
  const normalizedRole = (role || "").toLowerCase();
  const incidenteId = item?.source_type === "incidente" ? item?.source_id : null;

  if (incidenteId) {
    if (normalizedRole === "empleado") {
      return `/mis-incidentes?incidente_id=${encodeURIComponent(incidenteId)}`;
    }
    return `/incidentes?incidente_id=${encodeURIComponent(incidenteId)}`;
  }

  if (typeof item?.deep_link === "string" && item.deep_link.trim()) {
    const match = item.deep_link.match(/^\/incidentes\/([^/?#]+)/);
    if (match?.[1]) {
      if (normalizedRole === "empleado") {
        return `/mis-incidentes?incidente_id=${encodeURIComponent(match[1])}`;
      }
      return `/incidentes?incidente_id=${encodeURIComponent(match[1])}`;
    }
  }

  return normalizedRole === "empleado" ? "/mis-incidentes" : "/incidentes";
}

export default function NotificacionesBell({ mobile = false }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const usuario = useSelector((state) => state.usuarios.usuarioLogueado);
  const role = (usuario?.rol || "").toLowerCase();
  const shouldShow = ["admin", "supervisor", "empleado"].includes(role);

  const { data: unreadData, isError: unreadError } = useObtenerUnreadCountQuery(undefined, {
    skip: !shouldShow,
    pollingInterval: 30000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const {
    data: notificacionesData,
    isLoading: isLoadingNotificaciones,
    isFetching: isFetchingNotificaciones,
    isError: notificacionesError,
  } = useObtenerNotificacionesQuery(
    { limit: 20, offset: 0, solo_no_leidas: false },
    {
      skip: !shouldShow || !open,
      pollingInterval: open ? 30000 : 0,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const [marcarNotificacionLeida, { isLoading: marcandoIndividual }] = useMarcarNotificacionLeidaMutation();
  const [marcarTodasLeidas, { isLoading: marcandoTodas }] = useMarcarTodasLeidasMutation();

  const unreadCount = unreadData?.unread_count || 0;
  const items = useMemo(() => notificacionesData?.items || [], [notificacionesData]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!shouldShow) return null;

  const buttonClass = mobile
    ? "relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
    : "relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white transition hover:bg-white/16";

  const dropdownClass = mobile
    ? "absolute right-0 top-[calc(100%+10px)] z-[120] w-[min(92vw,360px)]"
    : "absolute right-0 top-[calc(100%+12px)] z-[120] w-[360px]";

  const handleMarcarTodas = async () => {
    try {
      await marcarTodasLeidas().unwrap();
    } catch (error) {
      toast.error(error?.data?.detail || "No se pudieron marcar las notificaciones");
    }
  };

  const handleItemClick = async (item) => {
    try {
      if (!item.read_at) {
        await marcarNotificacionLeida(item.id).unwrap();
      }
    } catch (error) {
      toast.error(error?.data?.detail || "No se pudo marcar la notificación");
    } finally {
      setOpen(false);
      navigate(resolveNavigationTarget(item, role));
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={buttonClass}
        aria-label="Abrir notificaciones"
      >
        <Bell size={mobile ? 18 : 20} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-[20px] items-center justify-center rounded-full bg-[#ff5a5f] px-1.5 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-black/20">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={dropdownClass}>
          <div className="overflow-hidden rounded-[26px] border border-[#dbe8f2] bg-white shadow-2xl shadow-[#071f35]/20">
            <div className="border-b border-[#e8eff5] bg-[linear-gradient(135deg,#071f35_0%,#123b63_100%)] px-4 py-4 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold tracking-tight">Notificaciones</p>
                  <p className="mt-1 text-xs text-white/70">
                    {unreadError ? "No se pudo cargar el contador" : unreadCount > 0 ? `${unreadCount} sin leer` : "Todo al día"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleMarcarTodas}
                  disabled={marcandoTodas || unreadCount === 0}
                  className="rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {marcandoTodas ? "Marcando..." : "Marcar todas"}
                </button>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto bg-[#fbfdff]">
              {isLoadingNotificaciones || (isFetchingNotificaciones && items.length === 0) ? (
                <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-[#5b6b79]">
                  <Loader2 size={16} className="animate-spin" />
                  Cargando notificaciones...
                </div>
              ) : notificacionesError ? (
                <div className="px-4 py-10 text-center text-sm text-[#5b6b79]">
                  No pudimos cargar las notificaciones.
                </div>
              ) : items.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef4f9] text-[#0A2A47]">
                    <Bell size={20} />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[#0A2A47]">No tienes notificaciones</p>
                  <p className="mt-1 text-sm text-[#5b6b79]">Aquí aparecerán los avisos operativos importantes.</p>
                </div>
              ) : (
                <div className="p-2">
                  {items.map((item) => {
                    const visual = getVisualConfig(item);
                    const Icon = visual.Icon;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleItemClick(item)}
                        disabled={marcandoIndividual}
                        className={`mb-2 flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition last:mb-0 ${
                          item.read_at
                            ? "border-transparent bg-white hover:border-[#dbe8f2] hover:bg-[#f8fbfe]"
                            : "border-[#dbe8f2] bg-[#f4f8fb] hover:bg-[#eef5fb]"
                        }`}
                      >
                        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${visual.wrapper}`}>
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#0A2A47]">{item.titulo}</p>
                              <p className="mt-1 text-xs text-[#5b6b79]">{truncarTexto(item.mensaje, 110)}</p>
                            </div>
                            {!item.read_at && <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${visual.dot}`} />}
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7b8a97]">
                              {visual.label}
                            </span>
                            <span className="text-xs text-[#7b8a97]">{formatFecha(item.delivered_at || item.created_at)}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

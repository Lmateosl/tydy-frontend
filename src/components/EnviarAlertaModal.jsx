import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Loader2,
  MapPin,
  Megaphone,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

import { useEnviarAlertaManualMutation } from "../redux/api/alertasApi";
import {
  useLazyObtenerUsuariosAreaQuery,
  useObtenerAreasPorLocacionQuery,
  useObtenerAreasUsuarioQuery,
  useObtenerEmpresasQuery,
  useObtenerLocacionesQuery,
} from "../redux/api/empresasApi";
import { useObtenerUsuariosQuery } from "../redux/api/userApi";

const SEVERITY_OPTIONS = [
  { value: "info", label: "Informativa", tone: "bg-sky-50 text-sky-700 border-sky-100" },
  { value: "warning", label: "Advertencia", tone: "bg-amber-50 text-amber-700 border-amber-100" },
  { value: "critical", label: "Crítica", tone: "bg-red-50 text-red-700 border-red-100" },
];

const ADMIN_AUDIENCE_OPTIONS = [
  { value: "all", label: "Toda la compañía" },
  { value: "role", label: "Por rol" },
  { value: "empresa", label: "Por empresa" },
  { value: "locacion", label: "Por locación" },
  { value: "user", label: "Usuarios específicos" },
];

const SUPERVISOR_AUDIENCE_OPTIONS = [
  { value: "locacion", label: "Mi locación" },
  { value: "user", label: "Usuarios de una locación" },
];

const ROLE_OPTIONS = [
  { value: "admin", label: "Admins" },
  { value: "supervisor", label: "Supervisores" },
  { value: "empleado", label: "Empleados" },
];

const INITIAL_FORM = {
  titulo: "",
  mensaje: "",
  severity: "info",
  audiencia_tipo: "",
  rol: "",
  empresa_id: "",
  locacion_id: "",
  user_ids: [],
};

function FieldLabel({ children }) {
  return <label className="mb-2 block text-sm font-semibold text-[#0A2A47]">{children}</label>;
}

function normalizarRol(rol) {
  return (rol || "").toLowerCase();
}

export default function EnviarAlertaModal({ isOpen, onClose }) {
  const currentUser = useSelector((state) => state.usuarios?.usuarioLogueado);
  const currentRole = normalizarRol(currentUser?.rol);
  const isAdmin = currentRole === "admin";
  const isSupervisor = currentRole === "supervisor";

  const [form, setForm] = useState(INITIAL_FORM);
  const [userSearch, setUserSearch] = useState("");
  const [usuariosSupervisorLocacion, setUsuariosSupervisorLocacion] = useState([]);

  const [enviarAlertaManual, { isLoading: enviando }] = useEnviarAlertaManualMutation();
  const { data: usuarios = [] } = useObtenerUsuariosQuery(undefined, {
    skip: !isOpen || !isAdmin,
  });
  const { data: empresas = [] } = useObtenerEmpresasQuery(undefined, {
    skip: !isOpen || !isAdmin,
  });
  const { data: locaciones = [] } = useObtenerLocacionesQuery(undefined, {
    skip: !isOpen || (!isAdmin && !isSupervisor),
  });
  const { data: areasCompany = [] } = useObtenerAreasUsuarioQuery(undefined, {
    skip: !isOpen || !isAdmin,
  });

  const shouldLoadSupervisorLocacionUsers = isOpen
    && isSupervisor
    && form.audiencia_tipo === "user"
    && Boolean(form.locacion_id);

  const { data: areasSupervisorLocacion = [], isFetching: cargandoAreasSupervisorLocacion } =
    useObtenerAreasPorLocacionQuery(form.locacion_id, {
      skip: !shouldLoadSupervisorLocacionUsers,
    });
  const [triggerObtenerUsuariosArea] = useLazyObtenerUsuariosAreaQuery();

  useEffect(() => {
    if (!isOpen) {
      setForm(INITIAL_FORM);
      setUserSearch("");
      setUsuariosSupervisorLocacion([]);
      return;
    }

    setForm((prev) => {
      if (prev.audiencia_tipo) return prev;
      const defaultAudience = isAdmin ? "all" : "locacion";
      return {
        ...prev,
        audiencia_tipo: defaultAudience,
      };
    });
  }, [isAdmin, isOpen]);

  useEffect(() => {
    if (!shouldLoadSupervisorLocacionUsers) {
      setUsuariosSupervisorLocacion([]);
      return;
    }

    let cancelled = false;

    const cargarUsuarios = async () => {
      if (!areasSupervisorLocacion.length) {
        setUsuariosSupervisorLocacion([]);
        return;
      }

      try {
        const resultados = await Promise.all(
          areasSupervisorLocacion.map((area) =>
            triggerObtenerUsuariosArea(
              { locacion_id: form.locacion_id, area_id: area.id },
              true,
            )
              .unwrap()
              .catch(() => [])
          )
        );

        if (cancelled) return;

        const usuariosUnicos = new Map();
        resultados.flat().forEach((usuario) => {
          if (!usuario?.id) return;
          usuariosUnicos.set(usuario.id, usuario);
        });

        setUsuariosSupervisorLocacion(Array.from(usuariosUnicos.values()));
      } catch {
        if (!cancelled) {
          setUsuariosSupervisorLocacion([]);
        }
      }
    };

    cargarUsuarios();

    return () => {
      cancelled = true;
    };
  }, [
    areasSupervisorLocacion,
    form.locacion_id,
    shouldLoadSupervisorLocacionUsers,
    triggerObtenerUsuariosArea,
  ]);

  const areaPorId = useMemo(
    () => areasCompany.reduce((acc, area) => {
      acc[area.id] = area;
      return acc;
    }, {}),
    [areasCompany],
  );

  const locacionPorId = useMemo(
    () => locaciones.reduce((acc, locacion) => {
      acc[locacion.id] = locacion;
      return acc;
    }, {}),
    [locaciones],
  );

  const audienceOptions = isAdmin ? ADMIN_AUDIENCE_OPTIONS : SUPERVISOR_AUDIENCE_OPTIONS;

  const locacionesDisponibles = useMemo(() => {
    if (!isAdmin) return locaciones;
    if (!form.empresa_id) return locaciones;
    return locaciones.filter((locacion) => locacion.empresa_id === form.empresa_id);
  }, [form.empresa_id, isAdmin, locaciones]);

  const usuariosAdminFiltrados = useMemo(() => {
    const base = usuarios.filter((usuario) => {
      const rol = normalizarRol(usuario.rol);
      return usuario.id !== currentUser?.id && rol !== "cliente";
    });

    if (form.audiencia_tipo === "empresa" && form.empresa_id) {
      const locacionIds = new Set(
        locaciones
          .filter((locacion) => locacion.empresa_id === form.empresa_id)
          .map((locacion) => locacion.id)
      );

      return base.filter((usuario) => {
        const area = areaPorId[usuario.area_id];
        const enArea = area && locacionIds.has(area.locacion_id);
        const supervisorAsignado = Array.from(locacionIds).some(
          (locacionId) => locacionPorId[locacionId]?.supervisor_id === usuario.id
        );
        return enArea || supervisorAsignado;
      });
    }

    if (form.audiencia_tipo === "empresa" && !form.empresa_id) {
      return [];
    }

    if ((form.audiencia_tipo === "locacion" || form.audiencia_tipo === "user") && form.locacion_id) {
      return base.filter((usuario) => {
        const area = areaPorId[usuario.area_id];
        const enArea = area?.locacion_id === form.locacion_id;
        const supervisorAsignado = locacionPorId[form.locacion_id]?.supervisor_id === usuario.id;
        return enArea || supervisorAsignado;
      });
    }

    if ((form.audiencia_tipo === "locacion" || form.audiencia_tipo === "user") && !form.locacion_id) {
      return [];
    }

    return base;
  }, [
    areaPorId,
    currentUser?.id,
    form.audiencia_tipo,
    form.empresa_id,
    form.locacion_id,
    locacionPorId,
    locaciones,
    usuarios,
  ]);

  const usuariosSupervisorFiltrados = useMemo(
    () => usuariosSupervisorLocacion.filter((usuario) => {
      const rol = normalizarRol(usuario.rol);
      return usuario.id !== currentUser?.id && rol !== "cliente";
    }),
    [currentUser?.id, usuariosSupervisorLocacion],
  );

  const usuariosSeleccionables = isAdmin ? usuariosAdminFiltrados : usuariosSupervisorFiltrados;

  const usuariosVisibles = useMemo(() => {
    const texto = userSearch.trim().toLowerCase();
    if (!texto) return usuariosSeleccionables;

    return usuariosSeleccionables.filter((usuario) => {
      const area = areaPorId[usuario.area_id];
      const locacion = area ? locacionPorId[area.locacion_id] : null;
      return [
        usuario.nombre,
        usuario.email,
        usuario.identificacion,
        usuario.area_nombre,
        area?.nombre,
        locacion?.nombre,
      ]
        .filter(Boolean)
        .some((valor) => valor.toLowerCase().includes(texto));
    });
  }, [areaPorId, locacionPorId, userSearch, usuariosSeleccionables]);

  const destinatariosEstimados = useMemo(() => {
    if (!form.audiencia_tipo) return 0;

    if (form.audiencia_tipo === "user") {
      return form.user_ids.length;
    }

    if (form.audiencia_tipo === "locacion" && form.locacion_id) {
      if (isSupervisor) {
        return usuariosSupervisorFiltrados.length;
      }
      return usuariosAdminFiltrados.length;
    }

    if (form.audiencia_tipo === "empresa" && form.empresa_id) {
      return usuariosAdminFiltrados.length;
    }

    if (form.audiencia_tipo === "role" && form.rol) {
      return usuarios
        .filter((usuario) => normalizarRol(usuario.rol) === form.rol)
        .filter((usuario) => usuario.id !== currentUser?.id && normalizarRol(usuario.rol) !== "cliente")
        .length;
    }

    if (form.audiencia_tipo === "all") {
      return usuarios.filter((usuario) => {
        const rol = normalizarRol(usuario.rol);
        return usuario.id !== currentUser?.id && rol !== "cliente";
      }).length;
    }

    return 0;
  }, [
    currentUser?.id,
    form.audiencia_tipo,
    form.empresa_id,
    form.locacion_id,
    form.rol,
    form.user_ids.length,
    isSupervisor,
    usuarios,
    usuariosAdminFiltrados.length,
    usuariosSupervisorFiltrados.length,
  ]);

  const locacionObligatoriaParaUsuariosSupervisor = isSupervisor && form.audiencia_tipo === "user";

  const resetDependentFields = (audienciaTipo) => {
    const siguiente = {
      ...INITIAL_FORM,
      titulo: form.titulo,
      mensaje: form.mensaje,
      severity: form.severity,
      audiencia_tipo: audienciaTipo,
    };

    if (isSupervisor && audienciaTipo === "locacion" && locaciones.length === 1) {
      siguiente.locacion_id = locaciones[0].id;
    }

    return siguiente;
  };

  const handleAudienceChange = (audienciaTipo) => {
    setForm(resetDependentFields(audienciaTipo));
    setUserSearch("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };

      if (name === "empresa_id") {
        next.locacion_id = "";
        next.user_ids = [];
      }

      if (name === "locacion_id") {
        next.user_ids = [];
      }

      return next;
    });
  };

  const toggleUser = (userId) => {
    setForm((prev) => {
      const exists = prev.user_ids.includes(userId);
      return {
        ...prev,
        user_ids: exists
          ? prev.user_ids.filter((id) => id !== userId)
          : [...prev.user_ids, userId],
      };
    });
  };

  const validar = () => {
    if (!form.titulo.trim()) return "Debes ingresar un título";
    if (!form.mensaje.trim()) return "Debes ingresar un mensaje";
    if (!form.severity) return "Debes seleccionar una severidad";
    if (!form.audiencia_tipo) return "Debes seleccionar una audiencia";
    if (form.audiencia_tipo === "role" && !form.rol) return "Debes seleccionar un rol";
    if (form.audiencia_tipo === "empresa" && !form.empresa_id) return "Debes seleccionar una empresa";
    if (form.audiencia_tipo === "locacion" && !form.locacion_id) return "Debes seleccionar una locación";
    if (form.audiencia_tipo === "user" && !form.user_ids.length) return "Debes seleccionar al menos un usuario";
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const error = validar();
    if (error) {
      toast.error(error);
      return;
    }

    const payload = {
      titulo: form.titulo.trim(),
      mensaje: form.mensaje.trim(),
      severity: form.severity,
      audiencia_tipo: form.audiencia_tipo,
      rol: form.audiencia_tipo === "role" ? form.rol : null,
      empresa_id: form.audiencia_tipo === "empresa" ? form.empresa_id : null,
      locacion_id: ["locacion", "user"].includes(form.audiencia_tipo) && form.locacion_id ? form.locacion_id : null,
      user_ids: form.audiencia_tipo === "user" ? form.user_ids : [],
    };

    try {
      const response = await enviarAlertaManual(payload).unwrap();
      toast.success(`Alerta enviada a ${response.destinatarios} destinatarios`);
      setForm(resetDependentFields(isAdmin ? "all" : "locacion"));
      setUserSearch("");
      setUsuariosSupervisorLocacion([]);
      onClose();
    } catch (apiError) {
      toast.error(apiError?.data?.detail || "No se pudo enviar la alerta");
    }
  };

  if (!isOpen) return null;

  const severitySeleccionada = SEVERITY_OPTIONS.find((option) => option.value === form.severity);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#071f35]/55 backdrop-blur-sm px-4 py-6">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-[30px] border border-[#dbe8f2] bg-white shadow-2xl shadow-[#071f35]/25">
        <div className="relative overflow-hidden border-b border-[#e6f0f8] bg-[linear-gradient(135deg,#071f35_0%,#123b63_100%)] px-6 py-5 text-white">
          <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.28),_transparent_36%)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold">
                <Megaphone size={16} />
                Alerta operativa interna
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight">Enviar alerta</h2>
              <p className="mt-2 max-w-2xl text-sm text-white/75">
                Envía un aviso interno al equipo operativo. Los clientes no reciben alertas internas.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[82vh] overflow-y-auto bg-[#fbfdff]">
          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.35fr_0.95fr]">
            <div className="space-y-5">
              <div className="rounded-3xl border border-[#e6f0f8] bg-white p-5 shadow-sm">
                <FieldLabel>Título</FieldLabel>
                <input
                  name="titulo"
                  value={form.titulo}
                  onChange={handleChange}
                  maxLength={140}
                  placeholder="Ej. Revisar evidencia pendiente del turno mañana"
                  className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                />

                <div className="mt-4">
                  <FieldLabel>Mensaje</FieldLabel>
                  <textarea
                    name="mensaje"
                    value={form.mensaje}
                    onChange={handleChange}
                    maxLength={2000}
                    rows={6}
                    placeholder="Escribe aquí la instrucción o aviso operativo."
                    className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-[#e6f0f8] bg-white p-5 shadow-sm">
                <FieldLabel>Severidad</FieldLabel>
                <div className="grid gap-3 md:grid-cols-3">
                  {SEVERITY_OPTIONS.map((option) => {
                    const selected = form.severity === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, severity: option.value }))}
                        className={`rounded-2xl border px-4 py-3 text-left transition ${
                          selected
                            ? `${option.tone} shadow-sm`
                            : "border-[#dbe8f2] bg-[#f8fbfd] text-[#0A2A47] hover:border-[#b9d2e6]"
                        }`}
                      >
                        <p className="text-sm font-semibold">{option.label}</p>
                        <p className="mt-1 text-xs opacity-80">
                          {option.value === "info" ? "Aviso general" : option.value === "warning" ? "Requiere atención" : "Prioridad alta"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-3xl border border-[#e6f0f8] bg-white p-5 shadow-sm">
                <FieldLabel>Audiencia</FieldLabel>
                <div className="space-y-2">
                  {audienceOptions.map((option) => {
                    const selected = form.audiencia_tipo === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleAudienceChange(option.value)}
                        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                          selected
                            ? "border-[#3BAE3D]/35 bg-[#effaf0] text-[#0A2A47]"
                            : "border-[#dbe8f2] bg-[#f8fbfd] text-[#0A2A47] hover:border-[#b9d2e6]"
                        }`}
                      >
                        <span className="text-sm font-semibold">{option.label}</span>
                        <span className={`h-2.5 w-2.5 rounded-full ${selected ? "bg-[#3BAE3D]" : "bg-[#c8d8e6]"}`} />
                      </button>
                    );
                  })}
                </div>

                {form.audiencia_tipo === "role" && isAdmin && (
                  <div className="mt-4">
                    <FieldLabel>Rol</FieldLabel>
                    <select
                      name="rol"
                      value={form.rol}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                    >
                      <option value="">Selecciona un rol</option>
                      {ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {form.audiencia_tipo === "empresa" && isAdmin && (
                  <div className="mt-4">
                    <FieldLabel>Empresa</FieldLabel>
                    <select
                      name="empresa_id"
                      value={form.empresa_id}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                    >
                      <option value="">Selecciona una empresa</option>
                      {empresas.map((empresa) => (
                        <option key={empresa.id} value={empresa.id}>
                          {empresa.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {["locacion", "user"].includes(form.audiencia_tipo) && (
                  <div className="mt-4">
                    <FieldLabel>Locación</FieldLabel>
                    <select
                      name="locacion_id"
                      value={form.locacion_id}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                    >
                      <option value="">Selecciona una locación</option>
                      {locacionesDisponibles.map((locacion) => (
                        <option key={locacion.id} value={locacion.id}>
                          {locacion.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {form.audiencia_tipo === "user" && (
                  <div className="mt-4">
                    <FieldLabel>Usuarios</FieldLabel>
                    {locacionObligatoriaParaUsuariosSupervisor && !form.locacion_id ? (
                      <div className="rounded-2xl border border-dashed border-[#dbe8f2] bg-[#f8fbfd] px-4 py-5 text-sm text-[#5b6b79]">
                        Primero selecciona una locación para ver usuarios dentro de tu scope.
                      </div>
                    ) : (
                      <>
                        <input
                          value={userSearch}
                          onChange={(event) => setUserSearch(event.target.value)}
                          placeholder="Buscar por nombre, email o área"
                          className="w-full rounded-2xl border border-[#dbe8f2] bg-[#f8fbfd] px-4 py-3 text-[#0A2A47] outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10"
                        />

                        <div className="mt-3 max-h-64 overflow-y-auto rounded-2xl border border-[#e6f0f8] bg-[#fbfdff] p-2">
                          {cargandoAreasSupervisorLocacion ? (
                            <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-[#5b6b79]">
                              <Loader2 size={16} className="animate-spin" />
                              Cargando usuarios...
                            </div>
                          ) : usuariosVisibles.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm text-[#5b6b79]">
                              No hay usuarios disponibles para esta selección.
                            </div>
                          ) : (
                            usuariosVisibles.map((usuario) => {
                              const area = areaPorId[usuario.area_id];
                              const locacion = area ? locacionPorId[area.locacion_id] : null;
                              const checked = form.user_ids.includes(usuario.id);
                              return (
                                <label
                                  key={usuario.id}
                                  className={`mb-2 flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition last:mb-0 ${
                                    checked
                                      ? "border-[#3BAE3D]/35 bg-[#effaf0]"
                                      : "border-transparent bg-white hover:border-[#dbe8f2] hover:bg-[#f8fbfd]"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="mt-1 h-4 w-4 rounded border-[#b8cad9] text-[#3BAE3D] focus:ring-[#3BAE3D]"
                                    checked={checked}
                                    onChange={() => toggleUser(usuario.id)}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-[#0A2A47]">{usuario.nombre}</p>
                                    <p className="mt-1 text-xs text-[#5b6b79]">{usuario.email}</p>
                                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7b8a97]">
                                      <span>{usuario.rol}</span>
                                      {area?.nombre && <span>{area.nombre}</span>}
                                      {locacion?.nombre && <span>{locacion.nombre}</span>}
                                    </div>
                                  </div>
                                </label>
                              );
                            })
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-[#e6f0f8] bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-[#0A2A47]">Resumen</p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3 rounded-2xl border border-[#e6f0f8] bg-[#f8fbfd] px-4 py-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${severitySeleccionada?.tone || "bg-sky-50 text-sky-700 border-sky-100"}`}>
                      {form.audiencia_tipo === "all" ? <Users size={16} /> : form.audiencia_tipo === "empresa" ? <Building2 size={16} /> : form.audiencia_tipo === "locacion" ? <MapPin size={16} /> : <ShieldAlert size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0A2A47]">
                        {audienceOptions.find((option) => option.value === form.audiencia_tipo)?.label || "Selecciona una audiencia"}
                      </p>
                      <p className="mt-1 text-xs text-[#5b6b79]">
                        {destinatariosEstimados > 0
                          ? `Estimado actual: ${destinatariosEstimados} destinatarios`
                          : "Completa la audiencia para estimar destinatarios"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-dashed border-[#dbe8f2] bg-[#fbfdff] px-4 py-4 text-sm text-[#5b6b79]">
                    Los clientes no reciben alertas internas. Tu propio usuario tampoco será incluido.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#e6f0f8] bg-white px-6 py-4">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-[#dbe8f2] px-5 py-3 text-sm font-semibold text-[#0A2A47] transition hover:border-[#0A2A47] hover:bg-[#f8fbfd]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#071f35] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#071f35]/10 transition hover:bg-[#123b63] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enviando ? <Loader2 size={16} className="animate-spin" /> : <Megaphone size={16} />}
                {enviando ? "Enviando..." : "Enviar alerta"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

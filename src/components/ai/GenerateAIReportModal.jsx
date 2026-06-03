import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import {
  useObtenerEmpresasQuery,
  useObtenerLocacionesQuery,
} from "../../redux/api/empresasApi";

const TODAY_ISO = new Date().toISOString().slice(0, 10);

const buildRangeDays = (start, end) => {
  if (!start || !end) return null;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  return Math.floor((endDate - startDate) / 86400000) + 1;
};

const getErrorDetail = (error) => {
  const detail = error?.data?.detail;
  if (typeof detail === "string") return detail;
  if (detail?.code === "AI_DISABLED") return "AI Reports no está habilitado para esta compañía.";
  if (detail?.code === "AI_USAGE_LIMIT_EXCEEDED") return "La compañía alcanzó el límite mensual de AI.";
  if (error?.status === 403) return "No tienes permisos para generar reportes AI.";
  return "No se pudo generar el reporte AI.";
};

export default function GenerateAIReportModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const [form, setForm] = useState({
    scope_type: "company",
    scope_entity_id: "",
    period_type: "weekly",
    period_start: TODAY_ISO,
    period_end: TODAY_ISO,
  });

  const { data: empresas = [] } = useObtenerEmpresasQuery(undefined, { skip: !isOpen });
  const { data: locaciones = [] } = useObtenerLocacionesQuery(undefined, { skip: !isOpen });

  useEffect(() => {
    if (!isOpen) return;
    setForm((prev) => ({
      ...prev,
      scope_type: prev.scope_type || "company",
      period_type: prev.period_type || "weekly",
      period_start: prev.period_start || TODAY_ISO,
      period_end: prev.period_end || TODAY_ISO,
    }));
  }, [isOpen]);

  const locacionesFiltradas = useMemo(() => {
    if (form.scope_type !== "locacion") return locaciones;
    return locaciones;
  }, [form.scope_type, locaciones]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "scope_type" ? { scope_entity_id: "" } : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.scope_type) {
      toast.error("Selecciona un scope para el reporte.");
      return;
    }
    if (form.scope_type !== "company" && !form.scope_entity_id) {
      toast.error("Selecciona la entidad correspondiente.");
      return;
    }
    if (!form.period_type || !form.period_start || !form.period_end) {
      toast.error("Completa el tipo de período y las fechas.");
      return;
    }

    const days = buildRangeDays(form.period_start, form.period_end);
    if (!days || days <= 0) {
      toast.error("Selecciona un rango de fechas válido.");
      return;
    }
    if (form.period_type === "weekly" && (days < 6 || days > 8)) {
      toast.error("Un reporte semanal debe cubrir entre 6 y 8 días.");
      return;
    }
    if (form.period_type === "monthly" && (days < 28 || days > 31)) {
      toast.error("Un reporte mensual debe cubrir entre 28 y 31 días.");
      return;
    }

    try {
      await onSubmit({
        scope_type: form.scope_type,
        scope_entity_id: form.scope_type === "company" ? null : form.scope_entity_id,
        period_type: form.period_type,
        period_start: `${form.period_start}T00:00:00`,
        period_end: `${form.period_end}T23:59:59`,
      });
      toast.success("Reporte AI enviado a generación.");
      onClose();
    } catch (error) {
      toast.error(getErrorDetail(error));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#071f35]/45 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-[28px] bg-white shadow-2xl border border-[#dbe8f2] overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-[#edf3f8]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3BAE3D]">AI</p>
            <h3 className="text-2xl font-extrabold text-[#0A2A47] tracking-tight">Generar reporte AI</h3>
            <p className="mt-1 text-sm text-gray-500">
              Crea un resumen semanal o mensual con actividades, incidentes y feedback verificado.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl border border-[#e6f0f8] bg-[#f8fbfd] text-[#0A2A47] flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-[#0A2A47]">Scope</span>
              <select
                value={form.scope_type}
                onChange={(e) => handleChange("scope_type", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#dbe8f2] bg-white px-4 py-3 text-sm text-[#0A2A47] outline-none"
              >
                <option value="company">Compañía</option>
                <option value="empresa">Empresa</option>
                <option value="locacion">Locación</option>
              </select>
            </label>

            {form.scope_type === "empresa" && (
              <label className="block">
                <span className="text-sm font-semibold text-[#0A2A47]">Empresa</span>
                <select
                  value={form.scope_entity_id}
                  onChange={(e) => handleChange("scope_entity_id", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#dbe8f2] bg-white px-4 py-3 text-sm text-[#0A2A47] outline-none"
                >
                  <option value="">Selecciona una empresa</option>
                  {empresas.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.nombre}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {form.scope_type === "locacion" && (
              <label className="block">
                <span className="text-sm font-semibold text-[#0A2A47]">Locación</span>
                <select
                  value={form.scope_entity_id}
                  onChange={(e) => handleChange("scope_entity_id", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#dbe8f2] bg-white px-4 py-3 text-sm text-[#0A2A47] outline-none"
                >
                  <option value="">Selecciona una locación</option>
                  {locacionesFiltradas.map((locacion) => (
                    <option key={locacion.id} value={locacion.id}>
                      {locacion.nombre}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="block">
              <span className="text-sm font-semibold text-[#0A2A47]">Tipo de período</span>
              <select
                value={form.period_type}
                onChange={(e) => handleChange("period_type", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#dbe8f2] bg-white px-4 py-3 text-sm text-[#0A2A47] outline-none"
              >
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-[#0A2A47]">Fecha inicio</span>
              <input
                type="date"
                value={form.period_start}
                onChange={(e) => handleChange("period_start", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#dbe8f2] bg-white px-4 py-3 text-sm text-[#0A2A47] outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-[#0A2A47]">Fecha fin</span>
              <input
                type="date"
                value={form.period_end}
                onChange={(e) => handleChange("period_end", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#dbe8f2] bg-white px-4 py-3 text-sm text-[#0A2A47] outline-none"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-[#e6f0f8] bg-[#f8fbfd] px-4 py-3 text-sm text-gray-600">
            El reporte se genera en segundo plano. Podrás seguir el estado desde la lista de reportes AI.
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-2xl border border-[#dbe8f2] text-[#0A2A47] font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-3 rounded-2xl bg-[#071f35] text-white font-semibold shadow-lg shadow-[#071f35]/15 disabled:opacity-60"
            >
              {isSubmitting ? "Generando..." : "Generar reporte AI"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useObtenerUsuariosQuery } from "../../../redux/api/userApi";
import Layout from "../../../components/Layout";
import { useObtenerActividadesUsuarioQuery } from "../../../redux/api/historialApi";
import Chart from "react-apexcharts";
import { format } from "date-fns";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

export default function Reportes() {
  const [usuarioId, setUsuarioId] = useState("");
  const [finalizada, setFinalizada] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const { data: usuarios = [] } = useObtenerUsuariosQuery();

  const { data = [], isLoading } = useObtenerActividadesUsuarioQuery({
    usuario_id: usuarioId || undefined,
    finalizada: finalizada === "" ? undefined : finalizada === "true",
    desde: desde || undefined,
    hasta: hasta || undefined,
  });

  const descargarExcel = () => {
    const filas = data.map(a => ({
      "Hora Inicio": format(new Date(a.hora_inicio), "dd/MM/yyyy HH:mm"),
      "Hora Fin": format(new Date(a.hora_fin), "dd/MM/yyyy HH:mm"),
      "Lista": a.lista?.nombre || "-",
      "Actividades Lista": a.lista?.actividades?.map(act => act.nombre).join(", ") || "-",
      "Finalizada": a.finalizada ? "Sí" : "No",
      "Comentario": a.comentario || "-",
      "Encargado": a.usuario?.nombre || "-",
      "ID Encargado": a.usuario?.identificacion || "-",
      "Empresa": a.usuario?.area?.locacion?.empresa?.nombre || "-",
      "Locación": a.usuario?.area?.locacion?.nombre || "-",
      "Área": a.usuario?.area?.nombre || "-",
      "Imagen": a.imagen || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Actividades");

    const blob = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([blob], { type: "application/octet-stream" }), "actividades.xlsx");
  };

  const actividadesPorLocacion = {};
  const actividadesPorUsuario = {};
  let conComentario = 0;
  let sinComentario = 0;
  const actividadesPorFecha = {};

  data.forEach(a => {
    const locacion = a.usuario?.area?.locacion?.nombre || "-";
    actividadesPorLocacion[locacion] = (actividadesPorLocacion[locacion] || 0) + 1;

    const usuario = a.usuario?.nombre || "-";
    actividadesPorUsuario[usuario] = (actividadesPorUsuario[usuario] || 0) + 1;

    if (a.comentario && a.comentario !== "string") conComentario++;
    else sinComentario++;

    const fecha = format(new Date(a.hora_inicio), "yyyy-MM-dd");
    actividadesPorFecha[fecha] = (actividadesPorFecha[fecha] || 0) + 1;
  });

  return (
    <Layout>
      <div className="bg-white p-4">
        <h1 className="text-3xl font-extrabold text-[#0A2A47] mb-4">Reportes</h1>

        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={usuarioId}
            onChange={e => setUsuarioId(e.target.value)}
            className="border px-2 py-1 rounded w-full sm:w-auto"
          >
            <option value="">Todos los usuarios</option>
            {usuarios.map(u => (
              <option key={u.id} value={u.id}>
                {u.nombre} ({u.identificacion})
              </option>
            ))}
          </select>
          <select value={finalizada} onChange={e => setFinalizada(e.target.value)} className="border px-2 py-1 rounded w-full sm:w-auto">
            <option value="">Todas</option>
            <option value="true">Finalizadas</option>
            <option value="false">Pendientes</option>
          </select>
          <input type="datetime-local" value={desde} onChange={e => setDesde(e.target.value)} className="border px-2 py-1 rounded w-full sm:w-auto" />
          <input type="datetime-local" value={hasta} onChange={e => setHasta(e.target.value)} className="border px-2 py-1 rounded w-full sm:w-auto" />
          <button className="bg-[#3BAE3D] text-white px-6 py-2 rounded hover:bg-green-700" onClick={descargarExcel}>
            Descargar Excel
          </button>
          <button
            className="bg-[#0A2A47] text-white px-6 py-2 rounded hover:bg-blue-900"
            onClick={() => {
              setUsuarioId("");
              setFinalizada("");
              setDesde("");
              setHasta("");
            }}
          >
            Limpiar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-center font-semibold mb-2">Actividades por Locación</p>
            <Chart options={{ xaxis: { categories: Object.keys(actividadesPorLocacion) }, colors: ["#3BAE3D"] }} series={[{ name: "Actividades", data: Object.values(actividadesPorLocacion) }]} type="bar" height={250} />
          </div>
          <div>
            <p className="text-center font-semibold mb-2">Actividades con y sin Comentario</p>
            <Chart options={{ labels: ["Con Comentario", "Sin Comentario"], colors: ["#0A2A47", "#3BAE3D"] }} series={[conComentario, sinComentario]} type="donut" height={250} />
          </div>
          <div>
            <p className="text-center font-semibold mb-2">Actividades por Usuario</p>
            <Chart options={{ xaxis: { categories: Object.keys(actividadesPorUsuario) }, colors: ["#0A2A47"] }} series={[{ name: "Actividades", data: Object.values(actividadesPorUsuario) }]} type="bar" height={250} />
          </div>
          <div>
            <p className="text-center font-semibold mb-2">Actividades por Fecha</p>
            <Chart options={{ xaxis: { categories: Object.keys(actividadesPorFecha) }, colors: ["#3BAE3D"] }} series={[{ name: "Actividades", data: Object.values(actividadesPorFecha) }]} type="line" height={250} />
          </div>
        </div>

        <div className="overflow-auto max-h-[50vh] rounded-2xl">
          <table className="min-w-full text-sm border">
            <thead className="bg-[#0A2A47] text-white sticky top-0 z-10">
              <tr>
                <th className="p-2">Hora Inicio</th>
                <th className="p-2">Hora Fin</th>
                <th className="p-2">Lista</th>
                <th className="p-2">Actividades Lista</th>
                <th className="p-2">Finalizada</th>
                <th className="p-2">Comentario</th>
                <th className="p-2">Encargado</th>
                <th className="p-2">ID Encargado</th>
                <th className="p-2">Empresa</th>
                <th className="p-2">Locación</th>
                <th className="p-2">Área</th>
                <th className="p-2">Imagen</th>
              </tr>
            </thead>
            <tbody>
              {data.map(a => (
                <tr key={a.id} className="border-t">
                  <td className="p-2">{format(new Date(a.hora_inicio), "dd/MM/yyyy HH:mm")}</td>
                  <td className="p-2">{format(new Date(a.hora_fin), "dd/MM/yyyy HH:mm")}</td>
                  <td className="p-2">{a.lista?.nombre || "-"}</td>
                  <td className="p-2">
                    <ul className="list-disc list-inside">
                      {a.lista?.actividades?.length ? a.lista.actividades.map((act, i) => (
                        <li key={i}>{act.nombre || "-"}</li>
                      )) : "-"}
                    </ul>
                  </td>
                  <td className="p-2">{a.finalizada ? "Sí" : "No"}</td>
                  <td className="p-2">{a.comentario || "-"}</td>
                  <td className="p-2">{a.usuario?.nombre || "-"}</td>
                  <td className="p-2">{a.usuario?.identificacion || "-"}</td>
                  <td className="p-2">{a.usuario?.area?.locacion?.empresa?.nombre || "-"}</td>
                  <td className="p-2">{a.usuario?.area?.locacion?.nombre || "-"}</td>
                  <td className="p-2">{a.usuario?.area?.nombre || "-"}</td>
                  <td className="p-2">
                    {a.imagen && a.imagen !== "string" ? (
                      <img src={a.imagen} alt="Evidencia" className="h-16 w-16 object-cover" />
                    ) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
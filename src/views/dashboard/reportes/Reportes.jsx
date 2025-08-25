import { useState } from "react";
import { useObtenerUsuariosQuery } from "../../../redux/api/userApi";
import Layout from "../../../components/Layout";
import { useObtenerActividadesUsuarioQuery } from "../../../redux/api/historialApi";
import Chart from "react-apexcharts";
import { format } from "date-fns";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useObtenerMiCompaniaQuery } from "../../../redux/api/userApi";

export default function Reportes() {
  const [usuarioId, setUsuarioId] = useState("");
  const [finalizada, setFinalizada] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [empresaFiltro, setEmpresaFiltro] = useState("");
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);

  const { data: usuarios = [] } = useObtenerUsuariosQuery();
  const { data: compania } = useObtenerMiCompaniaQuery();

  const { data = [], isLoading } = useObtenerActividadesUsuarioQuery({
    usuario_id: usuarioId || undefined,
    finalizada: finalizada === "" ? undefined : finalizada === "true",
    desde: desde || undefined,
    hasta: hasta || undefined,
  });

  const empresas = Array.from(new Set(data.map(a => a.usuario?.area?.locacion?.empresa?.nombre).filter(Boolean)));

  const dataFiltrada = data.filter(a => !empresaFiltro || a.usuario?.area?.locacion?.empresa?.nombre === empresaFiltro);

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

  const exportarPDFReportes = async () => {
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let cursorY = 12;

    const urlToDataURL = async (url) => {
      try {
        const res = await fetch(url, { mode: "cors" });
        const blob = await res.blob();
        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        return null;
      }
    };

    // Logo centrado (30% del ancho) con alto automático
    if (compania?.logo) {
      const imgData = await urlToDataURL(compania.logo);
      if (imgData) {
        const imgWidth = pageWidth * 0.3;
        const imgX = (pageWidth - imgWidth) / 2;
        doc.addImage(imgData, "PNG", imgX, cursorY, imgWidth, 0);
        cursorY += imgWidth * 0.35 + 6; // avance estimado, para landscape reducir el avance
      }
    }

    // Datos de la compañía + fecha
    const fecha = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
    doc.setFontSize(11);
    const lines = [
      compania?.nombre ? `Empresa: ${compania.nombre}` : null,
      compania?.ruc ? `RUC: ${compania.ruc}` : null,
      compania?.direccion ? `Dirección: ${compania.direccion}` : null,
      compania?.telefono ? `Teléfono: ${compania.telefono}` : null,
      `Fecha de generación: ${fecha}`,
    ].filter(Boolean);

    lines.forEach((txt, idx) => {
      doc.text(txt, 14, cursorY + idx * 6);
    });

    cursorY += lines.length * 6 + 8;
    doc.setFontSize(16);
    doc.text("Reporte de Actividades", pageWidth / 2, cursorY, { align: "center" });

    // Construcción de tabla desde dataFiltrada
    const headers = [[
      "Hora Inicio",
      "Hora Fin",
      "Lista",
      "Actividades Lista",
      "Finalizada",
      "Comentario",
      "Encargado",
      "ID Encargado",
      "Empresa",
      "Locación",
      "Área",
      "Imagen",
    ]];

    const body = dataFiltrada.map((a) => [
      a.hora_inicio ? format(new Date(a.hora_inicio), "dd/MM/yyyy HH:mm") : "-",
      a.hora_fin ? format(new Date(a.hora_fin), "dd/MM/yyyy HH:mm") : "-",
      a.lista?.nombre || "-",
      a.lista?.actividades?.length ? a.lista.actividades.map((act) => act.nombre).join(", ") : "-",
      a.finalizada ? "Sí" : "No",
      a.comentario && a.comentario !== "string" ? a.comentario : "-",
      a.usuario?.nombre || "-",
      a.usuario?.identificacion || "-",
      a.usuario?.area?.locacion?.empresa?.nombre || "-",
      a.usuario?.area?.locacion?.nombre || "-",
      a.usuario?.area?.nombre || "-",
      a.imagen && a.imagen !== "string" ? "Sí" : "-",
    ]);

    autoTable(doc, {
      head: headers,
      body,
      startY: cursorY + 6,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [10, 42, 71], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        const page = doc.getNumberOfPages();
        doc.setFontSize(9);
        doc.text(`Página ${page}`, pageWidth - 22, pageHeight - 8);
      },
    });

    doc.save(`Reporte-Actividades-${Date.now()}.pdf`);
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
          <select
            value={empresaFiltro}
            onChange={e => setEmpresaFiltro(e.target.value)}
            className="border px-2 py-1 rounded w-full sm:w-auto"
          >
            <option value="">Todas las empresas</option>
            {empresas.map((emp, i) => (
              <option key={i} value={emp}>{emp}</option>
            ))}
          </select>
          <input type="datetime-local" value={desde} onChange={e => setDesde(e.target.value)} className="border px-2 py-1 rounded w-full sm:w-auto" />
          <input type="datetime-local" value={hasta} onChange={e => setHasta(e.target.value)} className="border px-2 py-1 rounded w-full sm:w-auto" />
          <button className="bg-[#3BAE3D] text-white px-6 py-2 rounded hover:bg-green-700" onClick={descargarExcel}>
            Descargar Excel
          </button>
          <button className="bg-[#0A2A47] text-white px-6 py-2 rounded hover:bg-blue-900" onClick={exportarPDFReportes}>
            Exportar PDF
          </button>
          <button
            className="bg-[#0A2A47] text-white px-6 py-2 rounded hover:bg-blue-900"
            onClick={() => {
              setUsuarioId("");
              setFinalizada("");
              setEmpresaFiltro("");
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
              {dataFiltrada.map(a => (
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
                      <img
                        src={a.imagen}
                        alt="Evidencia"
                        className="h-16 w-16 object-cover cursor-pointer"
                        onClick={() => setImagenSeleccionada(a.imagen)}
                      />
                    ) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {imagenSeleccionada && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
            onClick={() => setImagenSeleccionada(null)}
          >
            <img
              src={imagenSeleccionada}
              alt="Vista ampliada"
              className="max-h-[90%] max-w-[90%] object-contain rounded shadow-lg"
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
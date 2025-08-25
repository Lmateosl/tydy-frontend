import { useState, useMemo } from "react";
import Layout from "../../../components/Layout";
import { useObtenerUsuariosQuery } from "../../../redux/api/userApi";
import { useObtenerMiCompaniaQuery } from "../../../redux/api/userApi";
import { Download, Plus, Users, Shield, UserCheck, User, UserCircle } from "lucide-react";
import TablaUsuarios from "./TablaUsuarios";
import FormularioUsuario from "./FormularioUsuario";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Usuarios() {
  const { data: usuarios = [], isLoading, isError, refetch } = useObtenerUsuariosQuery();
  const { data: compania } = useObtenerMiCompaniaQuery();
  const [filtro, setFiltro] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [modoCrear, setModoCrear] = useState(false);

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(
      (u) =>
        u.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
        (u.identificacion || "").toLowerCase().includes(filtro.toLowerCase()) ||
        u.email.toLowerCase().includes(filtro.toLowerCase())
    );
  }, [filtro, usuarios]);


  const exportarCSV = () => {
    const headers = ["Nombre", "Email", "Rol", "Número", "Dirección", "Identificación"];
    const rows = usuariosFiltrados.map((u) => [
      u.nombre,
      u.email,
      u.rol,
      u.numero,
      u.direccion,
      u.identificacion,
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "usuarios.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportarPDF = async () => {
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageWidth = doc.internal.pageSize.getWidth();
    let cursorY = 14;

    // Helper to convert image URL to dataURL (base64)
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

    // Header: Centered Logo + datos de la compañía + fecha
    if (compania?.logo) {
      const imgData = await urlToDataURL(compania.logo);
      if (imgData) {
        // Logo centered, width is 30% of pageWidth, height is auto (preserve aspect ratio)
        const imgWidth = pageWidth * 0.3;
        const imgX = (pageWidth - imgWidth) / 2;
        // Pass undefined for height so jsPDF keeps aspect ratio
        doc.addImage(imgData, "PNG", imgX, cursorY, imgWidth, 0);
        // Estimate cursorY advance: use imgWidth as a rough square fallback plus padding
        cursorY += imgWidth + 6;
      }
    }

    const fecha = new Date().toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    doc.setFontSize(12);
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

    // Título centrado
    cursorY = cursorY + lines.length * 6 + 8;
    doc.setFontSize(16);
    doc.text("Reporte Usuarios", pageWidth / 2, cursorY, { align: "center" });

    // Tabla con usuarios filtrados
    const headers = [["Nombre", "Email", "Rol", "Número", "Dirección", "Identificación"]];
    const body = usuariosFiltrados.map((u) => [
      u.nombre || "",
      u.email || "",
      u.rol || "",
      u.numero || "",
      u.direccion || "",
      u.identificacion || "",
    ]);

    autoTable(doc, {
      head: headers,
      body,
      startY: cursorY + 8,
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [10, 42, 71], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Footer con número de página
        const page = doc.getNumberOfPages();
        doc.setFontSize(9);
        doc.text(
          `Página ${page}`,
          pageWidth - 22,
          doc.internal.pageSize.getHeight() - 10
        );
      },
    });

    doc.save(`Reporte-Usuarios-${Date.now()}.pdf`);
  };

  return (
    <Layout>
      <div className="p-4">
        <h1 className="text-3xl font-extrabold text-[#0A2A47] mb-4">Usuarios</h1>

        <div className="hidden md:flex text-white text-[18px] shadow rounded-xl p-4 mb-4 flex-wrap justify-center items-center bg-[#0A2A47] gap-7">
          <div className="flex flex-col items-center mb-2 md:mb-0">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-[#3BAE3D]"/>
              <span className="font-bold">Total</span>
            </div>
            <span className="text-lg font-bold">{usuarios.length}</span>
          </div>
          <div className="flex flex-col items-center mb-2 md:mb-0">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-[#3BAE3D]"/>
              <span className="font-bold">Administradores</span>
            </div>
            <span className="text-lg font-bold">{usuarios.filter(u => u.rol === 'admin').length}</span>
          </div>
          <div className="flex flex-col items-center mb-2 md:mb-0">
            <div className="flex items-center gap-2">
              <UserCheck size={18} className="text-[#3BAE3D]"/>
              <span className="font-bold">Supervisores</span>
            </div>
            <span className="text-lg font-bold">{usuarios.filter(u => u.rol === 'supervisor').length}</span>
          </div>
          <div className="flex flex-col items-center mb-2 md:mb-0">
            <div className="flex items-center gap-2">
              <User size={18} className="text-[#3BAE3D]"/>
              <span className="font-bold">Empleados</span>
            </div>
            <span className="text-lg font-bold">{usuarios.filter(u => u.rol === 'empleado').length}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <UserCircle size={18} className="text-[#3BAE3D]"/>
              <span className="font-bold">Clientes</span>
            </div>
            <span className="text-lg font-bold">{usuarios.filter(u => u.rol === 'cliente').length}</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
           <input
            type="text"
            placeholder="Buscar por nombre, identificación o email"
            className="border border-gray-300 rounded px-3 py-1 w-full md:w-2/5 text-[#333333]"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={exportarPDF}
              className="flex items-center gap-1 bg-[#0A2A47] text-white px-3 py-1 rounded hover:border-[#0A2A47] hover:bg-white hover:text-[#0A2A47] hover:border-1"
            >
              <Download size={16} />
              Exportar PDF
            </button>
            <button
              onClick={exportarCSV}
              className="flex items-center gap-1 bg-[#0A2A47] text-white px-3 py-1 rounded hover:border-[#0A2A47] hover:bg-white hover:text-[#0A2A47] hover:border-1"
            >
              <Download size={16} />
              Exportar CSV
            </button>
            <button
              onClick={() => {
                setUsuarioSeleccionado(null);
                setModoCrear(true);
              }}
              className="flex items-center gap-1 bg-[#3BAE3D] text-white px-3 py-1 rounded hover:border-[#3BAE3D] hover:bg-white hover:text-[#3BAE3D] hover:border-1"
            >
              <Plus size={16} />
              Añadir Usuario
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-5 w-full">
          <div className="w-full overflow-auto">
            <TablaUsuarios
              usuarios={usuariosFiltrados}
              isLoading={isLoading}
              isError={isError}
              usuarioSeleccionado={usuarioSeleccionado}
              setUsuarioSeleccionado={setUsuarioSeleccionado}
              setModoCrear={setModoCrear}
            />
          </div>

          <div className="w-full">
            <FormularioUsuario
              usuario={usuarioSeleccionado}
              modoCrear={modoCrear}
              setModoCrear={setModoCrear}
              setUsuarioSeleccionado={setUsuarioSeleccionado}
              refetchUsuarios={refetch}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
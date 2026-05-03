import { useState, useMemo } from "react";
import Layout from "../../../components/Layout";
import { useObtenerUsuariosQuery } from "../../../redux/api/userApi";
import { useObtenerMiCompaniaQuery } from "../../../redux/api/userApi";
import { useObtenerEmpresasQuery, useObtenerLocacionesQuery } from "../../../redux/api/empresasApi";
import { Download, Plus, Users, Shield, UserCheck, User, UserCircle } from "lucide-react";
import TablaUsuarios from "./TablaUsuarios";
import FormularioUsuario from "./FormularioUsuario";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Usuarios() {
  const { data: usuarios = [], isLoading, isError, refetch } = useObtenerUsuariosQuery();
  const { data: compania } = useObtenerMiCompaniaQuery();
  const { data: empresas = [] } = useObtenerEmpresasQuery();
  const { data: locaciones = [] } = useObtenerLocacionesQuery();
  const [filtro, setFiltro] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [modoCrear, setModoCrear] = useState(false);
  const [modalFormularioAbierto, setModalFormularioAbierto] = useState(false);

  const empresasMap = useMemo(
    () =>
      empresas.reduce((acc, empresa) => {
        acc[empresa.id] = empresa;
        return acc;
      }, {}),
    [empresas]
  );

  const usuariosEnriquecidos = useMemo(() => {
    return usuarios.map((usuario) => {
      if (usuario.rol !== "supervisor") {
        return {
          ...usuario,
          cobertura_supervision: "No aplica",
          supervision_locaciones: [],
          supervision_empresas: [],
        };
      }

      const locacionesAsignadas = locaciones.filter(
        (locacion) => locacion.supervisor_id === usuario.id
      );

      if (!locacionesAsignadas.length) {
        return {
          ...usuario,
          cobertura_supervision: "Sin locaciones asignadas",
          supervision_locaciones: [],
          supervision_empresas: [],
        };
      }

      const nombresLocaciones = locacionesAsignadas.map((locacion) => locacion.nombre);
      const nombresEmpresas = [
        ...new Set(
          locacionesAsignadas
            .map((locacion) => empresasMap[locacion.empresa_id]?.nombre)
            .filter(Boolean)
        ),
      ];

      return {
        ...usuario,
        cobertura_supervision: `${nombresLocaciones.length} locación${nombresLocaciones.length === 1 ? "" : "es"}`,
        supervision_locaciones: nombresLocaciones,
        supervision_empresas: nombresEmpresas,
      };
    });
  }, [usuarios, locaciones, empresasMap]);

  const usuariosFiltrados = useMemo(() => {
    return usuariosEnriquecidos.filter(
      (u) =>
        u.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
        (u.identificacion || "").toLowerCase().includes(filtro.toLowerCase()) ||
        u.email.toLowerCase().includes(filtro.toLowerCase()) ||
        (u.cobertura_supervision || "").toLowerCase().includes(filtro.toLowerCase())
    );
  }, [filtro, usuariosEnriquecidos]);

  const abrirCrearUsuario = () => {
    setUsuarioSeleccionado(null);
    setModoCrear(true);
    setModalFormularioAbierto(true);
  };

  const abrirEditarUsuario = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setModoCrear(false);
    setModalFormularioAbierto(true);
  };

  const cerrarFormularioUsuario = () => {
    setModoCrear(false);
    setModalFormularioAbierto(false);
    setUsuarioSeleccionado(null);
  };

  const TarjetaResumen = ({ titulo, valor, icono, principal = false }) => {
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
  };

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
      <div className="p-4 md:p-6 bg-[#f4f8fb] min-h-full">
        <div className="relative overflow-hidden mb-6 rounded-[28px] bg-white border border-[#e6f0f8] shadow-xl shadow-[#0A2A47]/5 p-5 md:p-6">
          <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(circle_at_top_right,_rgba(59,174,61,0.12),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(10,42,71,0.08),_transparent_35%)]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#0A2A47] tracking-tight">Usuarios</h1>
              <p className="mt-2 text-sm text-gray-500 max-w-xl">
                Gestiona roles, permisos y acceso operativo de tu equipo.
              </p>
            </div>
            <button
              onClick={abrirCrearUsuario}
              className="inline-flex items-center justify-center gap-2 bg-[#3BAE3D] text-white px-4 py-3 rounded-2xl font-semibold shadow-lg shadow-[#3BAE3D]/20 hover:bg-[#2f9631] transition"
            >
              <Plus size={18} />
              Añadir Usuario
            </button>
          </div>
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          <TarjetaResumen
            titulo="Total usuarios"
            valor={usuariosEnriquecidos.length}
            icono={<Users size={20} />}
            principal
          />
          <TarjetaResumen
            titulo="Administradores"
            valor={usuariosEnriquecidos.filter(u => u.rol === 'admin').length}
            icono={<Shield size={16} />}
          />
          <TarjetaResumen
            titulo="Supervisores"
            valor={usuariosEnriquecidos.filter(u => u.rol === 'supervisor').length}
            icono={<UserCheck size={16} />}
          />
          <TarjetaResumen
            titulo="Empleados"
            valor={usuariosEnriquecidos.filter(u => u.rol === 'empleado').length}
            icono={<User size={16} />}
          />
          <TarjetaResumen
            titulo="Clientes"
            valor={usuariosEnriquecidos.filter(u => u.rol === 'cliente').length}
            icono={<UserCircle size={16} />}
          />
        </div>

        <div className="bg-white border border-[#e6f0f8] rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <input
              type="text"
              placeholder="Buscar por nombre, identificación o email"
              className="w-full lg:w-2/5 px-4 py-3 bg-[#f8fbfd] text-[#333333] border border-[#dbe8f2] rounded-xl outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10 placeholder:text-gray-400"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={exportarPDF}
                className="flex items-center justify-center gap-2 bg-[#071f35] text-white px-4 py-3 rounded-xl font-semibold shadow-sm hover:bg-white hover:text-[#071f35] hover:ring-1 hover:ring-[#071f35] transition"
              >
                <Download size={16} />
                Exportar PDF
              </button>
              <button
                onClick={exportarCSV}
                className="flex items-center justify-center gap-2 bg-white text-[#071f35] px-4 py-3 rounded-xl font-semibold border border-[#dbe8f2] hover:border-[#071f35] transition"
              >
                <Download size={16} />
                Exportar CSV
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 w-full">
          <div className="w-full overflow-auto rounded-2xl shadow-sm">
            <TablaUsuarios
              usuarios={usuariosFiltrados}
              isLoading={isLoading}
              isError={isError}
              usuarioSeleccionado={usuarioSeleccionado}
              setUsuarioSeleccionado={abrirEditarUsuario}
              setModoCrear={setModoCrear}
            />
          </div>
        </div>
      </div>
      {modalFormularioAbierto && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-3xl bg-white border border-[#e6f0f8] shadow-2xl p-5 md:p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#e6f0f8]">
              <h2 className="text-2xl font-extrabold text-[#0A2A47] tracking-tight">
                {modoCrear ? "Añadir Usuario" : "Editar Usuario"}
              </h2>
              <button
                type="button"
                onClick={cerrarFormularioUsuario}
                className="w-9 h-9 rounded-xl bg-[#f4f8fb] text-[#0A2A47] hover:bg-[#e6f0f8] font-bold transition"
              >
                ×
              </button>
            </div>

            <FormularioUsuario
              usuario={usuarioSeleccionado}
              modoCrear={modoCrear}
              setModoCrear={setModoCrear}
              setUsuarioSeleccionado={setUsuarioSeleccionado}
              refetchUsuarios={refetch}
            />
          </div>
        </div>
      )}
    </Layout>
  );
}

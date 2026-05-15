import logo from '../assets/imgs/Logo_fondo_azul.png';
import { X, Home, Users, Building2, List as ListIcon, ClipboardList, FileBarChart2, LogOut, Megaphone, Menu, User2Icon, QrCodeIcon, CheckCheckIcon, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { logoutUsuario } from '../redux/slices/usuariosSlice';
import { borrarHistorialId, borrarListaActiva } from '../redux/slices/listasSlice';
import NotificacionesBell from './NotificacionesBell';
import EnviarAlertaModal from './EnviarAlertaModal';

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showEnviarAlerta, setShowEnviarAlerta] = useState(false);
  const usuario = useSelector((state) => state.usuarios.usuarioLogueado);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch()

  useEffect(() => {
    if (sidebarOpen) document.body.style.overflow = "";
    else document.body.style.overflow = "auto";
  }, [sidebarOpen]);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    dispatch(borrarListaActiva());
    dispatch(borrarHistorialId());
    dispatch(logoutUsuario());
    dispatch(logout());
  };

  const navItemsAdmin = [
    { label: "Dashboard", icon: <Home size={22} />, path: "/" },
    { label: "Usuarios", icon: <Users size={22} />, path: "/usuarios" },
    { label: "Empresas", icon: <Building2 size={22} />, path: "/empresas" },
    { label: "Actividades", icon: <ListIcon size={22} />, path: "/actividades" },
    { label: "Listas", icon: <ClipboardList size={22} />, path: "/listas" },
    { label: "Incidentes", icon: <TriangleAlert size={22} />, path: "/incidentes" },
    { label: "Feedback QR", icon: <QrCodeIcon size={22} />, path: "/feedback-qr" },
    { label: "Feedback", icon: <CheckCheckIcon size={22} />, path: "/feedback-reporte" },
    { label: "Reportes", icon: <FileBarChart2 size={22} />, path: "/reportes" },
  ];

  const navItemsSupervisor = [
    { label: "Dashboard", icon: <Home size={22} />, path: "/" },
    { label: "Actividades", icon: <ListIcon size={22} />, path: "/actividades" },
    { label: "Listas", icon: <ClipboardList size={22} />, path: "/listas" },
    { label: "Incidentes", icon: <TriangleAlert size={22} />, path: "/incidentes" },
    { label: "Reportes", icon: <FileBarChart2 size={22} />, path: "/reportes" },
  ];

  const navItemsCliente = [
    { label: "Portal", icon: <Home size={22} />, path: "/" },
  ];

  const [navItems, setNavItems] = useState(navItemsCliente);
  useEffect(() => {
    if (!usuario) return;

    switch (usuario.rol) {
      case "admin":
        setNavItems(navItemsAdmin);
        break;
      case "supervisor":
        setNavItems(navItemsSupervisor);
        break;
      case "cliente":
        setNavItems(navItemsCliente);
        break;
      default:
        setNavItems(navItemsCliente);
        break;
    }
  }, [usuario]);

  const isActivePath = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const userInitial = usuario?.nombre?.trim()?.charAt(0)?.toUpperCase() || "T";
  const userRoleLabel = usuario?.rol ? usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1) : "Usuario";
  const canSendAlertas = ["admin", "supervisor"].includes((usuario?.rol || "").toLowerCase());

  const navigateSidebar = (path, { closeMobile = false } = {}) => {
    if (closeMobile) {
      setSidebarOpen(false);
    }

    if (location.pathname === path) {
      return;
    }

    window.location.assign(path);
  };

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-[#071f35] h-full rounded-r-[28px] border-r border-white/10 shadow-2xl shadow-[#071f35]/25 overflow-visible relative z-20">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="relative px-5 pt-6 pb-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,174,61,0.18),_transparent_36%)]" />
            <div className="relative flex items-center gap-3">
              <div className="bg-white/10 border border-white/10 rounded-2xl px-3 py-2 shadow-inner">
                <img src={logo} alt="Logo" className="h-8 object-contain" />
              </div>
              <div>
                <p className="text-white font-bold leading-tight">TYDY</p>
                <p className="text-xs text-white/55">Control operativo</p>
              </div>
            </div>
          </div>

          <div className="px-4 mb-4">
            <div className="bg-white/7 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-[#3BAE3D]/20 text-[#b7f7ba] flex items-center justify-center font-bold">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{usuario?.nombre || "TYDY User"}</p>
                <p className="text-xs text-white/50">{userRoleLabel}</p>
              </div>
              {usuario?.rol !== "cliente" && <NotificacionesBell placement="right-start" />}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
            <nav className="flex flex-col gap-1.5">
              {navItems.map((item) => {
                const active = isActivePath(item.path);
                return (
                <button
                  key={item.label}
                  type="button"
                  className={`group relative flex items-center gap-3 text-left rounded-2xl px-3.5 py-3 transition-all duration-200 ${
                    active
                      ? "bg-white text-[#0A2A47] shadow-lg shadow-black/10"
                      : "text-white/75 hover:text-white hover:bg-white/10"
                  }`}
                  onClick={() => navigateSidebar(item.path)}
                >
                  <span className={`${active ? "text-[#3BAE3D]" : "text-white/70 group-hover:text-[#3BAE3D]"}`}>
                    {item.icon}
                  </span>
                  <span className="text-sm font-semibold">{item.label}</span>
                  {active && <span className="absolute right-3 w-2 h-2 rounded-full bg-[#3BAE3D]" />}
                </button>
              );
            })}
          </nav>
          </div>
        </div>

        <div className="shrink-0 p-4 border-t border-white/10 bg-white/[0.03]">
          {canSendAlertas && (
            <button
              type="button"
              className="mb-2 w-full flex items-center gap-3 text-left rounded-2xl px-3.5 py-3 text-white/85 bg-[#3BAE3D]/18 border border-[#3BAE3D]/25 hover:bg-[#3BAE3D]/28 transition"
              onClick={() => setShowEnviarAlerta(true)}
            >
              <Megaphone size={21} />
              <span className="text-sm font-semibold">Enviar alerta</span>
            </button>
          )}
          <button
            type="button"
            className={`w-full flex items-center gap-3 text-left rounded-2xl px-3.5 py-3 mb-2 transition ${
              isActivePath('/cuenta')
                ? "bg-white text-[#0A2A47]"
                : "text-white/75 hover:text-white hover:bg-white/10"
            }`}
            onClick={() => navigateSidebar('/cuenta')}
          >
            <User2Icon size={21} />
            <span className="text-sm font-semibold">Cuenta</span>
          </button>
          <button
            type="button"
            className="w-full flex items-center gap-3 text-left rounded-2xl px-3.5 py-3 text-white/75 hover:text-white hover:bg-red-500/15 transition"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <LogOut size={21} />
            <span className="text-sm font-semibold">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Sidebar Móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 bg-[#071f35] h-full flex flex-col z-50 rounded-r-[28px] border-r border-white/10 shadow-2xl overflow-visible">
            <button type="button" className="absolute top-4 right-4 text-white" onClick={() => setSidebarOpen(false)}>
              <X size={24} />
            </button>
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="relative p-5 pt-7 flex items-center gap-3">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,174,61,0.18),_transparent_38%)]" />
                <div className="relative bg-white/10 border border-white/10 rounded-2xl px-3 py-2">
                  {sidebarOpen ? <img src={logo} alt="Logo" className="h-8 object-contain" /> : <Menu size={24} color='white'/>}
                </div>
                <div className="relative">
                  <p className="text-white font-bold leading-tight">TYDY</p>
                  <p className="text-xs text-white/55">Control operativo</p>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <nav className="flex flex-col gap-4">
                  {navItems.map((item) => {
                    const active = isActivePath(item.path);
                    return (
                    <button
                      key={item.label}
                      type="button"
                      className={`relative flex items-center gap-3 text-left rounded-2xl px-3.5 py-3 transition ${
                          active
                            ? "bg-white text-[#0A2A47]"
                            : "text-white/75 hover:text-white hover:bg-white/10"
                      }`}
                      onClick={() => {
                        navigateSidebar(item.path, { closeMobile: true });
                      }}
                    >
                      <span className={active ? "text-[#3BAE3D]" : "text-white/70"}>{item.icon}</span>
                      <span className="text-sm font-semibold">{item.label}</span>
                      {active && <span className="absolute right-3 w-2 h-2 rounded-full bg-[#3BAE3D]" />}
                    </button>
                  );
                })}
              </nav>
            </div>
            </div>
            <div className="shrink-0 p-4">
              {canSendAlertas && (
                <button
                  type="button"
                  className="w-full flex items-center gap-3 text-left rounded-2xl px-3.5 py-3 mb-2 text-white/85 bg-[#3BAE3D]/18 border border-[#3BAE3D]/25 hover:bg-[#3BAE3D]/28 transition"
                  onClick={() => {
                    setShowEnviarAlerta(true);
                    setSidebarOpen(false);
                  }}
                >
                  <Megaphone size={22} />
                  <span className="text-sm font-semibold">Enviar alerta</span>
                </button>
              )}
              <button
                type="button"
                className="w-full flex items-center gap-3 text-left rounded-2xl px-3.5 py-3 mb-2 text-white/75 hover:text-white hover:bg-white/10 transition"
                onClick={() => navigateSidebar('/cuenta', { closeMobile: true })}
              >
                <User2Icon size={22} />
                <span className="text-sm font-semibold">Cuenta</span>
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-3 text-left rounded-2xl px-3.5 py-3 text-white/75 hover:text-white hover:bg-red-500/15 transition"
                onClick={() => setShowLogoutConfirm(true)}
              >
                <LogOut size={22} />
                <span className="text-sm font-semibold">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <EnviarAlertaModal
        isOpen={showEnviarAlerta}
        onClose={() => setShowEnviarAlerta(false)}
      />

      {/* Dialogo de confirmación */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm text-center border border-[#e6f0f8]">
            <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
              <LogOut size={24} />
            </div>
            <p className="text-[#0A2A47] text-lg font-bold">¿Cerrar sesión?</p>
            <p className="mt-2 mb-6 text-sm text-gray-500">
              Saldrás de tu cuenta y tendrás que iniciar sesión nuevamente para continuar.
            </p>
            <div className="flex justify-center gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border border-[#dbe8f2] text-[#0A2A47] hover:bg-[#0A2A47] hover:text-white transition"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                Cancelar
              </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-[#0A2A47] text-white hover:bg-red-500 transition"
                  onClick={handleLogout}
                >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

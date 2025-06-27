import logo from '../assets/imgs/Logo_fondo_azul.png';
import { X, Home, Users, Building2, List as ListIcon, ClipboardList, FileBarChart2, LogOut, Menu, User2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { logoutUsuario } from '../redux/slices/usuariosSlice';

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const usuario = useSelector((state) => state.usuarios.usuarioLogueado);
  const navigate = useNavigate();
  const dispatch = useDispatch()

  useEffect(() => {
    if (sidebarOpen) document.body.style.overflow = "";
    else document.body.style.overflow = "auto";
  }, [sidebarOpen]);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    dispatch(logoutUsuario());
    dispatch(logout());
  };

  const navItemsAdmin = [
    { label: "Dashboard", icon: <Home size={22} />, path: "/" },
    { label: "Usuarios", icon: <Users size={22} />, path: "/usuarios" },
    { label: "Empresas", icon: <Building2 size={22} />, path: "/empresas" },
    { label: "Actividades", icon: <ListIcon size={22} />, path: "/actividades" },
    { label: "Listas", icon: <ClipboardList size={22} />, path: "/listas" },
    { label: "Reportes", icon: <FileBarChart2 size={22} />, path: "/reportes" },
  ];

  const navItemsSupervisor = [
    { label: "Dashboard", icon: <Home size={22} />, path: "/" },
    { label: "Actividades", icon: <ListIcon size={22} />, path: "/actividades" },
    { label: "Listas", icon: <ClipboardList size={22} />, path: "/listas" },
    { label: "Reportes", icon: <FileBarChart2 size={22} />, path: "/reportes" },
  ];

  const navItemsCliente = [
    { label: "Dashboard", icon: <Home size={22} />, path: "/" },
    { label: "Reportes", icon: <FileBarChart2 size={22} />, path: "/reportes" },
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

  return (
    <>
      {/* Sidebar Desktop */}
      <div className={`hidden md:flex md:flex-col md:w-52 bg-[#0A2A47] h-full justify-between rounded-r-2xl`}>
        <div>
          <div className="p-4 flex justify-center mt-3">
            <img src={logo} alt="Logo" className="h-9" />
          </div>
          <nav className="flex flex-col gap-4 p-4">
            {navItems.map((item) => (
              <button
                key={item.label}
                className="flex items-center gap-3 text-left text-white hover:text-[#3BAE3D] mb-3"
                onClick={() => navigate(item.path)}
              >
                {item.icon}
                <span className="text-lg">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4">
          <button
            className="flex items-center gap-3 text-left text-white hover:text-[#3BAE3D] mb-6"
            onClick={() => navigate('/cuenta')}
          >
            <User2Icon size={22} />
            <span className="text-lg">Cuenta</span>
          </button>
          <button
            className="flex items-center gap-3 text-left text-white hover:text-red-500"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <LogOut size={22} />
            <span className="text-lg">Cerrar sesión</span>
          </button>
        </div>
      </div>

      {/* Sidebar Móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 bg-[#0A2A47] h-full flex flex-col justify-between z-50 rounded-r-2xl">
            <button className="absolute top-4 right-4 text-white" onClick={() => setSidebarOpen(false)}>
              <X size={24} />
            </button>
            <div>
              <div className="p-4 flex justify-center">
                {sidebarOpen ? <img src={logo} alt="Logo" className="h-8 mt-3 mb-1" /> : <Menu size={24} color='white'/>}
              </div>
              <nav className="flex flex-col gap-4 p-4">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    className="flex items-center gap-3 text-left text-white hover:text-[#3BAE3D] mb-2"
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }}
                  >
                    {item.icon}
                    <span className="text-lg">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
            <div className="p-4">
              <button
                className="flex items-center gap-3 text-left text-white hover:text-[#3BAE3D] mb-6"
                onClick={() => navigate('/cuenta')}
              >
                <User2Icon size={22} />
                <span className="text-lg">Cuenta</span>
              </button>
              <button
                className="flex items-center gap-3 text-left text-white hover:text-red-500"
                onClick={() => setShowLogoutConfirm(true)}
              >
                <LogOut size={22} />
                <span className="text-lg">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogo de confirmación */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white p-6 rounded-xl shadow-lg w-[90%] max-w-sm text-center border border-[#0A2A47]">
            <p className="mb-6 text-[#0A2A47] text-lg font-semibold">¿Estás seguro de cerrar sesión?</p>
            <div className="flex justify-around">
              <button
                className="px-4 py-2 border border-[#0A2A47] text-[#0A2A47] rounded hover:bg-[#0A2A47] hover:text-white transition"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 border border-[#0A2A47] text-[#0A2A47] bg-white rounded hover:bg-[#0A2A47] hover:text-white transition"
                onClick={handleLogout}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
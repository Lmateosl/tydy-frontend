import logo from "../assets/imgs/Logo_fondo_azul.png";
import { Menu, LogOut } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useState } from "react";
import { logoutUsuario } from "../redux/slices/usuariosSlice";
import { logout } from "../redux/slices/authSlice";
import { borrarHistorialId, borrarListaActiva } from "../redux/slices/listasSlice";

export default function Header({ setSidebarOpen, sidebarOpen }) {
  const usuarioLogueado = useSelector((state) => state.usuarios.usuarioLogueado);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dispatch = useDispatch();

  const handleLogout = () => {
      setShowLogoutConfirm(false);
      dispatch(borrarListaActiva());
      dispatch(borrarHistorialId());
      dispatch(logoutUsuario());
      dispatch(logout());
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full h-[64px] flex items-center justify-between px-4 bg-[#071f35]/95 backdrop-blur-md text-white shadow-lg shadow-black/20 z-50 border-b border-white/10">
        
        {/* Botón de abrir sidebar solo en móvil */}
        {usuarioLogueado?.rol !== "empleado" ?
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition"
            onClick={() => setSidebarOpen(true)}
          >
            {sidebarOpen ? '' : <Menu size={20} />}
          </button>
          :
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-[#3BAE3D]/20 text-[#b7f7ba] border border-[#3BAE3D]/30 hover:bg-[#3BAE3D]/30 transition"
            onClick={() => setShowLogoutConfirm(true)}
          >
            {sidebarOpen ? '' : <LogOut size={20} />}
          </button>
        }

        {/* Logo */}
        <div className="mx-auto md:mx-0 flex items-center gap-2 bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl shadow-inner">
          <img src={logo} alt="Logo" className="h-6 w-auto object-contain" />
          <span className="hidden sm:block text-sm font-semibold tracking-wide">TYDY</span>
        </div>

        <div className="w-6 md:hidden" /> {/* Espacio para que el logo quede centrado */}
      </header>

      {/* Modal para deslogear en cuenta empleado */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm text-center border border-[#e6f0f8]">
            <p className="mb-6 text-[#0A2A47] text-lg font-semibold">¿Estás seguro de cerrar sesión?</p>
            <div className="flex justify-center gap-3">
              <button
                className="px-4 py-2 rounded-xl border border-[#dbe8f2] text-[#0A2A47] hover:bg-[#0A2A47] hover:text-white transition"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-[#0A2A47] text-white hover:bg-[#3BAE3D] transition"
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

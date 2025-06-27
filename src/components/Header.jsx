import logo from "../assets/imgs/Logo_fondo_azul.png";
import { Menu, LogOut } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useState } from "react";
import { logoutUsuario } from "../redux/slices/usuariosSlice";
import { logout } from "../redux/slices/authSlice";

export default function Header({ setSidebarOpen, sidebarOpen }) {
  const usuarioLogueado = useSelector((state) => state.usuarios.usuarioLogueado);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dispatch = useDispatch();

  const handleLogout = () => {
      setShowLogoutConfirm(false);
      dispatch(logoutUsuario());
      dispatch(logout());
  };

  return (
    <header className="flex items-center justify-between bg-[#0A2A47] p-4 text-white shadow">
      
      {/* Botón de abrir sidebar solo en móvil */}
      {usuarioLogueado?.rol !== "empleado" ?
        <button
          className="md:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          {sidebarOpen ? '' : <Menu size={24} />}
        </button>
        :
        <button
          className="md:hidden"
          onClick={() => setShowLogoutConfirm(true)}
        >
          {sidebarOpen ? '' : <LogOut className="text-[#3BAE3D]" size={24} />}
        </button>
      }

      {/* Logo */}
      <img src={logo} alt="Logo" className="mx-auto md:mx-0 w-[70px]" />

      <div className="w-6 md:hidden" /> {/* Espacio para que el logo quede centrado */}


      {/* Modal para deslogear en cuenta empleado */}
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
    </header>
  );
}
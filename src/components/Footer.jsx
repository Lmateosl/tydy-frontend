import { useLocation, useNavigate } from "react-router-dom";
import { MapPin, Home, User } from "lucide-react";

export default function Footer() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;

  const isActive = (path) => currentPath === path || currentPath.startsWith(`${path}/`);

  const getButtonClass = (path) =>
    `flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-2xl transition-all duration-200 ${
      isActive(path)
        ? "text-white bg-white/10 shadow-inner"
        : "text-white/60 hover:text-white hover:bg-white/10"
    }`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3">
      <div className="flex items-center justify-between bg-[#071f35]/95 backdrop-blur-md border border-white/10 shadow-2xl shadow-black/20 rounded-3xl px-2 py-2 h-[70px]">
        <button className={getButtonClass("/lugar")} onClick={() => navigate("/lugar")}>
          <MapPin size={22} className={isActive("/lugar") ? "text-[#3BAE3D]" : ""} />
          <span className="text-[11px] font-medium">Lugar</span>
          {isActive("/lugar") && <span className="w-1.5 h-1.5 rounded-full bg-[#3BAE3D]" />}
        </button>

        <button className={getButtonClass("/main")} onClick={() => navigate("/main")}>
          <Home size={22} className={isActive("/main") ? "text-[#3BAE3D]" : ""} />
          <span className="text-[11px] font-medium">Inicio</span>
          {isActive("/main") && <span className="w-1.5 h-1.5 rounded-full bg-[#3BAE3D]" />}
        </button>

        <button className={getButtonClass("/cuenta-empleado")} onClick={() => navigate("/cuenta-empleado")}>
          <User size={22} className={isActive("/cuenta-empleado") ? "text-[#3BAE3D]" : ""} />
          <span className="text-[11px] font-medium">Cuenta</span>
          {isActive("/cuenta-empleado") && <span className="w-1.5 h-1.5 rounded-full bg-[#3BAE3D]" />}
        </button>
      </div>
    </div>
  );
}
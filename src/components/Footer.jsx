import { useLocation, useNavigate } from "react-router-dom";
import { MapPin, Home, User } from "lucide-react";

export default function Footer() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;

  const getButtonClass = (path) =>
    `flex-1 flex flex-col items-center justify-center py-4 ${
      currentPath === path ? "text-white" : "text-[#3BAE3D]"
    }`;

  return (
    <div className="fixed bottom-0 left-0 right-0 flex bg-[#0A2A47] shadow z-50 w-full h-[7vh]">
      <button className={getButtonClass("/lugar")} onClick={() => navigate("/lugar")}>
        <MapPin size={24} />
      </button>
      <button className={getButtonClass("/main")} onClick={() => navigate("/main")}>
        <Home size={24} />
      </button>
      <button className={getButtonClass("/cuenta-empleado")} onClick={() => navigate("/cuenta-empleado")}>
        <User size={24} />
      </button>
    </div>
  );
}
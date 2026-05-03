import { useState } from "react";
import { useSelector } from "react-redux";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const usuarioLogueado = useSelector((state) => state.usuarios.usuarioLogueado);
  const isEmpleado = usuarioLogueado?.rol === "empleado";

  return (
    <div className="flex h-screen w-screen overflow-auto">
      
      {/* Sidebar */}
      {usuarioLogueado?.rol !== "empleado"  &&
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      }

      <div className="flex flex-col flex-1 w-full overflow-auto">
        
        {/* Header */}
        <div className="md:hidden">
          <Header setSidebarOpen={setSidebarOpen} sidebarOpen={sidebarOpen}/>
        </div>

        {/* Contenido */}
        <main className={`flex-1 p-4 !overflow-auto bg-[#f4f8fb] max-w-full md:max-h-fit md:mt-1 md:mb-1 ${isEmpleado ? "mt-0 mb-[96px]" : "max-h-[84vh] mt-[6vh] mb-[10vh]"}`}>
          {children}
        </main>

        {isEmpleado && <Footer />}
        
      </div>
    </div>
  );
}

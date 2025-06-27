import { useState } from "react";
import { useSelector } from "react-redux";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const usuarioLogueado = useSelector((state) => state.usuarios.usuarioLogueado);

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
        <main className="flex-1 p-4 !overflow-auto bg-white max-w-full max-h-[87vh] md:max-h-fit md:mt-1 mt-[6vh] mb-[7vh] md:mb-1">
          {children}
        </main>

        {usuarioLogueado?.rol === "empleado" && <Footer />}
        
      </div>
    </div>
  );
}
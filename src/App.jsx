import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./auth/Login";
import Dashboard from "./views/dashboard/dashboard/Dashboard";
import Usuarios from "./views/dashboard/usuarios/Usuarios";
import Empresas from "./views/dashboard/empresas/Empresas";
import Actividades from "./views/dashboard/actividades/Actividades";
import Listas from "./views/dashboard/listas/Listas";
import Cuenta from "./views/dashboard/cuenta/Cuenta";
import Main from "./views/empleados/Main";
import CeuntaEmp from "./views/empleados/CuentaEmp";
import Lugar from "./views/empleados/Lugar";
import Reportes from "./views/dashboard/reportes/Reportes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSelector } from "react-redux";

function App() {
  const token = useSelector((state) => state.auth.token);
  const usuario = useSelector((state) => state.usuarios.usuarioLogueado);

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta de Login siempre accesible */}
        <Route path="/login" element={token ? <Navigate to={usuario?.rol === "empleado" ? "/main" : "/"} /> : <Login />} />

        {/* Rutas solo para admin y supervisor */}
        {token && usuario?.rol !== "empleado" && (
          <>
            <Route path="/" element={<Dashboard />} />
            {(usuario?.rol === "admin") && (
              <>
                <Route path="/usuarios" element={<Usuarios />} />
                <Route path="/empresas" element={<Empresas />} />
              </>
            )}
            {(usuario?.rol === "admin" || usuario?.rol === "supervisor") && (
              <>
                <Route path="/actividades" element={<Actividades />} />
                <Route path="/listas" element={<Listas />} />
              </>
            )}
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/cuenta" element={<Cuenta />} />
          </>
        )}

        {/* Rutas solo para empleados */}
        {token && usuario?.rol === "empleado" && (
          <>
            <Route path="/main" element={<Main />} />
            <Route path="/lugar" element={<Lugar />} />
            <Route path="/cuenta-empleado" element={<CeuntaEmp />} />
          </>
        )}

        {/* Cualquier ruta no encontrada */}
        <Route path="*" element={<Navigate to={token ? (usuario?.rol === "empleado" ? "/main" : "/") : "/login"} />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;

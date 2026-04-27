import { useState } from 'react';
import { useLoginMutation } from '../redux/api/authApi';
import { toast } from 'react-toastify';
import logo from '../assets/imgs/Logo_blanco_trasparente.png';
import { useDispatch } from 'react-redux';
import { setToken } from '../redux/slices/authSlice';
import { useLazyObtenerPerfilQuery } from '../redux/api/userApi';
import { setUsuarioLogueado } from '../redux/slices/usuariosSlice';

export default function Login() {
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const [triggerObtenerPerfil] = useLazyObtenerPerfilQuery();

  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !contrasena) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', contrasena);

      const response = await login(formData).unwrap();
      
      dispatch(setToken(response.access_token));

      const perfilResponse = await triggerObtenerPerfil().unwrap();

      dispatch(setUsuarioLogueado(perfilResponse));
      
      toast.success('Login exitoso');
    } catch (error) {
      console.log(error);
      const msg = error?.data?.detail?.[0]?.msg || error?.detail || 'Error al iniciar sesión';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#f4f8fb] flex items-center justify-center p-4 md:p-8 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,174,61,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(10,42,71,0.18),_transparent_35%)]" />
      <div className="relative w-full max-w-6xl min-h-[680px] bg-white rounded-[32px] shadow-2xl border border-[#e6f0f8] overflow-hidden grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden lg:flex relative bg-[#0A2A47] text-white p-10 xl:p-14 flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,_#3BAE3D,_transparent_25%),radial-gradient(circle_at_80%_70%,_#89e3f0,_transparent_28%)]" />
          <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full border border-white/15" />
          <div className="absolute -left-16 bottom-20 w-52 h-52 rounded-full border border-white/10" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 bg-white/10 border border-white/15 rounded-full px-4 py-2 backdrop-blur-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3BAE3D]" />
              <span className="text-sm font-medium text-white/90">Operación verificada en tiempo real</span>
            </div>

            <h1 className="mt-10 text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
              Controla cada servicio con evidencia, ubicación y seguimiento.
            </h1>
            <p className="mt-5 text-white/75 text-lg max-w-xl leading-relaxed">
              TYDY convierte actividades de campo en registros verificables para equipos, supervisores y clientes.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-1 gap-4 max-w-xl mt-2">
            <div className="bg-white/10 border border-white/15 rounded-2xl p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/70">Actividades verificadas</p>
                <span className="text-xs bg-[#3BAE3D]/20 text-[#b7f7ba] px-3 py-1 rounded-full">Hoy</span>
              </div>
              <p className="text-4xl font-bold mt-3">128</p>
              <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-[82%] bg-[#3BAE3D] rounded-full" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 border border-white/15 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-sm text-white/70">Evidencias</p>
                <p className="text-2xl font-bold mt-2">94%</p>
              </div>
              <div className="bg-white/10 border border-white/15 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-sm text-white/70">Incidentes abiertos</p>
                <p className="text-2xl font-bold mt-2">6</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-white">
          <div className="w-full max-w-md">
            <div className="flex justify-center mb-8">
              <div className="bg-transparent rounded-2xl px-6 py-4 shadow-lg shadow-[#0A2A47]/20">
                <img src={logo} alt="TYDY Logo" className="h-12 w-auto object-contain" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#0A2A47]">Bienvenido de nuevo</h2>
              <p className="text-gray-500 mt-2">Ingresa para continuar con tu operación.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#0A2A47] mb-2">Email</label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-[#f8fbfd] text-[#333333] border border-[#dbe8f2] rounded-xl outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0A2A47] mb-2">Contraseña</label>
                <input
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  className="w-full px-4 py-3 bg-[#f8fbfd] text-[#333333] border border-[#dbe8f2] rounded-xl outline-none transition focus:border-[#3BAE3D] focus:ring-4 focus:ring-[#3BAE3D]/10 placeholder:text-gray-400"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#0A2A47] text-white rounded-xl font-semibold shadow-lg shadow-[#0A2A47]/20 transition hover:bg-[#3BAE3D] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Ingresando...' : 'Entrar a TYDY'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-8">
              Plataforma de verificación operativa y seguimiento de servicios.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

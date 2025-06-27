import { useState } from 'react';
import { useLoginMutation } from '../redux/api/authApi';
import { toast } from 'react-toastify';
import logo from '../assets/imgs/Logo_blanco_trasparente.png';
import imagenLogin from '../assets/imgs/imagenLogin1.png';
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
    <div className="h-screen w-screen flex bg-[#0A2A47]">
      {/* Imagen solo en pantallas grandes */}
      <div
        className="hidden md:block w-[60%] bg-cover bg-center"
        style={{
          backgroundImage: `url(${imagenLogin})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center'
        }}
      ></div>

      {/* Formulario */}
      <div className="w-full md:w-[40%] bg-white flex justify-center items-center">
        <div className="relative w-[90%] max-w-sm border border-[#0A2A47] rounded-[20px] p-6">
          {/* Logo sobrepuesto */}
          <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-white px-4 w-2/5">
            <img src={logo} alt="Logo" className="w-full" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
            <h2 className="text-center text-lg font-semibold text-[#0A2A47] mb-4">
              Inicia sesión en tu cuenta
            </h2>

            <input
              type="text"
              placeholder="Ingresa tu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-transparent text-[#333333] border-b-1 border-[#0A2A47] rounded placeholder-[#333333]"
            />
            <input
              type="password"
              placeholder="Ingresa tu contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="w-full px-4 py-2 mb-2 bg-transparent text-[#333333] border-b-1 border-[#0A2A47] rounded placeholder-[#333333]"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 mt-2 mb-4 bg-[#0A2A47] text-white rounded hover:bg-[#3BAE3D]"
            >
              {isLoading ? 'Cargando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

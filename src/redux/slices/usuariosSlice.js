import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  usuarios: [],
  usuarioLogueado: JSON.parse(localStorage.getItem("usuarioLogueado")) || null, // Aquí guardamos el usuario logueado
};

const usuariosSlice = createSlice({
  name: 'usuarios',
  initialState,
  reducers: {
    setUsuarios: (state, action) => {
      state.usuarios = action.payload;
    },
    setUsuarioLogueado: (state, action) => {
      state.usuarioLogueado = action.payload;
      localStorage.setItem("usuarioLogueado", JSON.stringify(action.payload));
    },
    logoutUsuario: (state) => {
      state.usuarioLogueado = null;
      localStorage.removeItem("usuarioLogueado");
    },
  },
});

export const { setUsuarios, setUsuarioLogueado, logoutUsuario } = usuariosSlice.actions;

export default usuariosSlice.reducer;

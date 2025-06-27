import { createSlice } from '@reduxjs/toolkit';

const storedLista = localStorage.getItem('listaActiva');
const storedHistorialId = localStorage.getItem('historialId');

const initialState = {
  listaActiva: storedLista ? JSON.parse(storedLista) : null,
  historialId: storedHistorialId || null,
};

const listasSlice = createSlice({
  name: 'listas',
  initialState,
  reducers: {
    setListaActiva: (state, action) => {
      state.listaActiva = action.payload;
      localStorage.setItem('listaActiva', JSON.stringify(action.payload));
    },
    borrarListaActiva: (state) => {
      state.listaActiva = null;
      localStorage.removeItem('listaActiva');
    },
    setHistorialId: (state, action) => {
      state.historialId = action.payload;
      localStorage.setItem('historialId', action.payload);
    },
    borrarHistorialId: (state) => {
      state.historialId = null;
      localStorage.removeItem('historialId');
    },
  },
});

export const { setListaActiva, borrarListaActiva, setHistorialId, borrarHistorialId } = listasSlice.actions;

export default listasSlice.reducer;